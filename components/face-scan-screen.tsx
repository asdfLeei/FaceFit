import { Ionicons } from '@expo/vector-icons';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  rose: '#A94F67',
  ink: '#292326',
  muted: '#BDAEB2',
  white: '#FFFFFF',
  dark: '#171315',
};

type FaceScanScreenProps = {
  onBack: () => void;
  onCaptured: (uri: string) => void;
};

export function FaceScanScreen({ onBack, onCaptured }: FaceScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const camera = useRef<CameraView>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) onCaptured(result.assets[0].uri);
  };

  const takePhoto = async () => {
    if (!camera.current || !cameraReady || capturing) return;

    setCapturing(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) onCaptured(photo.uri);
    } catch {
      Alert.alert('Photo not captured', 'Please hold still and try again.');
    } finally {
      setCapturing(false);
    }
  };

  const enableCamera = async () => {
    if (permission?.canAskAgain === false) {
      await Linking.openSettings();
      return;
    }
    await requestPermission();
  };

  return (
    <View style={styles.shell}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={23} color={colors.white} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Face scan</Text>
            <Text style={styles.headerSubtitle}>Private and processed securely</Text>
          </View>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.white} />
          </View>
        </View>

        {permission?.granted ? (
          <View style={styles.preview}>
            <CameraView
              ref={camera}
              active
              animateShutter
              facing={facing}
              mirror={facing === 'front'}
              mode="picture"
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => Alert.alert('Camera unavailable', 'Close other camera apps and try again.')}
              style={StyleSheet.absoluteFill}
            />

            <View pointerEvents="none" style={styles.previewShade} />
            <View pointerEvents="none" style={styles.guideArea}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, cameraReady && styles.statusDotReady]} />
                <Text style={styles.statusText}>{cameraReady ? 'Center your face' : 'Starting camera'}</Text>
              </View>
              <View style={styles.faceGuide}>
                <View style={[styles.guideCorner, styles.cornerTopLeft]} />
                <View style={[styles.guideCorner, styles.cornerTopRight]} />
                <View style={[styles.guideCorner, styles.cornerBottomLeft]} />
                <View style={[styles.guideCorner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.tip}>Face forward in soft, even light</Text>
            </View>

            <View style={styles.controls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose photo from gallery" onPress={pickImage} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
                <Ionicons name="images-outline" size={23} color={colors.white} />
                <Text style={styles.toolLabel}>Gallery</Text>
              </Pressable>

              <Pressable accessibilityRole="button" accessibilityLabel="Take photo" disabled={!cameraReady || capturing} onPress={takePhoto} style={({ pressed }) => [styles.shutter, (!cameraReady || capturing) && styles.disabled, pressed && styles.pressed]}>
                <View style={styles.shutterInner}>{capturing && <ActivityIndicator color={colors.white} />}</View>
              </Pressable>

              <Pressable accessibilityRole="button" accessibilityLabel="Flip camera" onPress={() => setFacing(current => current === 'front' ? 'back' : 'front')} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
                <Ionicons name="camera-reverse-outline" size={25} color={colors.white} />
                <Text style={styles.toolLabel}>Flip</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.permissionState}>
            {!permission ? <ActivityIndicator color={colors.rose} size="large" /> : <>
              <View style={styles.permissionIcon}>
                <Ionicons name="camera-outline" size={43} color={colors.rose} />
              </View>
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionBody}>Allow camera access for a guided face scan, or choose an existing photo.</Text>
              <Pressable accessibilityRole="button" onPress={enableCamera} style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}>
                <Ionicons name={permission.canAskAgain === false ? 'settings-outline' : 'camera-outline'} size={20} color={colors.white} />
                <Text style={styles.permissionButtonText}>{permission.canAskAgain === false ? 'Open settings' : 'Enable camera'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={pickImage} style={({ pressed }) => [styles.galleryChoice, pressed && styles.pressed]}>
                <Ionicons name="images-outline" size={20} color={colors.rose} />
                <Text style={styles.galleryChoiceText}>Choose from gallery</Text>
              </Pressable>
            </>}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const cornerBase = {
  position: 'absolute' as const,
  width: 32,
  height: 32,
  borderColor: colors.white,
};

const styles = StyleSheet.create({
  shell: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', backgroundColor: colors.dark },
  safe: { flex: 1 },
  header: { height: 70, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dark },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2427' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.white, fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  secureIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  preview: { flex: 1, overflow: 'hidden', backgroundColor: '#292326' },
  previewShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,12,14,0.08)' },
  guideArea: { ...StyleSheet.absoluteFillObject, paddingTop: 28, paddingBottom: 148, alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { height: 34, paddingHorizontal: 13, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(20,16,18,0.72)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D4A746' },
  statusDotReady: { backgroundColor: '#64B68B' },
  statusText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  faceGuide: { width: 230, height: 306, maxHeight: '68%', borderRadius: 115, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  guideCorner: cornerBase,
  cornerTopLeft: { top: 15, left: 15, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  cornerTopRight: { top: 15, right: 15, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  cornerBottomLeft: { bottom: 15, left: 15, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  cornerBottomRight: { right: 15, bottom: 15, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 14 },
  tip: { color: colors.white, fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 5 },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 132, paddingHorizontal: 28, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(20,16,18,0.88)' },
  toolButton: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', gap: 5 },
  toolLabel: { color: colors.white, fontSize: 11, fontWeight: '600' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rose },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.48 },
  permissionState: { flex: 1, paddingHorizontal: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F6' },
  permissionIcon: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7E4E8', marginBottom: 24 },
  permissionTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', marginBottom: 10 },
  permissionBody: { color: '#7C7074', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  permissionButton: { width: '100%', minHeight: 54, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rose },
  permissionButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  galleryChoice: { minHeight: 50, paddingHorizontal: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  galleryChoiceText: { color: colors.rose, fontSize: 14, fontWeight: '700' },
});
