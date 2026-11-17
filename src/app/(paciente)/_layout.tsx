// (paciente) · Drawer (P02) con guardia de rol (RF-03)
import { Drawer } from "expo-router/drawer";

import { ContenidoDrawer, type OpcionDrawer } from "@/components/ContenidoDrawer";
import { GuardiaRol } from "@/components/GuardiaRol";
import { colores, fuentes } from "@/constants/tema";

const opciones: OpcionDrawer[] = [
  { etiqueta: "Perfil", icono: "user", ruta: "/perfil" },
  { etiqueta: "Información del consultorio", icono: "info", ruta: "/consultorio" },
  { etiqueta: "Notificaciones", icono: "bell", ruta: "/notificaciones" },
];

export default function LayoutPaciente() {
  return (
    <GuardiaRol rol="paciente">
      <Drawer
        drawerContent={({ navigation }) => (
          <ContenidoDrawer
            subtitulo="Paciente"
            opciones={opciones}
            mensajeCerrarSesion="Tendrás que ingresar de nuevo con tu correo y contraseña para ver tus citas."
            cerrar={() => navigation.closeDrawer()}
          />
        )}
        screenOptions={{
          headerTintColor: colores.navy900,
          headerTitleStyle: { fontFamily: fuentes.semibold, fontSize: 18 },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: colores.gris100 },
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
        <Drawer.Screen name="perfil" options={{ title: "Mi perfil" }} />
        <Drawer.Screen name="notificaciones" options={{ title: "Notificaciones" }} />
      </Drawer>
    </GuardiaRol>
  );
}
