import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SalonMapProps } from './salon-map.types';

export function SalonMap({ salons }: SalonMapProps) {
  const data = JSON.stringify(salons).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}.salon-marker{width:38px;height:38px;border-radius:50%;background:#A94F67;border:3px solid white;box-shadow:0 3px 10px #0005;color:white;display:grid;place-items:center;font-size:20px}.legend{position:absolute;z-index:999;left:14px;bottom:14px;background:white;border-radius:12px;padding:9px 12px;font:700 12px system-ui;color:#292326}</style></head><body><div id="map"></div><div class="legend">✂ FaceFit salon</div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const salons=${data};const map=L.map('map').setView([14.0667,120.6333],12);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);const icon=L.divIcon({className:'',html:'<div class="salon-marker">✂</div>',iconSize:[44,44],iconAnchor:[22,22]});const bounds=[];salons.forEach(s=>{L.marker([s.latitude,s.longitude],{icon}).addTo(map).bindPopup('<b>'+s.name.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</b><br>'+s.address.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));bounds.push([s.latitude,s.longitude])});if(bounds.length)map.fitBounds(bounds,{padding:[40,40],maxZoom:16});</script></body></html>`;
  return <View style={styles.container}>{createElement('iframe', { srcDoc: html, style: { border: 0, height: '100%', width: '100%' }, title: 'Nasugbu salon map' })}</View>;
}

const styles = StyleSheet.create({ container: { height: 470, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EDE3E5' } });
