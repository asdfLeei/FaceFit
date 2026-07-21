# FaceFit face-analysis service

This service detects 478 MediaPipe facial landmarks and classifies facial shape from normalized facial proportions. It does not identify the person and does not retain the photo.

## Run locally

```powershell
cd FaceFit/face-analysis-service
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

The Node API calls `http://127.0.0.1:8000` by default. Override it with `FACE_ANALYSIS_URL` in `server/.env`.

