import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { Boton, ErrorAviso, Estado, Opciones, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { ChipEstado } from '@/components/CitaCard';
import { repositorio } from '@/services/repositorio';
import { fechaTexto, horaTexto } from '@/utils/fechas';
export default function Solicitudes() {
  const { data } = useDatos();
  const [estado, setEstado] = useState('pendiente');
  const accion = useAccion(
    ({ id, aprobar }: { id: string; aprobar: boolean }) => repositorio.responder(id, aprobar),
    (c) =>
      c.estado === 'confirmada'
        ? 'Solicitud aprobada.'
        : 'Solicitud rechazada. La franja quedó libre.',
  );
  const citas =
    data?.citas
      .filter(
        (c) =>
          c.estado === estado &&
          (estado !== 'confirmada' ||
            c.solicitudOriginal ||
            (c.solicitudOriginal === undefined &&
              c.origen === 'app' &&
              data.servicios.find((s) => s.id === c.servicioId)?.confirmacion === 'aprobacion')),
      )
      .sort((a, b) => a.inicio.localeCompare(b.inicio)) ?? [];
  return (
    <Pantalla menu titulo="Solicitudes">
      <Opciones
        valor={estado}
        onChange={setEstado}
        opciones={[
          {
            valor: 'pendiente',
            label: `Pendientes (${data?.citas.filter((c) => c.estado === 'pendiente').length ?? 0})`,
          },
          { valor: 'confirmada', label: 'Aprobadas' },
          { valor: 'rechazada', label: 'Rechazadas' },
          { valor: 'vencida', label: 'Vencidas' },
        ]}
      />
      <ErrorAviso error={accion.error} />
      {citas.length ? (
        citas.map((c) => (
          <Tarjeta key={c.id}>
            <View className="flex-row justify-between">
              <Texto className="font-semibold">{c.pacienteNombre}</Texto>
              <ChipEstado estado={c.estado} />
            </View>
            <Texto className="text-xs text-muted">
              {c.servicioNombre} · {c.duracionAcordadaMin} min
            </Texto>
            <Texto className="text-xs">
              {fechaTexto(c.inicio, true)} · {horaTexto(c.inicio)}
            </Texto>
            <Boton variant="text" onPress={() => router.push(`/solicitud/${c.id}`)}>
              Ver solicitud
            </Boton>
            {c.estado === 'pendiente' ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Boton
                    variant="danger"
                    cargando={accion.isPending}
                    onPress={() => accion.mutate({ id: c.id, aprobar: false })}
                  >
                    Rechazar
                  </Boton>
                </View>
                <View className="flex-1">
                  <Boton
                    cargando={accion.isPending}
                    onPress={() => accion.mutate({ id: c.id, aprobar: true })}
                  >
                    Aprobar
                  </Boton>
                </View>
              </View>
            ) : null}
          </Tarjeta>
        ))
      ) : (
        <Estado
          titulo={
            estado === 'pendiente'
              ? 'No tienes solicitudes pendientes'
              : 'No hay solicitudes en este estado'
          }
          detalle="Las solicitudes del paciente aparecerán aquí."
        />
      )}
    </Pantalla>
  );
}
