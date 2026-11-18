import { useState } from 'react';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { repositorio } from '@/services/mock/repositorio';
import { Boton, ErrorAviso, Pantalla, Texto } from '@/components/ui';
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
        mostrarLimites={false}
      />
      <Contador
        titulo="Para cancelar o reprogramar"
        valor={cambios}
        onChange={setCambios}
        min={1}
        max={72}
        paso={1}
        unidad="horas"
        mostrarLimites={false}
      />
    </Pantalla>
  );
}
