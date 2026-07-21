import { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';

type Props = {
  uri: string;
  imageSize: { width: number; height: number };
  landmarks: { x: number; y: number; z: number }[];
};

export function FaceLandmarkOverlay({ uri, imageSize, landmarks }: Props) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport(current => current.width === width && current.height === height ? current : { width, height });
  };

  const scale = viewport.width && viewport.height
    ? Math.max(viewport.width / imageSize.width, viewport.height / imageSize.height)
    : 0;
  const renderedWidth = imageSize.width * scale;
  const renderedHeight = imageSize.height * scale;
  const offsetX = (viewport.width - renderedWidth) / 2;
  const offsetY = (viewport.height - renderedHeight) / 2;

  return <View onLayout={onLayout} style={styles.container}>
    <Image source={{ uri }} style={styles.image} />
    {scale > 0 && landmarks.map((point, index) => {
      const left = offsetX + point.x * renderedWidth;
      const top = offsetY + point.y * renderedHeight;
      if (left < -2 || top < -2 || left > viewport.width + 2 || top > viewport.height + 2) return null;
      return <View key={index} pointerEvents="none" style={[styles.point, { left: left - 1.5, top: top - 1.5 }]} />;
    })}
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#292326' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  point: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#7CFFD5', shadowColor: '#003D31', shadowOpacity: .9, shadowRadius: 2, elevation: 2 },
});
