import base64
import binascii
import math
import re
import sys
import threading
import types

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# MediaPipe imports pyplot for optional landmark visualization. The API never
# draws plots; a tiny placeholder avoids loading Matplotlib on locked-down
# Windows machines where its native DLLs may be blocked by application policy.
if "matplotlib.pyplot" not in sys.modules:
    matplotlib_stub = types.ModuleType("matplotlib")
    pyplot_stub = types.ModuleType("matplotlib.pyplot")
    matplotlib_stub.pyplot = pyplot_stub
    sys.modules["matplotlib"] = matplotlib_stub
    sys.modules["matplotlib.pyplot"] = pyplot_stub

import mediapipe as mp

app = FastAPI(title="FaceFit face analysis", version="1.0.0")
face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=2,
    refine_landmarks=True,
    min_detection_confidence=0.65,
)
face_mesh_lock = threading.Lock()


class AnalysisRequest(BaseModel):
    imageData: str
    stylePreference: str = "unisex"
    hairType: str | None = None
    hairLength: str | None = None
    hairTexture: str | None = None


WOMEN_RECOMMENDATIONS = {
    "oval": [("Soft Layered Lob", 96, "Preserves balanced proportions while adding movement."), ("Textured Pixie", 92, "Highlights cheekbones without overwhelming the face."), ("Curtain Layers", 89, "Adds soft framing to a naturally balanced shape."), ("Curly Shag", 86, "Builds flattering volume through the sides.")],
    "round": [("Long Face-Framing Layers", 96, "Creates vertical lines that visually lengthen the face."), ("Side-Swept Lob", 92, "An offset part adds angles and definition."), ("Textured Pixie", 88, "Height at the crown balances fuller cheeks."), ("Asymmetrical Bob", 85, "A diagonal silhouette creates definition.")],
    "square": [("Soft Wavy Layers", 96, "Soft movement balances a defined jawline."), ("Curtain Bangs", 92, "Curved framing softens forehead and jaw angles."), ("Layered Lob", 89, "Length below the jaw keeps the outline fluid."), ("Side-Parted Shag", 85, "Texture and an offset part soften symmetry.")],
    "heart": [("Chin-Length Bob", 96, "Volume near the jaw balances a wider forehead."), ("Side-Swept Fringe", 92, "Soft diagonal framing complements the forehead."), ("Collarbone Layers", 89, "Movement around the lower face adds balance."), ("Textured Lob", 86, "Fullness near the ends supports a narrower chin.")],
    "oblong": [("Curtain Bangs", 96, "Breaks up facial length while keeping soft framing."), ("Wavy Shoulder Cut", 93, "Side volume balances longer proportions."), ("Rounded Bob", 89, "A curved outline adds width around the cheeks."), ("Layered Shag", 86, "Texture through the sides creates balance.")],
    "diamond": [("Chin-Length Bob", 96, "Adds fullness below prominent cheekbones."), ("Side-Swept Bangs", 92, "Softens the forehead while showing the cheekbones."), ("Shoulder-Length Layers", 89, "Balances a narrower forehead and chin."), ("Textured Pixie", 85, "Soft top texture complements angular cheekbones.")],
}

MEN_RECOMMENDATIONS = {
    "oval": [("Textured Crop", 96, "Adds definition while preserving balanced proportions."), ("Classic Side Part", 92, "Works naturally with an evenly proportioned face."), ("Modern Quiff", 89, "Adds controlled height without making the face look too long."), ("Short Pompadour", 86, "Highlights the balanced forehead and jaw.")],
    "round": [("High Fade with Volume", 96, "Short sides and height on top visually lengthen the face."), ("Angular Fringe", 92, "Creates definition and breaks up rounded proportions."), ("Textured Quiff", 89, "Adds height and structure above fuller cheeks."), ("Side-Part Undercut", 86, "Strong side contrast gives the face a sharper outline.")],
    "square": [("Textured Crew Cut", 96, "Complements a strong jaw without making the outline too severe."), ("Classic Side Part", 92, "Balances angular features with clean structure."), ("Short Quiff", 89, "Adds height while keeping the jawline prominent."), ("Low Fade Crop", 86, "A softer fade complements the broad forehead and jaw.")],
    "heart": [("Textured Fringe", 96, "Softens a broader forehead and adds balance near the temples."), ("Medium Side Sweep", 92, "Diagonal movement balances a narrower chin."), ("Low Fade Quiff", 89, "Keeps some side fullness while adding controlled height."), ("Layered Bro Flow", 86, "Adds width around the lower sides of the face.")],
    "oblong": [("Side-Swept Crop", 96, "Keeps height controlled and adds horizontal movement."), ("Caesar Cut", 92, "A forward fringe visually shortens longer proportions."), ("Medium Textured Fringe", 89, "Adds width without extra height at the crown."), ("Classic Taper", 86, "Maintains balanced side volume for a longer face.")],
    "diamond": [("Textured Fringe", 96, "Adds width near the forehead while complementing defined cheekbones."), ("Side-Part Taper", 92, "Balances a narrower forehead and jaw."), ("Messy Medium Crop", 89, "Soft texture reduces sharp transitions around the cheekbones."), ("Bro Flow", 86, "Adds natural fullness around the temples and jaw.")],
}


def distance(a, b, image_width, image_height):
    """Measure in pixels; normalized x/y use different image dimensions."""
    return math.hypot(
        (a.x - b.x) * image_width,
        (a.y - b.y) * image_height,
    )


