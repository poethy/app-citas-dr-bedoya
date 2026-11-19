import { useState } from 'react';
import { router } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { Boton, Campo, ErrorAviso, Estado, Opciones, Pantalla, Texto } from '@/components/ui';
import Calendario from '@/components/Calendario';
import Franjas from '@/components/Franjas';
import { useFranjasDisponibles } from '@/hooks/useFranjasDisponibles';
import { fechaLocal } from '@/utils/fechas';
import { repositorio } from '@/services/repositorio';
import { useAgendaStore } from '@/store/agenda.store';
import { MAX_CARACTERES_TELEFONO_CITA, pacienteNuevaCitaSchema } from '@/utils/validaciones';
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
  const errorHorario = intentoRegistrar && !horarioDisponible;

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
      router.replace('/(odontologo)/(principal)/(tabs)');
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
          <Boton cargando={accion.isPending} onPress={registrar}>
            Registrar cita
          </Boton>
        </>
      }
    >
      <Campo
        label="Paciente"
        value={nombre}
        onChangeText={setNombre}
        error={horarioDisponible ? errores.nombre?.[0] : undefined}
      />
      <Campo
        label="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="number-pad"
        maxLength={MAX_CARACTERES_TELEFONO_CITA}
        error={errores.telefono?.[0]}
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
      {errorHorario && (
        <Texto accessibilityRole="alert" className="text-danger text-xs">
          Selecciona un horario libre
        </Texto>
      )}
      <Calendario
        valor={fecha}
        error={errorHorario}
        onChange={(v) => {
          setFecha(v);
          setInicio('');
        }}
      />
      <Franjas franjas={franjas} valor={inicio} onChange={setInicio} />
    </Pantalla>
  );
}
