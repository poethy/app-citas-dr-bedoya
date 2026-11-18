import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { useAgendarStore } from '@/store/agendar.store';
import { useSesionStore } from '@/store/sesion.store';
import {
  Boton,
  Campo,
  ErrorAviso,
  Estado,
  Icono,
  Opciones,
  Pantalla,
  Tarjeta,
  Texto,
} from '@/components/ui';
import Calendario from '@/components/Calendario';
import Franjas from '@/components/Franjas';
import CitaCard from '@/components/CitaCard';
import { useFranjasDisponibles } from '@/hooks/useFranjasDisponibles';
import { dinero, fechaTexto, horaTexto } from '@/utils/fechas';
import { repositorio } from '@/services/mock/repositorio';
import { ResumenCita } from '@/components/ResumenCita';
export default function AgendarScreen({ paso }: { paso: 1 | 2 | 3 | 4 | 5 }) {
  const { data } = useDatos();
  const borrador = useAgendarStore();
  const perfil = useSesionStore((s) => s.perfil);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [buscar, setBuscar] = useState(''),
    [filtro, setFiltro] = useState('todos');
  const crear = useAccion(repositorio.crearCita);
  const { franjas } = useFranjasDisponibles(
    borrador.fecha,
    data?.servicios.find((s) => s.id === borrador.servicioId)?.duracionMin ?? 0,
    'paciente',
  );
  if (!data) return <Estado titulo="Cargando" cargando />;
  const servicio = data.servicios.find((s) => s.id === borrador.servicioId);
  const cita = data.citas.find((c) => c.id === id && c.pacienteId === perfil?.id);
  if (paso === 5) {
    if (!cita) return <Redirect href="/(paciente)/(tabs)/mis-citas" />;
    const pendiente = cita.estado === 'pendiente';
    return (
      <Pantalla
        blanca
        footer={
          <>
            <Boton
              onPress={() => {
                borrador.limpiar();
                router.replace(pendiente ? '/(paciente)/(tabs)/mis-citas' : `/cita/${cita.id}`);
              }}
            >
              {pendiente ? 'Ver mis citas' : 'Ver mi cita'}
            </Boton>
            {!pendiente ? (
              <Boton variant="secondary" onPress={() => router.replace('/(paciente)/(tabs)/mapa')}>
                Ver en el mapa
              </Boton>
            ) : null}
          </>
        }
      >
        <View className="items-center gap-4 py-8">
          <View
            className={`w-24 h-24 rounded-full items-center justify-center ${pendiente ? 'bg-[#fdf3e1]' : 'bg-[#e5f5ec]'}`}
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center ${pendiente ? 'bg-[#b7791f]' : 'bg-success'}`}
            >
              <Icono nombre={pendiente ? 'resultClock' : 'resultCheck'} size={32} />
            </View>
          </View>
          <Texto className="font-semibold text-2xl text-center">
            {pendiente ? 'Solicitud enviada' : '¡Cita confirmada!'}
          </Texto>
          <Texto className="text-muted text-center text-xs">
            {pendiente
              ? `Tu cita de ${cita.servicioNombre} queda pendiente hasta que el consultorio la apruebe. Te avisaremos.`
              : 'Te esperamos en el Consultorio 201, Edificio Torcoroma.'}
          </Texto>
        </View>
        <CitaCard cita={cita} />
      </Pantalla>
    );
  }
  if (paso > 1 && !servicio) return <Redirect href="/(paciente)/(tabs)/agendar" />;
  if (paso > 2 && !borrador.fecha) return <Redirect href="/(paciente)/(tabs)/agendar/fecha" />;
  if (paso === 4 && !borrador.inicio) return <Redirect href="/(paciente)/(tabs)/agendar/horario" />;
  const avanzar = () =>
    router.push(
      paso === 1
        ? '/(paciente)/(tabs)/agendar/fecha'
        : paso === 2
          ? '/(paciente)/(tabs)/agendar/horario'
          : '/(paciente)/(tabs)/agendar/resumen',
    );
  const confirmar = async () => {
    try {
      const nueva = await crear.mutateAsync({
        servicioId: borrador.servicioId,
        inicio: borrador.inicio,
      });
      router.dismissAll();
      router.replace({
        pathname: '/(paciente)/(tabs)/agendar/resultado',
        params: { id: nueva.id },
      });
    } catch {
      /* Se conserva el borrador para elegir otra franja. */
    }
  };
  const disabled = paso === 1 ? !servicio : paso === 2 ? !borrador.fecha : !borrador.inicio;
  return (
    <Pantalla
      titulo="Agendar cita"
      menu={paso === 1}
      footer={
        paso === 1 ? undefined : (
          <>
            <ErrorAviso error={crear.error} />
            {crear.isError ? (
              <Boton
                variant="text"
                onPress={() => {
                  crear.reset();
                  router.replace('/(paciente)/(tabs)/agendar/horario');
                }}
              >
                Elegir otro horario
              </Boton>
            ) : null}
            <Boton
              onPress={paso === 4 ? confirmar : avanzar}
              disabled={disabled}
              cargando={crear.isPending}
            >
              {paso === 4
                ? servicio?.confirmacion === 'aprobacion'
                  ? 'Enviar solicitud'
                  : 'Confirmar cita'
                : 'Continuar'}
            </Boton>
          </>
        )
      }
    >
      <Texto className="text-[11px] text-navy-500 font-medium">
        PASO {paso} DE 4 · {['SERVICIO', 'FECHA', 'HORARIO', 'CONFIRMAR'][paso - 1]}
      </Texto>
      <View className="h-1.5 rounded-full bg-navy-100">
        <View style={{ width: `${paso * 25}%` }} className="h-1.5 bg-navy-900 rounded-full" />
      </View>
      {paso === 1 ? (
        <>
          <Campo
            label="Buscar servicio"
            placeholder="Ej. limpieza, resina…"
            value={buscar}
            onChangeText={setBuscar}
          />
          <Opciones
            valor={filtro}
            onChange={setFiltro}
            opciones={[
              { valor: 'todos', label: 'Todos' },
              { valor: 'inmediata', label: 'Inmediata' },
              { valor: 'aprobacion', label: 'Con aprobación' },
            ]}
          />
          {data.servicios
            .filter(
              (s) =>
                s.activo &&
                s.nombre.toLowerCase().includes(buscar.toLowerCase()) &&
                (filtro === 'todos' || s.confirmacion === filtro),
            )
            .map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => {
                  borrador.elegirServicio(s.id);
                  avanzar();
                }}
              >
                <Tarjeta>
                  <View className="flex-row items-center gap-3">
                    <View className="bg-navy-50 p-3 rounded-xl">
                      <Icono nombre="serviceSmile" />
                    </View>
                    <View className="flex-1 gap-1">
                      <Texto className="text-[11px] text-navy-500">
                        {s.confirmacion === 'inmediata' ? 'Inmediata' : 'Aprobación'}
                      </Texto>
                      <Texto className="font-medium">{s.nombre}</Texto>
                      <Texto className="text-xs text-muted">
                        {s.duracionMin} min · {dinero(s.precioCop)}
                      </Texto>
                    </View>
                    <Icono nombre="chevron" size={18} />
                  </View>
                </Tarjeta>
              </Pressable>
            ))}
        </>
      ) : null}
      {paso === 2 ? (
        <>
          <Texto className="text-xs text-navy-700">
            {servicio?.nombre} · {servicio?.duracionMin} min
          </Texto>
          <Calendario valor={borrador.fecha} onChange={borrador.elegirFecha} />
        </>
      ) : null}
      {paso === 3 ? (
        <>
          <Texto className="text-xs">
            {fechaTexto(borrador.fecha)} · {servicio?.nombre}
          </Texto>
          <Franjas franjas={franjas} valor={borrador.inicio} onChange={borrador.elegirInicio} />
        </>
      ) : null}
      {paso === 4 && servicio ? (
        <Tarjeta>
          <Texto className="text-xs text-navy-500">
            {servicio.confirmacion === 'inmediata'
              ? 'Confirmación inmediata'
              : 'Requiere aprobación'}
          </Texto>
          <Texto className="font-semibold text-xl">{servicio.nombre}</Texto>
          <ResumenCita
            filas={[
              ['calendar', 'Fecha', fechaTexto(borrador.fecha)],
              ['clock', 'Hora', `${horaTexto(borrador.inicio)} · ${servicio.duracionMin} min`],
              ['info', 'Precio', `${dinero(servicio.precioCop)} · se paga en el consultorio`],
              ['pin', 'Lugar', 'Consultorio 201, Ed. Torcoroma'],
              ['home', 'Paciente', perfil?.nombre ?? ''],
            ]}
          />
        </Tarjeta>
      ) : null}
    </Pantalla>
  );
}
