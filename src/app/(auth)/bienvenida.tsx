import { View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '@/components/Logo';
import { Boton, Texto } from '@/components/ui';
import { iconos } from '@/constants/iconos';
import { usaServidor } from '@/services/repositorio';
export default function Bienvenida() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View className="bg-navy-900 rounded-b-[32px] min-h-[44%] items-center justify-center overflow-hidden py-12">
          <View className="absolute -left-12 -top-12 scale-[2]">
            <iconos.ellipse.Svg />
          </View>
          <View className="absolute -right-8 bottom-0 scale-[2]">
            <iconos.ellipse1.Svg />
          </View>
          <View className="absolute left-12 bottom-8 scale-[2]">
            <iconos.ellipse2.Svg />
          </View>
          <Logo blanco completo centrado />
        </View>
        <View className="p-4 gap-4 flex-1">
          <Texto className="font-semibold text-[26px] leading-9">Tu sonrisa, a un toque</Texto>
          <Texto className="text-muted">
            Agenda, reprograma o cancela tus citas con el Dr. Camilo Bedoya sin llamadas ni esperas.
          </Texto>
          <View className="flex-1" />
          <Boton onPress={() => router.push('/(auth)/login')}>Iniciar sesión</Boton>
          <Boton variant="secondary" onPress={() => router.push('/(auth)/registro')}>
            Crear cuenta
          </Boton>
          {usaServidor ? null : (
            <Texto className="text-center text-xs text-muted">
              Demostración con datos de ejemplo
            </Texto>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
