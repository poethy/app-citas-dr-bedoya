import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, type Href } from 'expo-router';
import {
  Drawer,
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import type { Rol } from '@/models';
import Logo from './Logo';
import { Icono, ModalConfirmacion, Texto } from './ui';
import { repositorio } from '@/services/mock/repositorio';
import { useSesionStore } from '@/store/sesion.store';
import { useAgendarStore } from '@/store/agendar.store';
import { useQueryClient } from '@tanstack/react-query';
import type { NombreIcono } from '@/constants/iconos';
function ContenidoMenu({ rol, ...props }: DrawerContentComponentProps & { rol: Rol }) {
  const perfil = useSesionStore((s) => s.perfil);
  const [salir, setSalir] = useState(false),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const items: { label: string; ruta: Href; icono: NombreIcono }[] =
    rol === 'paciente'
      ? [
          { label: 'Mi perfil', ruta: '/(paciente)/perfil', icono: 'home' },
          { label: 'Notificaciones', ruta: '/(paciente)/notificaciones', icono: 'bell' },
        ]
      : [
          { label: 'Servicios y confirmación', ruta: '/(odontologo)/servicios', icono: 'sliders' },
          { label: 'Anticipación mínima', ruta: '/(odontologo)/anticipacion', icono: 'clock' },
          { label: 'Bloquear horarios', ruta: '/(odontologo)/bloqueos', icono: 'ban' },
        ];
  items.push({ label: 'Información del consultorio', ruta: '/consultorio', icono: 'info' });
  async function cerrarSesion() {
    setBusy(true);
    try {
      await repositorio.salir();
      client.clear();
      useAgendarStore.getState().limpiar();
      useSesionStore.getState().establecer(null);
      router.replace('/(auth)/bienvenida');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 0, paddingStart: 0, paddingEnd: 0 }}
      >
        <SafeAreaView edges={['top', 'left', 'right']} className="bg-navy-900">
          <View className="p-5 gap-3">
            <Logo blanco />
            <Texto className="text-white font-medium">{perfil?.nombre}</Texto>
            <Texto className="text-navy-300 text-xs">
              {rol === 'paciente' ? 'Paciente' : 'Odontólogo · Consultorio 201'}
            </Texto>
          </View>
        </SafeAreaView>
        <View className="p-3 gap-1">
          {items.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => {
                props.navigation.closeDrawer();
                router.push(item.ruta);
              }}
              className="flex-row gap-3 py-4 px-2 items-center"
            >
              <Icono nombre={item.icono} />
              <Texto className="text-xs flex-1">{item.label}</Texto>
            </Pressable>
          ))}
        </View>
        <View className="flex-1" />
        <Pressable onPress={() => setSalir(true)} className="flex-row gap-3 items-center p-5">
          <Icono nombre="logout" />
          <Texto className="text-danger">Cerrar sesión</Texto>
        </Pressable>
      </DrawerContentScrollView>
      <ModalConfirmacion
        visible={salir}
        titulo="¿Cerrar sesión?"
        detalle="Tendrás que ingresar de nuevo para consultar tu agenda."
        confirmar={cerrarSesion}
        cerrar={() => setSalir(false)}
        cargando={busy}
        error={error}
      />
    </>
  );
}
export default function MenuRol({ rol }: { rol: Rol }) {
  const perfil = useSesionStore((s) => s.perfil);
  if (!perfil) return <Redirect href="/(auth)/bienvenida" />;
  if (perfil.rol !== rol) return <Redirect href="/" />;
  return (
    <Drawer
      drawerContent={(props) => <ContenidoMenu {...props} rol={rol} />}
      screenOptions={{ headerShown: false, drawerStyle: { width: 290 } }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: rol === 'paciente' ? 'Inicio' : 'Agenda' }} />
      {/* Expo Router necesita recibir cada Screen directamente, sin Fragment. */}
      {rol === 'paciente' && <Drawer.Screen name="perfil" options={{ title: 'Mi perfil' }} />}
      {rol === 'paciente' && (
        <Drawer.Screen name="notificaciones" options={{ title: 'Notificaciones' }} />
      )}
    </Drawer>
  );
}
