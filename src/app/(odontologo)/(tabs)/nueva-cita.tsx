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
import { pacienteNuevaCitaSchema } from '@/utils/validaciones';
export default function NuevaCita() {
  const { data } = useDatos();
  const [nombre, setNombre] = useState(''),
    [telefono, setTelefono] = useState(''),
    [servicioId, setServicio] = useState('valoracion'),
    [fecha, setFecha] = useState(fechaLocal()),
    [inicio, setInicio] = useState('');
  const [intentoRegistrar, setIntentoRegistrar] = useState(false);
  const accion = useAccion(repositorio.crearCita, 'Cita registrada y confirmada.');
  const servicio = data?.servicios.find((s) => s.id === servicioId);
  const { franjas } = useFranjasDisponibles(fecha, servicio?.duracionMin ?? 0, 'odontologo');
  if (!data || !servicio) return <Estado titulo="Cargando servicios" cargando />;

  const paciente = pacienteNuevaCitaSchema.safeParse({ nombre, telefono });
  const errores = intentoRegistrar && !paciente.success ? paciente.error.flatten().fieldErrors : {};
  const horarioDisponible = franjas.some((franja) => franja.inicio === inicio);

  async function registrar() {
    setIntentoRegistrar(true);
    if (!paciente.success || !horarioDisponible) return;

    try {
      await accion.mutateAsync({
        pacienteNombre: paciente.data.nombre,
        telefono: paciente.data.telefono,
        servicioId,
        inicio,
      });
      setNombre('');
      setTelefono('');
      setInicio('');
      setIntentoRegistrar(false);
      useAgendaStore.getState().setFecha(fecha);
      useAgendaStore.getState().setVista('dia');
      router.replace('/(odontologo)/(tabs)');
    } catch {
      // El formulario muestra el error de la operación y conserva los datos.
    }
  }

  return (
    <Pantalla
      titulo="Nueva cita"
      menu
      footer={
        <>
          <ErrorAviso error={accion.error} />
          {intentoRegistrar && !horarioDisponible ? (
            <Texto accessibilityRole="alert" className="text-danger text-xs">
              {inicio
                ? 'Ese horario ya no está disponible. Elige otro.'
                : 'Selecciona un horario libre.'}
            </Texto>
          ) : null}
          {intentoRegistrar && !paciente.success ? (
            <Texto accessibilityRole="alert" className="text-danger text-xs">
              {paciente.error.issues[0]?.message}
            </Texto>
          ) : null}
          <Boton cargando={accion.isPending} onPress={registrar}>
            Registrar cita
          </Boton>
        </>
      }
    >
      <Campo label="Paciente" value={nombre} onChangeText={setNombre} error={errores.nombre?.[0]} />
      <Campo
        label="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        error={errores.telefono?.[0]}
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
