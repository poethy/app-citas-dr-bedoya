// (odontologo) · Drawer (O03) con guardia de rol (RF-03)
import { Drawer } from "expo-router/drawer";

import { ContenidoDrawer, type OpcionDrawer } from "@/components/ContenidoDrawer";
import { GuardiaRol } from "@/components/GuardiaRol";
import { colores, fuentes } from "@/constants/tema";

const opciones: OpcionDrawer[] = [
  { etiqueta: "Servicios y confirmación", icono: "sliders", ruta: "/servicios" },
  { etiqueta: "Anticipación mínima", icono: "clock", ruta: "/anticipacion" },
  { etiqueta: "Bloquear horarios", icono: "slash", ruta: "/bloqueos" },
  { etiqueta: "Información del consultorio", icono: "info", ruta: "/consultorio" },
];

export default function LayoutOdontologo() {
  return (
    <GuardiaRol rol="odontologo">
      <Drawer
        drawerContent={({ navigation }) => (
          <ContenidoDrawer
            subtitulo="Odontólogo · Consultorio 201"
            opciones={opciones}
            mensajeCerrarSesion="Tendrás que ingresar de nuevo con tu correo y contraseña para ver la agenda del consultorio."
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
        <Drawer.Screen name="servicios" options={{ headerShown: false }} />
        <Drawer.Screen name="anticipacion" options={{ title: "Anticipación mínima" }} />
        <Drawer.Screen name="bloqueos" options={{ title: "Bloquear horarios" }} />
      </Drawer>
    </GuardiaRol>
  );
}
