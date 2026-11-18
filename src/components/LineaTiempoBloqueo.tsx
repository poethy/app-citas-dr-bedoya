import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { Franja } from '@/models';
import { horaTexto, MINUTO } from '@/utils/fechas';
import { seleccionarTramoDeBloqueo } from '@/utils/franjas';
import { Texto } from './ui';

const ALTO_FRANJA = 16;
const PASO = 15 * MINUTO;

function crearArrastre(
  apertura: number,
  cantidad: number,
  horasLibres: string,
  mostrar: (rango: Franja | null) => void,
  confirmar: (rango: Franja) => void,
) {
  const disponibles = horasLibres
    .split(',')
    .filter(Boolean)
    .map((inicio) => ({
      inicio,
      fin: new Date(Date.parse(inicio) + PASO).toISOString(),
    }));
  const hora = (indice: number) =>
    new Date(apertura + Math.max(0, Math.min(cantidad, indice)) * PASO).toISOString();
  let ancla = '';
  const rangoHasta = (y: number) =>
    seleccionarTramoDeBloqueo(disponibles, ancla, hora(Math.round(y / ALTO_FRANJA)));

  return Gesture.Pan()
    .minDistance(0)
    .maxPointers(1)
    .shouldCancelWhenOutside(false)
    .runOnJS(true)
    .onBegin(({ y }) => {
      ancla = hora(Math.floor(y / ALTO_FRANJA));
      mostrar(rangoHasta(y));
    })
    .onUpdate(({ y }) => mostrar(rangoHasta(y)))
    .onEnd(({ y }, exitoso) => {
      const rango = exitoso ? rangoHasta(y) : null;
      if (rango) confirmar(rango);
    })
    .onFinalize(() => mostrar(null));
}

export function duracionBloqueo({ inicio, fin }: Franja): string {
  const minutos = (Date.parse(fin) - Date.parse(inicio)) / MINUTO;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const partes: string[] = [];
  if (horas) partes.push(horas === 1 ? '1 hora' : `${horas} horas`);
  if (resto) partes.push(resto === 1 ? '1 minuto' : `${resto} minutos`);
  return partes.join(' y ');
}

export default function LineaTiempoBloqueo({
  horario,
  franjas,
  seleccion,
  onSeleccionar,
}: {
  horario: Franja;
  franjas: Franja[];
  seleccion: Franja | null;
  onSeleccionar: (rango: Franja) => void;
}) {
  const apertura = Date.parse(horario.inicio);
  const cantidad = (Date.parse(horario.fin) - apertura) / PASO;
  const [vistaPrevia, setVistaPrevia] = useState<Franja | null>(null);
  const horasLibres = franjas.map((franja) => franja.inicio).join(',');

  // Mantiene el gesto mientras se actualiza el reloj si la disponibilidad sigue igual.
  const arrastre = useMemo(
    () => crearArrastre(apertura, cantidad, horasLibres, setVistaPrevia, onSeleccionar),
    [apertura, cantidad, horasLibres, onSeleccionar],
  );

  const rango = vistaPrevia ?? seleccion;
  const horas = Array.from({ length: cantidad }, (_, i) =>
    new Date(apertura + i * PASO).toISOString(),
  );
  const disponiblesPorInicio = new Set(franjas.map((f) => f.inicio));

  return (
    <View
      className="gap-2"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Texto className="text-xs text-muted">
        Arrastra sobre la cuadrícula. Desliza por la columna de horas para desplazarte.
      </Texto>
      <View className="flex-row rounded-xl border border-line bg-white pt-2 pb-5">
        <View className="w-24 px-2" pointerEvents="none">
          {horas
            .filter((_, i) => i % 4 === 0)
            .map((hora) => (
              <View key={hora} style={{ height: ALTO_FRANJA * 4 }}>
                <Texto className="text-xs text-muted">{horaTexto(hora)}</Texto>
              </View>
            ))}
          <Texto
            className="absolute left-2 text-xs text-muted"
            style={{ top: cantidad * ALTO_FRANJA - 8 }}
          >
            {horaTexto(horario.fin)}
          </Texto>
        </View>
        <GestureDetector gesture={arrastre} touchAction="none">
          <View
            collapsable={false}
            className="flex-1 mr-2 bg-white"
            style={{ height: cantidad * ALTO_FRANJA }}
          >
            {horas.map((hora, i) => (
              <View
                key={hora}
                pointerEvents="none"
                className={disponiblesPorInicio.has(hora) ? 'bg-white' : 'bg-navy-100'}
                style={{
                  height: ALTO_FRANJA,
                  borderTopWidth: 1,
                  borderColor: i % 4 === 0 ? '#9aa1ae' : '#e5eaf2',
                }}
              />
            ))}
            {rango && (
              <View
                pointerEvents="none"
                className="absolute left-0 right-0 rounded bg-navy-900 opacity-80"
                style={{
                  top: ((Date.parse(rango.inicio) - apertura) / PASO) * ALTO_FRANJA,
                  height: ((Date.parse(rango.fin) - Date.parse(rango.inicio)) / PASO) * ALTO_FRANJA,
                }}
              />
            )}
          </View>
        </GestureDetector>
      </View>
      <Texto className="text-xs text-muted">Las zonas sombreadas no están disponibles.</Texto>
      {rango && (
        <Texto className="font-medium">
          {horaTexto(rango.inicio)} – {horaTexto(rango.fin)} · {duracionBloqueo(rango)}
        </Texto>
      )}
    </View>
  );
}
