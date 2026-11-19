import { useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { useSesionStore } from '@/store/sesion.store';
import { Boton, ErrorAviso, Estado, Pantalla, Tarjeta, Texto } from '@/components/ui';
import Calendario from '@/components/Calendario';
import Franjas from '@/components/Franjas';
import { calcularFranjas } from '@/utils/franjas';
import { fechaLocal, fechaTexto, horaTexto } from '@/utils/fechas';
import { repositorio } from '@/services/repositorio';
import { useOcupacion } from '@/hooks/useOcupacion';
export default function Reprogramar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useDatos();
  const perfil = useSesionStore((s) => s.perfil);
  const [fecha, setFecha] = useState(fechaLocal()),
    [inicio, setInicio] = useState('');
  const ocupacion = useOcupacion(fecha);
  const accion = useAccion(
    (nuevo: string) => repositorio.reprogramar(id, nuevo),
    'Cita reprogramada.',
  );
  if (!perfil) return <Redirect href="/(auth)/bienvenida" />;
  const cita = data?.citas.find(
    (c) => c.id === id && (perfil.rol === 'odontologo' || c.pacienteId === perfil.id),
  );
  if (!cita || !data) return <Estado titulo="No encontramos esta cita" />;
  const franjas = calcularFranjas(
    data,
    fecha,
    cita.duracionAcordadaMin,
    perfil.rol,
    new Date(),
    cita.id,
    ocupacion.ocupados,
  ).franjas;
  return (
    <Pantalla
      titulo="Reprogramar cita"
      footer={
        <>
          <ErrorAviso error={accion.error} />
          <Boton
            disabled={!inicio}
            cargando={accion.isPending}
            onPress={async () => {
              try {
                await accion.mutateAsync(inicio);
                router.replace(`/cita/${id}`);
              } catch {}
            }}
          >
            Confirmar nuevo horario
          </Boton>
        </>
      }
    >
      <Tarjeta>
        <Texto className="font-medium">Horario actual</Texto>
        <Texto>
          {fechaTexto(cita.inicio)} · {horaTexto(cita.inicio)}
        </Texto>
        <Texto className="text-muted text-xs">
          {cita.servicioNombre} · {cita.duracionAcordadaMin} min
        </Texto>
      </Tarjeta>
      <Texto>Elige un nuevo día</Texto>
      <Calendario
        valor={fecha}
        onChange={(v) => {
          setFecha(v);
          setInicio('');
        }}
      />
      <Texto>Horarios libres</Texto>
      <Franjas franjas={franjas} valor={inicio} onChange={setInicio} />
    </Pantalla>
  );
}
