import { createElement, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SalonLocationPickerProps } from './salon-location-picker.types';

const messageType = 'facefit-salon-location-selected';
export function SalonLocationPicker({ latitude, longitude, onChange }: SalonLocationPickerProps) {
  useEffect(() => { const receive = (event: MessageEvent) => { if (event.data?.type === messageType && Number.isFinite(event.data.latitude) && Number.isFinite(event.data.longitude)) onChange({ latitude:event.data.latitude, longitude:event.data.longitude }); }; window.addEventListener('message', receive); return () => window.removeEventListener('message', receive); }, [onChange]);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}.hint{position:absolute;z-index:999;left:12px;bottom:12px;background:#fff;padding:8px 11px;border-radius:11px;font:800 11px system-ui;color:#743548;box-shadow:0 2px 9px #0002}</style></head><body><div id="map"></div><div class="hint">Click the map or drag the pin</div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const map=L.map('map').setView([${latitude},${longitude}],14);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);const marker=L.marker([${latitude},${longitude}],{draggable:true}).addTo(map);const send=p=>parent.postMessage({type:'${messageType}',latitude:p.lat,longitude:p.lng},'*');map.on('click',e=>{marker.setLatLng(e.latlng);send(e.latlng)});marker.on('dragend',()=>send(marker.getLatLng()));</script></body></html>`;
  return <View style={styles.container}>{createElement('iframe',{srcDoc:html,title:'Choose salon location',style:{border:0,width:'100%',height:'100%'}})}</View>;
}
const styles=StyleSheet.create({container:{height:300,borderRadius:20,overflow:'hidden',marginBottom:14,backgroundColor:'#EDE3E5'}});
