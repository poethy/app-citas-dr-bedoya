import { useState } from 'react';
import { router } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { Boton, Campo, ErrorAviso, Estado, Opciones, Pantalla, Texto } from '@/components/ui';
import Calendario from '@/components/Calendario';
import Franjas from '@/components/Franjas';
import { useFranjasDisponibles } from '@/hooks/useFranjasDisponibles';
import { fechaLocal } from '@/utils/fechas';
import { repositorio } from '@/services/mock/repositorio';
import { useAgendaStore } from '@/store/agenda.store';
export default function NuevaCita() {
  const { data } = useDatos();
  const [nombre, setNombre] = useState(''),
    [telefono, setTelefono] = useState(''),
    [servicioId, setServicio] = useState('valoracion'),
    [fecha, setFecha] = useState(fechaLocal()),
    [inicio, setInicio] = useState('');
  const accion = useAccion(repositorio.crearCita, 'Cita registrada y confirmada.');
  const servicio = data?.servicios.find((s) => s.id === servicioId);
  const { franjas } = useFranjasDisponibles(fecha, servicio?.duracionMin ?? 0, 'odontologo');
  if (!data || !servicio) return <Estado titulo="Cargando servicios" cargando />;
  return (
    <Pantalla
      titulo="Nueva cita"
      menu
      footer={
        <>
          <ErrorAviso error={accion.error} />
          <Boton
            disabled={!nombre.trim() || !/^3\d{9}$/.test(telefono) || !inicio}
            cargando={accion.isPending}
            onPress={async () => {
              try {
                await accion.mutateAsync({ pacienteNombre: nombre, telefono, servicioId, inicio });
                setNombre('');
                setTelefono('');
                setInicio('');
                useAgendaStore.getState().setFecha(fecha);
                useAgendaStore.getState().setVista('dia');
                router.replace('/(odontologo)/(tabs)');
              } catch {}
            }}
          >
            Registrar cita
          </Boton>
        </>
      }
    >
      <Campo label="Paciente" value={nombre} onChangeText={setNombre} />
      <Campo
        label="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        maxLength={10}
        ayuda="Celular de 10 dígitos, empezando por 3."
      />
      <Texto className="text-xs font-medium">Servicio</Texto>
      <Opciones
        valor={servicioId}
        onChange={(v) => {
          setServicio(v);
          setInicio('');
        }}
        opciones={data.servicios
          .filter((s) => s.activo)
          .map((s) => ({ valor: s.id, label: `${s.nombre} · ${s.duracionMin} min` }))}
      />
      <Texto className="text-xs font-medium">Fecha</Texto>
      <Calendario
        valor={fecha}
        onChange={(v) => {
          setFecha(v);
          setInicio('');
        }}
      />
      <Texto className="text-xs font-medium">Horarios libres</Texto>
      <Franjas franjas={franjas} valor={inicio} onChange={setInicio} />
    </Pantalla>
  );
}
