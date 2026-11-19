import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { Boton, Campo, ErrorAviso, Estado, Opciones, Pantalla, Texto } from '@/components/ui';
import Contador from '@/components/Contador';
import Calendario from '@/components/Calendario';
import { repositorio } from '@/services/repositorio';
import { fechaLocal, fechaTexto } from '@/utils/fechas';
import { calcularFranjas } from '@/utils/franjas';
import { validarNumero } from '@/utils/validaciones';
export default function EditarServicio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useDatos();
  const servicio = data?.servicios.find((s) => s.id === id);
  const [nombre, setNombre] = useState(servicio?.nombre ?? ''),
    [precio, setPrecio] = useState(String(servicio?.precioCop ?? '')),
    [duracion, setDuracion] = useState(String(servicio?.duracionMin ?? 30)),
    [confirmacion, setConfirmacion] = useState<'inmediata' | 'aprobacion'>(
      servicio?.confirmacion ?? 'inmediata',
    ),
    [fecha, setFecha] = useState(fechaLocal()),
    [error, setError] = useState<unknown>(),
    [verFecha, setVerFecha] = useState(false);
  const accion = useAccion(
    repositorio.guardarServicio,
    'Servicio guardado. Las citas existentes conservan sus valores.',
  );
  if (id !== 'nuevo' && !servicio) return <Estado titulo="No encontramos este servicio" />;
  const capacidad = data ? calcularFranjas(data, fecha, Number(duracion), 'paciente').capacidad : 0;
  return (
    <Pantalla
      titulo={id === 'nuevo' ? 'Nuevo servicio' : 'Editar servicio'}
      footer={
        <>
          <ErrorAviso error={error || accion.error} />
          <Boton
            cargando={accion.isPending}
            onPress={async () => {
              const mensaje = !nombre.trim()
                ? 'Escribe el nombre del servicio.'
                : validarNumero(precio, 'precio') || validarNumero(duracion, 'duracion');
              if (mensaje) {
                setError(new Error(mensaje));
                return;
              }
              setError(undefined);
              try {
                await accion.mutateAsync({
                  id,
                  nombre: nombre.trim(),
                  precioCop: Number(precio),
                  duracionMin: Number(duracion),
                  confirmacion,
                  activo: true,
                });
                router.back();
              } catch {}
            }}
          >
            Guardar cambios
          </Boton>
        </>
      }
    >
      <Campo label="Nombre del servicio" value={nombre} onChangeText={setNombre} />
      <Campo
        label="Precio (COP)"
        value={precio}
        onChangeText={setPrecio}
        keyboardType="number-pad"
      />
      <Contador
        titulo="Duración del servicio"
        valor={Math.min(180, Math.max(15, Math.round((Number(duracion) || 15) / 15) * 15))}
        onChange={(v) => setDuracion(String(v))}
        min={15}
        max={180}
        paso={15}
        unidad="minutos"
      />
      <Campo
        label="Duración en minutos"
        value={duracion}
        onChangeText={setDuracion}
        keyboardType="number-pad"
        ayuda="También puedes escribir el valor para ajustarlo."
      />
      <Texto className="text-xs font-medium">Tipo de confirmación</Texto>
      <Opciones
        valor={confirmacion}
        onChange={setConfirmacion}
        opciones={[
          { valor: 'inmediata', label: 'Inmediata' },
          { valor: 'aprobacion', label: 'Con aprobación' },
        ]}
      />
      <View className="bg-navy-900 rounded-2xl p-5 gap-2">
        <Texto className="text-white text-3xl font-semibold leading-10">{capacidad}</Texto>
        <Texto className="text-white">franjas disponibles para paciente</Texto>
        <Texto className="text-navy-300 text-xs">{fechaTexto(fecha)}</Texto>
      </View>
      <Boton variant="text" onPress={() => setVerFecha(!verFecha)}>
        Cambiar fecha del cálculo
      </Boton>
      {verFecha ? <Calendario valor={fecha} onChange={setFecha} /> : null}
    </Pantalla>
  );
}
