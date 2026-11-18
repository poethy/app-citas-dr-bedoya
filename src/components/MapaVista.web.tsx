import { useEffect, useRef } from 'react';
import { mapaHtml } from '@/constants/mapa-html';
import type { MapaProps } from './MapaVista';
export default function MapaVista({ posicion, centrar, onEstado }: MapaProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    ref.current?.contentWindow?.postMessage(JSON.stringify({ posicion, centrar: !!centrar }), '*');
  }, [posicion, centrar]);
  useEffect(() => {
    const recibir = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      try {
        const d: { tipo: string } = JSON.parse(e.data);
        onEstado(d.tipo);
        if (d.tipo === 'cargado')
          ref.current?.contentWindow?.postMessage(JSON.stringify({ posicion, centrar: true }), '*');
      } catch {}
    };
    window.addEventListener('message', recibir);
    return () => window.removeEventListener('message', recibir);
  }, [onEstado, posicion]);
  return (
    <iframe
      ref={ref}
      title="Mapa de referencia en Pereira"
      srcDoc={mapaHtml}
      style={{ border: 0, width: '100%', height: '100%', minHeight: 320 }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
