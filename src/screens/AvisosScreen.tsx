import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Aviso } from '@/models';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { useSesionStore } from '@/store/sesion.store';
import { Aparecer, Boton, ErrorAviso, Estado, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { repositorio, usaServidor } from '@/services/repositorio';
import { fechaLocal, fechaTexto, horaTexto } from '@/utils/fechas';

/** Un aviso. Los nuevos llevan franja y punto de color; los vistos quedan atenuados. */
function TarjetaAviso({ aviso, abrir }: { aviso: Aviso; abrir: (a: Aviso) => void }) {
  const nuevo = !aviso.leida;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nuevo ? 'Nuevo. ' : ''}${aviso.titulo}. ${aviso.cuerpo}`}
      onPress={() => abrir(aviso)}
      className="active:opacity-70"
    >
      <Tarjeta className={nuevo ? 'flex-row gap-3' : 'flex-row gap-3 bg-white/60'}>
        <View
          className={`w-1 self-stretch rounded-full ${nuevo ? 'bg-navy-900' : 'bg-transparent'}`}
        />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            {nuevo ? <View className="w-2 h-2 rounded-full bg-[#2f5d9e]" /> : null}
            <Texto className={`text-xs ${nuevo ? 'text-navy-900 font-medium' : 'text-muted'}`}>
              {nuevo ? 'Nuevo' : 'Visto'} · {fechaTexto(aviso.creadoEn, true)} ·{' '}
              {horaTexto(aviso.creadoEn)}
            </Texto>
          </View>
          <Texto className={nuevo ? 'font-semibold' : 'font-medium text-muted'}>
            {aviso.titulo}
          </Texto>
          <Texto className="text-muted text-xs">{aviso.cuerpo}</Texto>
        </View>
      </Tarjeta>
    </Pressable>
  );
}

export default function AvisosScreen() {
  const { data } = useDatos();
  const perfil = useSesionStore((s) => s.perfil);
  const leer = useAccion(repositorio.leerAviso);
  const leerTodos = useAccion(async (ids: string[]) => {
    await Promise.all(ids.map((id) => repositorio.leerAviso(id)));
  }, 'Avisos marcados como vistos.');
  const avisos = data?.avisos.filter((a) => a.destinatarioId === perfil?.id) ?? [];
  const porVer = avisos.filter((a) => !a.leida);
  const vistos = avisos.filter((a) => a.leida);
  const hoy = fechaLocal();
  const citasHoy = data?.citas.filter((c) => fechaLocal(c.inicio) === hoy) ?? [];
  const primera = citasHoy
    .filter((c) => c.estado === 'confirmada')
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  async function abrir(aviso: Aviso) {
    try {
      if (!aviso.leida) await leer.mutateAsync(aviso.id);
      // El resumen del día no tiene cita: solo se marca como visto
      if (aviso.citaId) router.push(`/cita/${aviso.citaId}`);
    } catch {}
  }

  return (
    <Pantalla
      titulo={perfil?.rol === 'odontologo' ? 'Avisos del consultorio' : 'Notificaciones'}
      menu={perfil?.rol === 'odontologo'}
    >
      {perfil?.rol === 'odontologo' ? (
        <Aparecer>
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
        </Aparecer>
      ) : null}
      <ErrorAviso error={leer.error ?? leerTodos.error} />
      {avisos.length ? (
        <>
          <View className="flex-row items-center justify-between min-h-[44px]">
            <Texto accessibilityRole="header" className="font-semibold">
              Por ver{porVer.length ? ` (${porVer.length})` : ''}
            </Texto>
            {porVer.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Marcar todos los avisos como vistos"
                disabled={leerTodos.isPending}
                onPress={() => leerTodos.mutate(porVer.map((a) => a.id))}
                className="px-2 py-3 active:opacity-60"
              >
                <Texto className="text-xs font-medium text-[#2f5d9e]">
                  {leerTodos.isPending ? 'Marcando…' : 'Marcar todos como vistos'}
                </Texto>
              </Pressable>
            ) : null}
          </View>
          {porVer.length ? (
            porVer.map((a, i) => (
              <Aparecer key={a.id} retraso={i * 40}>
                <TarjetaAviso aviso={a} abrir={abrir} />
              </Aparecer>
            ))
          ) : (
            <Texto className="text-muted text-xs">Estás al día: no hay avisos por ver.</Texto>
          )}
          {vistos.length ? (
            <>
              <Texto accessibilityRole="header" className="font-semibold mt-2">
                Vistos
              </Texto>
              {vistos.map((a, i) => (
                <Aparecer key={a.id} retraso={(porVer.length + i) * 40}>
                  <TarjetaAviso aviso={a} abrir={abrir} />
                </Aparecer>
              ))}
            </>
          ) : null}
        </>
      ) : (
        <Estado
          titulo="No tienes avisos"
          detalle="Aquí verás los cambios de tus citas y solicitudes."
        />
      )}
      {perfil?.rol === 'odontologo' && !usaServidor ? (
        <Boton variant="text" onPress={() => router.push('/demo')}>
          Escenarios de demostración
        </Boton>
      ) : null}
    </Pantalla>
  );
}
