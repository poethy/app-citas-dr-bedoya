import { colores, fuentes } from "@/constants/tema";

/** Estilo común de las Tabs de los dos roles (HF/Tabs Paciente y HF/Tabs Odontólogo). */
export const opcionesTabs = {
  tabBarActiveTintColor: colores.navy900,
  tabBarInactiveTintColor: colores.gris400,
  tabBarLabelStyle: { fontFamily: fuentes.medium, fontSize: 11 },
  tabBarStyle: { height: 64, paddingTop: 6, borderTopColor: colores.gris200 },
  headerTintColor: colores.navy900,
  headerTitleStyle: { fontFamily: fuentes.semibold, fontSize: 18 },
  headerShadowVisible: false,
  sceneStyle: { backgroundColor: colores.gris100 },
} as const;
