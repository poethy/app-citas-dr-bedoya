// Tabs del odontólogo: Agenda · Solicitudes · Nueva cita · Avisos
import { Tabs } from "expo-router";

import { BotonMenu } from "@/components/BotonMenu";
import { iconoTab } from "@/components/IconoTab";
import { opcionesTabs } from "@/constants/opcionesTabs";

export default function TabsOdontologo() {
  return (
    <Tabs screenOptions={{ ...opcionesTabs, headerLeft: () => <BotonMenu /> }}>
      <Tabs.Screen
        name="agenda"
        options={{ title: "Agenda", tabBarIcon: iconoTab("calendar") }}
      />
      <Tabs.Screen
        name="solicitudes"
        options={{ title: "Solicitudes", tabBarIcon: iconoTab("inbox") }}
      />
      <Tabs.Screen
        name="nueva-cita"
        options={{ title: "Nueva cita", tabBarIcon: iconoTab("plus") }}
      />
      <Tabs.Screen
        name="avisos"
        options={{ title: "Avisos", tabBarIcon: iconoTab("bell") }}
      />
    </Tabs>
  );
}
