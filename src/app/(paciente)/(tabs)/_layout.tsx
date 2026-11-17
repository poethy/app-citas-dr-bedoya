// Tabs del paciente: Inicio · Agendar · Mis citas · Mapa
import { Tabs } from "expo-router";

import { BotonMenu } from "@/components/BotonMenu";
import { iconoTab } from "@/components/IconoTab";
import { opcionesTabs } from "@/constants/opcionesTabs";

export default function TabsPaciente() {
  return (
    <Tabs screenOptions={{ ...opcionesTabs, headerLeft: () => <BotonMenu /> }}>
      <Tabs.Screen
        name="inicio"
        options={{ title: "Inicio", tabBarIcon: iconoTab("home") }}
      />
      <Tabs.Screen
        name="agendar"
        options={{
          title: "Agendar",
          headerShown: false,
          tabBarIcon: iconoTab("plus-circle"),
        }}
      />
      <Tabs.Screen
        name="mis-citas"
        options={{ title: "Mis citas", tabBarIcon: iconoTab("list") }}
      />
      <Tabs.Screen
        name="mapa"
        options={{ title: "Mapa", tabBarIcon: iconoTab("map-pin") }}
      />
    </Tabs>
  );
}
