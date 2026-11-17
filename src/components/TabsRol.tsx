import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono } from './ui';
import type { NombreIcono } from '@/constants/iconos';
export default function TabsRol({ doctor = false }: { doctor?: boolean }) {
  const insets = useSafeAreaInsets();
  const screens: [string, string, NombreIcono][] = doctor
    ? [
        ['index', 'Agenda', 'calendar'],
        ['solicitudes', 'Solicitudes', 'inbox'],
        ['nueva-cita', 'Nueva cita', 'plus'],
        ['avisos', 'Avisos', 'bell'],
      ]
    : [
        ['index', 'Inicio', 'home'],
        ['agendar', 'Agendar', 'plus'],
        ['mis-citas', 'Mis citas', 'list'],
        ['mapa', 'Mapa', 'pin'],
      ];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0b1f3a',
        tabBarInactiveTintColor: '#9aa1ae',
        tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 11 },
        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 7,
          backgroundColor: 'white',
        },
      }}
    >
      {screens.map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused }) => (
              <View className={`px-4 py-1 rounded-full ${focused ? 'bg-navy-100' : ''}`}>
                <Icono nombre={icon} size={22} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
