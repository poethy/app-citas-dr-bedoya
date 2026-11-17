import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { useSesionStore } from '@/store/sesion.store';
import { Boton, ErrorAviso, Estado, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { repositorio } from '@/services/mock/repositorio';
import { fechaLocal, fechaTexto, horaTexto } from '@/utils/fechas';
export default function AvisosScreen() {
  const { data } = useDatos();
  const perfil = useSesionStore((s) => s.perfil);
  const leer = useAccion(repositorio.leerAviso);
  const avisos = data?.avisos.filter((a) => a.destinatarioId === perfil?.id) ?? [];
  const hoy = fechaLocal();
  const citasHoy = data?.citas.filter((c) => fechaLocal(c.inicio) === hoy) ?? [];
  const primera = citasHoy
    .filter((c) => c.estado === 'confirmada')
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  return (
    <Pantalla
      titulo={perfil?.rol === 'odontologo' ? 'Avisos del consultorio' : 'Notificaciones'}
      menu={perfil?.rol === 'odontologo'}
    >
      {perfil?.rol === 'odontologo' ? (
        <Tarjeta className="bg-navy-900">
          <Texto className="text-navy-300 text-xs">
            RESUMEN DEL DÍA · {fechaTexto(hoy, true).toUpperCase()}
          </Texto>
          <Texto className="text-white font-medium">
            {citasHoy.filter((c) => c.estado === 'confirmada').length} citas confirmadas y{' '}
            {citasHoy.filter((c) => c.estado === 'pendiente').length} pendientes
          </Texto>
          <Texto className="text-white text-xs">
            {primera
              ? `Primera cita ${horaTexto(primera.inicio)} · ${primera.pacienteNombre}`
              : 'No hay citas confirmadas para hoy.'}
          </Texto>
        </Tarjeta>
      ) : null}
      <ErrorAviso error={leer.error} />
      {avisos.length ? (
        avisos.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            onPress={async () => {
              try {
                await leer.mutateAsync(a.id);
                router.push(`/cita/${a.citaId}`);
              } catch {}
            }}
          >
            <Tarjeta>
              <Texto className="text-xs text-navy-500">
                {a.leida ? 'Leída' : '● Nueva'} · {fechaTexto(a.creadoEn, true)}
              </Texto>
              <Texto className="font-medium">{a.titulo}</Texto>
              <Texto className="text-muted text-xs">{a.cuerpo}</Texto>
            </Tarjeta>
          </Pressable>
        ))
      ) : (
        <Estado
          titulo="No tienes avisos"
          detalle="Aquí verás los cambios de tus citas y solicitudes."
        />
      )}
      {perfil?.rol === 'odontologo' ? (
        <Boton variant="text" onPress={() => router.push('/demo')}>
          Escenarios de demostración
        </Boton>
      ) : null}
    </Pantalla>
  );
}
