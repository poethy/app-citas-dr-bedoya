import { useState } from 'react';
import { View } from 'react-native';
import { useAccion } from '@/hooks/useDatos';
import { useSesionStore } from '@/store/sesion.store';
import { Boton, Campo, ErrorAviso, Pantalla, Texto } from '@/components/ui';
import { repositorio } from '@/services/mock/repositorio';
import { perfilSchema } from '@/utils/validaciones';
import BotonSalir from '@/components/BotonSalir';
export default function Perfil() {
  const perfil = useSesionStore((s) => s.perfil);
  const [nombre, setNombre] = useState(perfil?.nombre ?? ''),
    [telefono, setTelefono] = useState(perfil?.telefono ?? ''),
    [correo, setCorreo] = useState(perfil?.correo ?? ''),
    [error, setError] = useState<unknown>();
  const accion = useAccion(repositorio.guardarPerfil, 'Perfil actualizado.');
  return (
    <Pantalla
      titulo="Mi perfil"
      footer={
        <>
          <Boton
            cargando={accion.isPending}
            onPress={() => {
              const r = perfilSchema.safeParse({ nombre, telefono, correo });
              if (!r.success) {
                setError(new Error(r.error.issues[0].message));
                return;
              }
              setError(undefined);
              accion.mutate(r.data);
            }}
          >
            Guardar cambios
          </Boton>
          <BotonSalir />
        </>
      }
    >
      <View className="items-center gap-2 py-4">
        <View className="w-20 h-20 rounded-full bg-navy-900 items-center justify-center">
          <Texto className="text-white font-semibold text-2xl">
            {nombre
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')}
          </Texto>
        </View>
        <Texto className="font-medium">{nombre}</Texto>
        <Texto className="text-xs text-navy-500">Paciente</Texto>
      </View>
      <Campo label="Nombre completo" value={nombre} onChangeText={setNombre} />
      <Campo
        label="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <Campo
        label="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <ErrorAviso error={error || accion.error} />
    </Pantalla>
  );
}
