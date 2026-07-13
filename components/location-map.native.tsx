import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { LocationMapProps } from './location-map.types';

const regionDelta = 0.012;

export function LocationMap({ coordinate }: LocationMapProps) {
  const map = useRef<MapView>(null);

  const recenter = () => {
    map.current?.animateToRegion({
      ...coordinate,
      latitudeDelta: regionDelta,
      longitudeDelta: regionDelta,
    }, 350);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={map}
        initialRegion={{
          ...coordinate,
          latitudeDelta: regionDelta,
          longitudeDelta: regionDelta,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}>
        <Marker coordinate={coordinate} pinColor="#A94F67" title="You are here" />
      </MapView>
      <Pressable
        accessibilityLabel="Recenter map on my location"
        accessibilityRole="button"
        onPress={recenter}
        style={({ pressed }) => [styles.recenterButton, pressed && styles.pressed]}>
        <Ionicons name="locate" size={22} color="#A94F67" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  recenterButton: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE3E5',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});
