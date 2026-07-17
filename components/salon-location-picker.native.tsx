import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { SalonLocationPickerProps } from './salon-location-picker.types';

export function SalonLocationPicker({ latitude, longitude, onChange }: SalonLocationPickerProps) {
  const coordinate = { latitude, longitude };
  const select = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => onChange(event.nativeEvent.coordinate);
  return <View style={styles.container}><MapView initialRegion={{ ...coordinate, latitudeDelta:.08, longitudeDelta:.08 }} onPress={select} style={StyleSheet.absoluteFill}><Marker coordinate={coordinate} draggable onDragEnd={select} title="Your salon" /></MapView><View pointerEvents="none" style={styles.hint}><Text style={styles.hintText}>Tap the map or drag the pin</Text></View></View>;
}
const styles = StyleSheet.create({ container:{height:300,borderRadius:20,overflow:'hidden',marginBottom:14},hint:{position:'absolute',left:12,bottom:12,backgroundColor:'#FFFFFF',borderRadius:11,paddingHorizontal:11,paddingVertical:8},hintText:{fontSize:11,fontWeight:'800',color:'#743548'} });