def classify(length_ratio, jaw_ratio, forehead_ratio):
    # Ratios make the decision independent of camera distance and image size.
    # Length is measured in pixel-corrected coordinates, so portrait photos no
    # longer make every face appear artificially short.
    if length_ratio >= 1.43:
        return "oblong", min(0.95, 0.74 + (length_ratio - 1.43) * 0.8)
    if forehead_ratio >= 0.91 and jaw_ratio <= 0.78:
        return "heart", min(0.94, 0.72 + (forehead_ratio - jaw_ratio) * 0.7)
    if forehead_ratio <= 0.78 and jaw_ratio <= 0.77:
        return "diamond", min(0.93, 0.73 + (0.78 - forehead_ratio) * 0.8)

    # A compact face whose jaw and forehead are both close to the cheek width
    # is square even when the jaw does not reach .88. Keep a narrow lower
    # length bound so the earlier .82x normalized / ~1.09x corrected Oval
    # example is not pulled back into Square.
    if 1.11 <= length_ratio <= 1.32 and jaw_ratio >= 0.82 and forehead_ratio >= 0.82:
        evenness = 1 - min(1, abs(jaw_ratio - forehead_ratio) / 0.10)
        breadth = min(1, (min(jaw_ratio, forehead_ratio) - 0.82) / 0.12)
        return "square", min(0.93, 0.78 + evenness * 0.08 + breadth * 0.05)

    # Oval faces commonly have moderately tapered jaws and foreheads. Test
    # this before Square because the previous broad Square condition captured
    # most balanced faces (including jaw=.83, forehead=.85 scans).
    if length_ratio >= 1.07 and jaw_ratio < 0.88 and 0.79 <= forehead_ratio <= 0.92:
        length_score = 1 - min(1, abs(length_ratio - 1.25) / 0.22)
        taper_score = 1 - min(1, abs(jaw_ratio - 0.82) / 0.12)
        return "oval", min(0.93, 0.75 + length_score * 0.10 + taper_score * 0.06)

    # Square needs a genuinely broad jaw and forehead, not merely values above
    # .79/.80, which are also normal for Oval faces.
    if jaw_ratio >= 0.88 and forehead_ratio >= 0.84 and length_ratio < 1.43:
        confidence = 0.75 + (jaw_ratio - 0.88) * 1.2 + (forehead_ratio - 0.84) * 0.4
        return "square", min(0.94, confidence)
    if length_ratio <= 1.10:
        return "round", min(0.93, 0.76 + (1.10 - length_ratio) * 0.7)
    return "oval", 0.78


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(payload: AnalysisRequest):
    image_data = payload.imageData.strip()
    match = re.fullmatch(
        r"data:image/(jpeg|jpg|png|webp);base64,(.+)",
        image_data,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        raise HTTPException(400, "The camera returned an unsupported image format. Use JPG, PNG, or WebP.")
    try:
        encoded = re.sub(r"\s+", "", match.group(2))
        raw = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(400, "The image encoding is invalid.")
    if not raw or len(raw) > 4 * 1024 * 1024:
        raise HTTPException(400, "The image must be smaller than 4 MB.")

    image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(400, "The uploaded file is not a readable image.")
    with face_mesh_lock:
        detection = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    faces = detection.multi_face_landmarks or []
    if not faces:
        raise HTTPException(422, "No face was detected. Face forward in even light and try again.")
    if len(faces) > 1:
        raise HTTPException(422, "More than one face was detected. Use a photo containing only you.")

    points = faces[0].landmark
    image_height, image_width = image.shape[:2]
    face_length = distance(points[10], points[152], image_width, image_height)
    cheek_width = distance(points[234], points[454], image_width, image_height)
    forehead_width = distance(points[54], points[284], image_width, image_height)
    jaw_width = distance(points[172], points[397], image_width, image_height)
    if cheek_width <= 0.01:
        raise HTTPException(422, "The face is too small in the image. Move closer and try again.")

    length_ratio = face_length / cheek_width
    jaw_ratio = jaw_width / cheek_width
    forehead_ratio = forehead_width / cheek_width
    shape, confidence = classify(length_ratio, jaw_ratio, forehead_ratio)
    # A lower classification confidence slightly lowers every match instead of
    # presenting the same fixed percentages for every scan.
    if payload.stylePreference == "unisex":
        recommendation_catalog = [
            (*recommendation, "women") for recommendation in WOMEN_RECOMMENDATIONS[shape]
        ] + [
            (*recommendation, "men") for recommendation in MEN_RECOMMENDATIONS[shape]
        ]
    else:
        audience = "women" if payload.stylePreference == "women" else "men"
        catalog = WOMEN_RECOMMENDATIONS if audience == "women" else MEN_RECOMMENDATIONS
        recommendation_catalog = [(*recommendation, audience) for recommendation in catalog[shape]]
    suggestions = [
        {
            "name": name,
            "score": round(score * (0.88 + confidence * 0.12)),
            "reason": reason,
            "audience": audience,
        }
        for name, score, reason, audience in recommendation_catalog
    ]
    return {
        "faceShape": shape,
        "stylePreference": payload.stylePreference,
        "confidence": round(confidence, 2),
        "imageSize": {"width": int(image.shape[1]), "height": int(image.shape[0])},
        "landmarks": [
            {"x": round(point.x, 5), "y": round(point.y, 5), "z": round(point.z, 5)}
            for point in points
        ],
        "measurements": {
            "lengthToWidth": round(length_ratio, 3),
            "jawToCheek": round(jaw_ratio, 3),
            "foreheadToCheek": round(forehead_ratio, 3),
        },
        "recommendations": suggestions,
    }
