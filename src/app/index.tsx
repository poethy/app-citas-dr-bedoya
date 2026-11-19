import { Redirect } from 'expo-router';
import { useSesionStore } from '@/store/sesion.store';
import Splash from '@/components/Splash';
export default function Inicio() {
  const { perfil, hidratada } = useSesionStore();
  if (!hidratada) return <Splash titulo="Cargando sesión" />;
  return (
    <Redirect
      href={
        !perfil
          ? '/(auth)/bienvenida'
          : perfil.rol === 'paciente'
            ? '/(paciente)/(tabs)'
            : '/(odontologo)/(principal)/(tabs)'
      }
    />
  );
}
