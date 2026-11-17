import { useState } from 'react';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { repositorio } from '@/services/mock/repositorio';
import { Boton, ErrorAviso, Pantalla, Tarjeta, Texto } from '@/components/ui';
import Contador from '@/components/Contador';
export default function Anticipacion() {
  const { data } = useDatos();
  const [agendar, setAgendar] = useState(data?.configuracion.anticipacionAgendarHoras ?? 24),
    [cambios, setCambios] = useState(data?.configuracion.anticipacionCambiosHoras ?? 24);
  const accion = useAccion(repositorio.guardarConfiguracion, 'Anticipaciones guardadas.');
  return (
    <Pantalla
      titulo="Anticipación mínima"
      footer={
        <>
          <ErrorAviso error={accion.error} />
          <Boton
            cargando={accion.isPending}
            onPress={() =>
              accion.mutate({
                anticipacionAgendarHoras: agendar,
                anticipacionCambiosHoras: cambios,
              })
            }
          >
            Guardar
          </Boton>
        </>
      }
    >
      <Texto className="text-muted text-xs">
        Horas mínimas que debe respetar el paciente antes de la cita.
      </Texto>
      <Contador
        titulo="Para agendar una cita"
        valor={agendar}
        onChange={setAgendar}
        min={1}
        max={72}
        paso={1}
        unidad="horas"
      />
      <Contador
        titulo="Para cancelar o reprogramar"
        valor={cambios}
        onChange={setCambios}
        min={1}
        max={72}
        paso={1}
        unidad="horas"
      />
      <Tarjeta className="bg-navy-900">
        <Texto className="text-navy-300 text-xs">REGLAS POR ROL</Texto>
        <Texto className="text-white text-xs">
          El paciente cumple ambos plazos. El odontólogo puede gestionar excepciones por llamada,
          conservando los horarios y evitando cruces.
        </Texto>
      </Tarjeta>
    </Pantalla>
  );
}
