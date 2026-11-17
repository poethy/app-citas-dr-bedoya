import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { Boton, Campo, ErrorAviso, Pantalla, Tarjeta, Texto } from '@/components/ui';
import Calendario from '@/components/Calendario';
import { fechaLocal, fechaTexto, horaTexto } from '@/utils/fechas';
import { repositorio } from '@/services/mock/repositorio';
import { cruza, ocupacion, horarioDia } from '@/utils/franjas';
export default function Bloqueos() {
  const { data } = useDatos();
  const [fecha, setFecha] = useState(fechaLocal()),
    [inicio, setInicio] = useState(''),
    [duracion, setDuracion] = useState('45'),
    [motivo, setMotivo] = useState('Ausencia');
  const crear = useAccion(repositorio.bloquear, 'Horario bloqueado.');
  const eliminar = useAccion(repositorio.eliminarBloqueo, 'Bloqueo eliminado.');
  const horario = horarioDia(fecha);
  const fin =
    inicio && /^\d+$/.test(duracion) && Number(duracion) > 0
      ? new Date(Date.parse(inicio) + Number(duracion) * 60000).toISOString()
      : '';
  const choque = !!(
    data &&
    inicio &&
    fin &&
    ocupacion(data, fecha).some((r) => cruza(r, { inicio, fin }))
  );
  const slots = horario
    ? Array.from(
        { length: (Date.parse(horario.fin) - Date.parse(horario.inicio)) / (15 * 60000) },
        (_, i) => new Date(Date.parse(horario.inicio) + i * 15 * 60000).toISOString(),
      )
    : [];
  return (
    <Pantalla
      titulo="Bloquear disponibilidad"
      footer={
        <>
          <ErrorAviso error={crear.error || eliminar.error} />
          {choque ? (
            <ErrorAviso
              error={new Error('El intervalo coincide con una cita o bloqueo. Elige otro espacio.')}
            />
          ) : null}
          <Boton
            disabled={!inicio || !fin || choque}
            cargando={crear.isPending}
            onPress={async () => {
              try {
                await crear.mutateAsync({ inicio, fin, motivo: motivo.trim() || 'Ausencia' });
                setInicio('');
              } catch {}
            }}
          >
            Bloquear horario
          </Boton>
        </>
      }
    >
      <Calendario
        valor={fecha}
        onChange={(v) => {
          setFecha(v);
          setInicio('');
        }}
      />
      <Texto className="text-xs font-medium">{fechaTexto(fecha)} · selecciona el inicio</Texto>
      <View className="flex-row flex-wrap gap-2">
        {slots.map((s) => (
          <Pressable
            key={s}
            onPress={() => setInicio(s)}
            accessibilityRole="button"
            accessibilityState={{ selected: s === inicio }}
            className={`min-w-[30%] flex-grow py-3 px-1 border rounded-xl ${s === inicio ? 'bg-navy-900 border-navy-900' : 'bg-white border-line'}`}
          >
            <Texto className={`text-xs text-center ${s === inicio ? 'text-white' : ''}`}>
              {horaTexto(s)}
            </Texto>
          </Pressable>
        ))}
      </View>
      <Campo
        label="Duración del bloqueo (minutos)"
        value={duracion}
        onChangeText={setDuracion}
        keyboardType="number-pad"
      />
      <Campo label="Motivo" value={motivo} onChangeText={setMotivo} />
      {data?.citas
        .filter(
          (c) => fechaLocal(c.inicio) === fecha && ['confirmada', 'pendiente'].includes(c.estado),
        )
        .map((c) => (
          <Tarjeta key={c.id}>
            <Texto className="font-medium">
              {c.pacienteNombre} · {horaTexto(c.inicio)}
            </Texto>
            <Texto className="text-xs text-muted">{c.servicioNombre} · ocupado</Texto>
          </Tarjeta>
        ))}
      {data?.bloqueos
        .filter((b) => fechaLocal(b.inicio) === fecha)
        .map((b) => (
          <Tarjeta key={b.id}>
            <Texto>
              {b.motivo} · {horaTexto(b.inicio)} – {horaTexto(b.fin)}
            </Texto>
            <Boton
              variant="danger"
              cargando={eliminar.isPending}
              onPress={() => eliminar.mutate(b.id)}
            >
              Eliminar bloqueo
            </Boton>
          </Tarjeta>
        ))}
    </Pantalla>
  );
}
