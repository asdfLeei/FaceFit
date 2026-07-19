import { createElement, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SalonMapProps } from './salon-map.types';

const messageType = 'facefit-salon-selected';

export function SalonMap({ salons, onSelectSalon }: SalonMapProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const receiveSelection = (event: MessageEvent) => {
      if (event.data?.type === messageType && Number.isFinite(event.data.salonId)) onSelectSalon?.(event.data.salonId);
    };
    window.addEventListener('message', receiveSelection);
    return () => window.removeEventListener('message', receiveSelection);
  }, [onSelectSalon]);

  const data = JSON.stringify(salons).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0;font-family:system-ui,sans-serif}.leaflet-container{background:#f1e8e9}.salon-wrap{position:relative;width:48px;height:48px}.salon-marker{width:44px;height:44px;border-radius:15px;background:#A94F67;border:3px solid #fff;box-shadow:0 4px 14px #3b202966;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;font-weight:900;overflow:hidden}.salon-marker img{width:100%;height:100%;object-fit:cover}.salon-marker svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2}.salon-marker small{font-size:7px;line-height:8px;letter-spacing:.5px}.salon-label{position:absolute;left:50%;top:48px;transform:translateX(-50%);width:max-content;max-width:150px;padding:4px 7px;border-radius:7px;background:#fff;color:#432833;box-shadow:0 2px 8px #0003;font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.legend{position:absolute;z-index:999;left:14px;bottom:14px;background:#fff;border-radius:13px;padding:9px 12px;box-shadow:0 3px 12px #0002;font-size:12px;font-weight:750;color:#292326}.legend b{color:#A94F67}.leaflet-popup-content{line-height:1.45}.open-button{display:block;width:100%;margin-top:9px;border:0;border-radius:8px;background:#A94F67;color:#fff;padding:7px 10px;font-weight:800;cursor:pointer}</style></head><body><div id="map"></div><div class="legend"><b>F</b> FaceFit salon</div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const salons=${data};const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const initials=name=>String(name).split(/\\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();const storefront='<svg viewBox="0 0 24 24"><path d="M4 10v10h16V10M3 10l2-6h14l2 6M8 20v-6h8v6M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0"/></svg>';const map=L.map('map').setView([14.0667,120.6333],12);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);const bounds=[];salons.forEach(s=>{const markerContent=s.profileImageUrl?'<img src="'+escapeHtml(s.profileImageUrl)+'" alt="">':storefront+'<small>'+escapeHtml(initials(s.name))+'</small>';const logo='<div class="salon-wrap"><div class="salon-marker">'+markerContent+'</div><div class="salon-label">'+escapeHtml(s.name)+'</div></div>';const icon=L.divIcon({className:'',html:logo,iconSize:[48,70],iconAnchor:[24,44],popupAnchor:[0,-42]});const marker=L.marker([s.latitude,s.longitude],{icon}).addTo(map);marker.bindPopup('<b>'+escapeHtml(s.name)+'</b><br>'+escapeHtml(s.address)+'<button class="open-button" data-salon-id="'+Number(s.id)+'">View salon</button>');bounds.push([s.latitude,s.longitude])});document.addEventListener('click',event=>{const button=event.target.closest('[data-salon-id]');if(button)parent.postMessage({type:'${messageType}',salonId:Number(button.dataset.salonId)},'*')});if(bounds.length)map.fitBounds(bounds,{padding:[55,55],maxZoom:16});</script></body></html>`;
  const mapHtml = html.replace('</body>', `<script>
const userIcon=L.divIcon({className:'',html:'<div style="width:24px;height:24px;border:5px solid #fff;border-radius:50%;background:#4c86d9;box-shadow:0 0 0 8px #4c86d933,0 3px 10px #0004"></div>',iconSize:[34,34],iconAnchor:[17,17]});
map.on('locationfound',event=>L.marker(event.latlng,{icon:userIcon,zIndexOffset:1000}).addTo(map).bindPopup('<b>You are here</b>'));
map.locate({enableHighAccuracy:true,setView:false});
</script></body>`);
  return <View style={styles.container}>{createElement('iframe', { allow: 'geolocation', srcDoc: mapHtml, style: { border: 0, height: '100%', width: '100%' }, title: `Map of ${salons.length} Nasugbu salons` })}</View>;
}

const styles = StyleSheet.create({ container: { height: 470, borderRadius: 22, overflow: 'hidden', backgroundColor: '#EDE3E5' } });
