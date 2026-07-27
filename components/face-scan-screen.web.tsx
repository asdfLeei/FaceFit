import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

type Landmark = { x: number; y: number; z: number };
type FaceLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { faceLandmarks: Landmark[][] };
  close: () => void;
};
type MediaPipeVision = {
  FaceLandmarker: { createFromOptions: (files: unknown, options: object) => Promise<FaceLandmarkerInstance> };
  FilesetResolver: { forVisionTasks: (path: string) => Promise<unknown> };
};

let visionPromise: Promise<MediaPipeVision> | null = null;
function loadMediaPipe() {
  if (visionPromise) return visionPromise;
  visionPromise = new Promise((resolve, reject) => {
    const key = '__faceFitMediaPipe';
    const browserWindow = window as typeof window & { [key: string]: MediaPipeVision };
    if (browserWindow[key]) return resolve(browserWindow[key]);
    const callback = `faceFitMediaPipeReady${Date.now()}`;
    const callbackWindow = window as typeof window & Record<string, unknown>;
    callbackWindow[callback] = (vision: MediaPipeVision) => {
      browserWindow[key] = vision;
      delete callbackWindow[callback];
      resolve(vision);
    };
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm'; window.${callback}({ FaceLandmarker, FilesetResolver });`;
    script.onerror = () => reject(new Error('MediaPipe could not be downloaded. Check your internet connection.'));
    document.head.appendChild(script);
  });
  return visionPromise;
}

type FaceScanScreenProps = {
  onBack: () => void;
  onCaptured: (photo: { uri: string; imageData: string }) => void;
};

type TrackingState = 'loading' | 'searching' | 'locked' | 'error';

export function FaceScanScreen({ onBack, onCaptured }: FaceScanScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastVideoTime = useRef(-1);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [tracking, setTracking] = useState<TrackingState>('loading');
  const [capturing, setCapturing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const stopCamera = useCallback(() => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }, []);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = overlayRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker) return;

    if (video.readyState >= 2 && video.currentTime !== lastVideoTime.current) {
      lastVideoTime.current = video.currentTime;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, width, height);
      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.faceLandmarks[0];
      setTracking(landmarks ? 'locked' : 'searching');

      if (context && landmarks) {
        const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
        const renderedWidth = video.videoWidth * scale;
        const renderedHeight = video.videoHeight * scale;
        const offsetX = (width - renderedWidth) / 2;
        const offsetY = (height - renderedHeight) / 2;
        context.fillStyle = '#70FFD7';
        context.shadowColor = '#003C32';
        context.shadowBlur = 3;
        for (const point of landmarks) {
          context.beginPath();
          context.arc(offsetX + point.x * renderedWidth, offsetY + point.y * renderedHeight, 1.45, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
    animationRef.current = requestAnimationFrame(drawFrame);
  }, []);

  useEffect(() => {
    let disposed = false;
    async function start() {
      stopCamera();
      setTracking('loading');
      setErrorText('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera access.');
        if (!landmarkerRef.current) {
          const mediaPipe = await loadMediaPipe();
          const vision = await mediaPipe.FilesetResolver.forVisionTasks(WASM_URL);
          landmarkerRef.current = await mediaPipe.FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.55,
            minFacePresenceConfidence: 0.55,
            minTrackingConfidence: 0.55,
          });
        }
        if (disposed) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: facing }, width: { ideal: 720 }, height: { ideal: 1280 } },
        });
        if (disposed) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setTracking('searching');
        animationRef.current = requestAnimationFrame(drawFrame);
      } catch (error) {
        setTracking('error');
        setErrorText(error instanceof Error ? error.message : 'Camera or face tracking could not start.');
      }
    }
    void start();
    return () => {
      disposed = true;
      stopCamera();
    };
  }, [drawFrame, facing, stopCamera]);

  useEffect(() => () => landmarkerRef.current?.close(), []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || capturing) return;
    setCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');
      if (facing === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.82);
      onCaptured({ uri: imageData, imageData });
    } finally {
      setCapturing(false);
    }
  };

  const pickImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = String(reader.result);
        onCaptured({ uri: imageData, imageData });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const mirrorStyle = facing === 'user' ? ({ transform: 'scaleX(-1)' } as const) : undefined;
  const statusText = tracking === 'loading' ? 'Loading face tracker' : tracking === 'locked' ? 'Face landmarks locked' : tracking === 'error' ? 'Tracking unavailable' : 'Center your face';

  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.headerButton}><Ionicons name="chevron-back" size={23} color="#fff" /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerTitle}>Face scan</Text><Text style={styles.headerSubtitle}>Live processing stays in this browser</Text></View>
          <View style={styles.secureIcon}><Ionicons name="shield-checkmark-outline" size={21} color="#fff" /></View>
        </View>

        <View style={styles.preview}>
          <video ref={videoRef} autoPlay muted playsInline style={{ ...webStyles.media, ...mirrorStyle }} />
          <canvas ref={overlayRef} style={{ ...webStyles.media, ...webStyles.overlay, ...mirrorStyle }} />
          <View pointerEvents="none" style={styles.guideArea}>
            <View style={styles.statusPill}>
              {tracking === 'loading' ? <ActivityIndicator size="small" color="#fff" /> : <View style={[styles.statusDot, tracking === 'locked' && styles.statusDotReady, tracking === 'error' && styles.statusDotError]} />}
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
            <View style={[styles.faceGuide, tracking === 'locked' && styles.faceGuideHidden]} />
            <View style={styles.tipPill}><Ionicons name="sunny-outline" size={15} color="#fff" /><Text style={styles.tip}>{errorText || 'Face forward · remove glasses · use even light'}</Text></View>
          </View>

          <View style={styles.controls}>
            <Pressable accessibilityRole="button" onPress={pickImage} style={styles.toolButton}><Ionicons name="images-outline" size={23} color="#fff" /><Text style={styles.toolLabel}>Gallery</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={tracking === 'loading' || tracking === 'error'} onPress={takePhoto} style={[styles.shutter, (tracking === 'loading' || tracking === 'error') && styles.disabled]}><View style={styles.shutterInner}>{capturing && <ActivityIndicator color="#fff" />}</View></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setFacing(current => current === 'user' ? 'environment' : 'user')} style={styles.toolButton}><Ionicons name="camera-reverse-outline" size={25} color="#fff" /><Text style={styles.toolLabel}>Flip</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const webStyles = {
  media: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as const,
  overlay: { pointerEvents: 'none' } as const,
};

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%', backgroundColor: '#171315' },
  safe: { flex: 1 },
  header: { height: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#171315' },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2427' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: '#BDAEB2', fontSize: 11, marginTop: 2 },
  secureIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  preview: { flex: 1, overflow: 'hidden', backgroundColor: '#292326' },
  guideArea: { ...StyleSheet.absoluteFillObject, paddingTop: 28, paddingBottom: 148, alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { height: 34, paddingHorizontal: 13, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(20,16,18,0.72)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D4A746' },
  statusDotReady: { backgroundColor: '#64B68B' },
  statusDotError: { backgroundColor: '#E16B6B' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  faceGuide: { width: 230, height: 306, maxHeight: '68%', borderRadius: 115, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.025)' },
  faceGuideHidden: { opacity: 0 },
  tipPill: { minHeight: 34, maxWidth: '92%', paddingHorizontal: 12, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(20,16,18,0.7)' },
  tip: { color: '#fff', fontSize: 11, fontWeight: '700' },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 132, paddingHorizontal: 28, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(20,16,18,0.88)' },
  toolButton: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', gap: 5 },
  toolLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A94F67' },
  disabled: { opacity: 0.48 },
});
