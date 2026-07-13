import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LocationMapProps } from './location-map.types';

export function LocationMap({ coordinate }: LocationMapProps) {
  const query = encodeURIComponent(`${coordinate.latitude},${coordinate.longitude}`);

  return (
    <View style={styles.container}>
      {createElement('iframe', {
        allowFullScreen: true,
        loading: 'lazy',
        src: `https://maps.google.com/maps?q=${query}&z=16&output=embed`,
        style: { border: 0, height: '100%', width: '100%' },
        title: 'Your current location',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDE3E5' },
});
