import { Redirect } from 'expo-router';
import { useSesionStore } from '@/store/sesion.store';
import { Estado } from '@/components/ui';
export default function Inicio() {
  const { perfil, hidratada } = useSesionStore();
  if (!hidratada) return <Estado titulo="Cargando sesión" cargando />;
  return (
    <Redirect
      href={
        !perfil
          ? '/(auth)/bienvenida'
          : perfil.rol === 'paciente'
            ? '/(paciente)/(tabs)'
            : '/(odontologo)/(tabs)'
      }
    />
  );
}
