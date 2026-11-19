import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { useCita } from '@/hooks/useCita';
import { useAhora } from '@/hooks/useAhora';
import { useSesionStore } from '@/store/sesion.store';
import {
  Boton,
  ErrorAviso,
  Estado,
  ModalConfirmacion,
  Pantalla,
  Tarjeta,
  Texto,
} from '@/components/ui';
import { ChipEstado } from '@/components/CitaCard';
import { ResumenCita } from '@/components/ResumenCita';
import { dinero, fechaTexto, HORA, horaTexto } from '@/utils/fechas';
import { repositorio } from '@/services/repositorio';
export default function DetalleCitaScreen({ solicitud = false }: { solicitud?: boolean }) {
  const ahora = useAhora();
  const { id } = useLocalSearchParams<{ id: string }>();
  const consultaCita = useCita(id);
  const { data } = useDatos();
  const perfil = useSesionStore((s) => s.perfil);
  const [modal, setModal] = useState(false);
  const cancelar = useAccion(repositorio.cancelar, 'Cita cancelada. La franja quedó libre.');
  const responder = useAccion(
    (aprobar: boolean) => repositorio.responder(id, aprobar),
    (c) =>
      c.estado === 'confirmada'
        ? 'Solicitud aprobada.'
        : 'Solicitud rechazada. La franja quedó libre.',
  );
  if (!perfil) return <Redirect href="/(auth)/bienvenida" />;
  const cita = consultaCita.data;
  if (consultaCita.isPending)
    return (
      <Pantalla titulo="Detalle de la cita">
        <Estado titulo="Cargando cita" cargando forma="detalle" />
      </Pantalla>
    );
  if (consultaCita.isError)
    return (
      <Pantalla titulo="Detalle de la cita">
        <Estado titulo={consultaCita.error.message} accion={() => consultaCita.refetch()} />
      </Pantalla>
    );
  if (!cita)
    return (
      <Pantalla titulo="Detalle de la cita">
        <Estado
          titulo="No encontramos esta cita"
          detalle="Puede que el enlace no sea válido."
          accion={() => router.replace('/')}
          label="Volver al inicio"
        />
      </Pantalla>
    );
  const doctor = perfil.rol === 'odontologo';
  if ((!doctor && cita.pacienteId !== perfil.id) || (solicitud && !doctor))
    return (
      <Pantalla titulo="Acceso restringido">
        <Estado
          titulo="No tienes acceso a esta información"
          accion={() => router.replace('/')}
          label="Volver al inicio"
        />
      </Pantalla>
    );
  const activa =
    ['confirmada', 'pendiente'].includes(cita.estado) && Date.parse(cita.inicio) > ahora;
  const fueraPlazo =
    !doctor &&
    Date.parse(cita.inicio) - ahora < (data?.configuracion.anticipacionCambiosHoras ?? 24) * HORA;
  async function decidir(aprobar: boolean) {
    try {
      await responder.mutateAsync(aprobar);
      router.replace('/(odontologo)/(principal)/(tabs)/solicitudes');
    } catch {}
  }
  return (
    <Pantalla
      titulo={solicitud ? 'Solicitud de cita' : 'Detalle de la cita'}
      footer={
        <>
          {solicitud ? (
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Boton
                  variant="danger"
                  disabled={cita.estado !== 'pendiente'}
                  cargando={responder.isPending}
                  onPress={() => decidir(false)}
                >
                  Rechazar
                </Boton>
              </View>
              <View className="flex-1">
                <Boton
                  disabled={cita.estado !== 'pendiente'}
                  cargando={responder.isPending}
                  onPress={() => decidir(true)}
                >
                  Aprobar
                </Boton>
              </View>
            </View>
          ) : (
            <>
              {doctor ? (
                <Boton variant="secondary" onPress={() => Linking.openURL(`tel:${cita.telefono}`)}>
                  Llamar al paciente
                </Boton>
              ) : null}
              {activa ? (
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Boton variant="danger" disabled={fueraPlazo} onPress={() => setModal(true)}>
                      Cancelar cita
                    </Boton>
                  </View>
                  <View className="flex-1">
                    <Boton
                      disabled={fueraPlazo}
                      onPress={() => router.push(`/cita/${id}/reprogramar`)}
                    >
                      Reprogramar
                    </Boton>
                  </View>
                </View>
              ) : null}
              {activa && fueraPlazo ? (
                <Texto className="text-xs text-muted text-center">
                  Llama al consultorio para solicitar una excepción. Teléfono pendiente de
                  confirmar.
                </Texto>
              ) : null}
            </>
          )}
        </>
      }
    >
      <Tarjeta>
        <ChipEstado estado={cita.estado} />
        <Texto className="text-xs text-muted">
          Cita #{cita.numero ? `A-${cita.numero}` : cita.id.slice(0, 8)}
        </Texto>
        <Texto className="font-semibold text-xl">
          {doctor ? cita.pacienteNombre : cita.servicioNombre}
        </Texto>
        <ResumenCita
          filas={[
            ...(doctor
              ? [['sliders', 'Servicio', cita.servicioNombre] as const].map(
                  (r) => [...r] as ['sliders', string, string],
                )
              : []),
            ['calendar', 'Fecha', fechaTexto(cita.inicio)],
            ['clock', 'Hora', `${horaTexto(cita.inicio)} – ${horaTexto(cita.fin)}`],
            [
              'info',
              'Precio acordado',
              `${dinero(cita.precioAcordadoCop)} · ${cita.duracionAcordadaMin} min`,
            ],
            ['pin', 'Lugar', 'Consultorio 201, Ed. Torcoroma'],
            ...(doctor ? [['phone', 'Teléfono', cita.telefono] as ['phone', string, string]] : []),
          ]}
        />
      </Tarjeta>
      {!doctor ? (
        <Boton variant="secondary" onPress={() => router.push('/(paciente)/(tabs)/mapa')}>
          Ver en el mapa
        </Boton>
      ) : null}
      {activa && fueraPlazo ? (
        <ErrorAviso
          error={
            new Error(
              `Faltan menos de ${data?.configuracion.anticipacionCambiosHoras} horas. Para solicitar una excepción, llama al consultorio.`,
            )
          }
        />
      ) : null}
      {cita.estado === 'vencida' ? (
        <ErrorAviso
          error={
            new Error('La solicitud venció al llegar su hora de inicio. Ya no se puede aprobar.')
          }
        />
      ) : null}
      <ErrorAviso error={responder.error} />
      <ModalConfirmacion
        visible={modal}
        titulo="¿Cancelar esta cita?"
        detalle={`${cita.servicioNombre} · ${fechaTexto(cita.inicio)}. La franja quedará libre.`}
        cargando={cancelar.isPending}
        error={cancelar.error}
        cerrar={() => setModal(false)}
        confirmar={async () => {
          try {
            await cancelar.mutateAsync(id);
            setModal(false);
          } catch {}
        }}
      />
    </Pantalla>
  );
}
