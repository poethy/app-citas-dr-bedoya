// Punto de referencia del centro de Pereira. No representa coordenadas verificadas del consultorio.
export const PUNTO_REFERENCIA = { latitude: 4.8143, longitude: -75.6946 };
export interface PuntoMapa {
  latitude: number;
  longitude: number;
}
/** Texto seguro para meterlo en el HTML del mapa. */
const escapar = (t: string): string => JSON.stringify(t).replace(/</g, '\\u003c');
/** HTML de Leaflet con el marcador del consultorio en `punto` (MP01). */
export const crearMapaHtml = (
  punto: PuntoMapa,
  etiqueta: string,
): string => `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0;background:#e6ecf5;font-family:Arial,sans-serif}.ref{background:#0b1f3a;color:white;border:3px solid white;border-radius:50%;width:30px!important;height:30px!important;text-align:center;line-height:30px;box-shadow:0 2px 8px #0003}.leaflet-tooltip{font-size:11px;border:0;border-radius:8px}</style></head><body><div id="map" aria-label="Mapa de referencia del consultorio"></div><script>
function emitir(tipo){const msg=JSON.stringify({tipo});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(msg);else window.parent.postMessage(msg,'*');}
window.onerror=function(){emitir('error')};
</script><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="emitir('error')"></script><script>
if(window.L){
const referencia=[${punto.latitude},${punto.longitude}];
const mapa=L.map('map',{zoomControl:false}).setView(referencia,16);L.control.zoom({position:'bottomright'}).addTo(mapa);
const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(mapa);
tiles.on('tileerror',()=>emitir('error'));tiles.on('load',()=>emitir('cargado'));
L.marker(referencia,{icon:L.divIcon({className:'ref',html:'CB',iconSize:[30,30]})}).addTo(mapa).bindTooltip(${escapar(etiqueta)},{permanent:true,direction:'top',offset:[0,-12]});
let paciente=null;
window.actualizar=function(d){if(d.posicion){const p=[d.posicion.latitude,d.posicion.longitude];if(!paciente)paciente=L.circleMarker(p,{radius:8,color:'white',weight:3,fillColor:'#2f5d9e',fillOpacity:1}).addTo(mapa).bindTooltip('Tu ubicación');else paciente.setLatLng(p);if(d.centrar)mapa.setView(p,16);}else if(d.centrar)mapa.setView(referencia,16);};
function recibir(e){try{window.actualizar(typeof e.data==='string'?JSON.parse(e.data):e.data)}catch{}}
window.addEventListener('message',recibir);document.addEventListener('message',recibir);emitir('cargado');
}
</script></body></html>`;

export const mapaHtml = crearMapaHtml(
  PUNTO_REFERENCIA,
  'Referencia en Pereira · coordenadas por confirmar',
);
