import { useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { mapaHtml } from '@/constants/mapa-html';
import type { Posicion } from '@/hooks/useSeguimientoUbicacion';
export interface MapaProps {
  posicion: Posicion | null;
  centrar: number;
  onEstado: (estado: string) => void;
}
export default function MapaVista({ posicion, centrar, onEstado }: MapaProps) {
  const ref = useRef<WebView<object>>(null);
  const enviar = () => ref.current?.postMessage(JSON.stringify({ posicion, centrar: true }));
  useEffect(() => {
    ref.current?.postMessage(JSON.stringify({ posicion, centrar: !!centrar }));
  }, [posicion, centrar]);
  return (
    <WebView<object>
      ref={ref}
      source={{ html: mapaHtml }}
      originWhitelist={['*']}
      javaScriptEnabled
      onError={() => onEstado('error')}
      onHttpError={() => onEstado('error')}
      onMessage={(e) => {
        try {
          const msg: { tipo: string } = JSON.parse(e.nativeEvent.data);
          onEstado(msg.tipo);
          if (msg.tipo === 'cargado') enviar();
        } catch {
          onEstado('error');
        }
      }}
      style={{ flex: 1, backgroundColor: '#e6ecf5' }}
    />
  );
}
