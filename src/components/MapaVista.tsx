import { useEffect, useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { crearMapaHtml, PUNTO_REFERENCIA, type PuntoMapa } from '@/constants/mapa-html';
import type { Posicion } from '@/hooks/useSeguimientoUbicacion';
export interface MapaProps {
  posicion: Posicion | null;
  centrar: number;
  onEstado: (estado: string) => void;
  /** Ubicación del consultorio; sin ella se usa el punto de referencia. */
  punto?: PuntoMapa | null;
  etiqueta?: string;
}
export default function MapaVista({ posicion, centrar, onEstado, punto, etiqueta }: MapaProps) {
  const html = useMemo(
    () =>
      crearMapaHtml(
        punto ?? PUNTO_REFERENCIA,
        etiqueta ?? 'Referencia en Pereira · coordenadas por confirmar',
      ),
    [punto, etiqueta],
  );
  const ref = useRef<WebView<object>>(null);
  const enviar = () => ref.current?.postMessage(JSON.stringify({ posicion, centrar: true }));
  useEffect(() => {
    ref.current?.postMessage(JSON.stringify({ posicion, centrar: !!centrar }));
  }, [posicion, centrar]);
  return (
    <WebView<object>
      ref={ref}
      source={{ html }}
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
