import { View } from 'react-native';
import { Texto } from './ui';
import { iconos } from '@/constants/iconos';
interface Props {
  blanco?: boolean;
  completo?: boolean;
  centrado?: boolean;
}
export default function Logo({ blanco = false, completo = false, centrado = false }: Props) {
  const { Svg, width, height } = blanco ? iconos.smileWhite : iconos.smile;
  const ancho = completo ? 104 : 64,
    alto = (height * ancho) / width;
  return (
    <View
      accessibilityLabel="Dr. Camilo Bedoya"
      className={`items-center ${centrado ? 'self-center' : 'self-start'}`}
    >
      {completo ? (
        <Texto className={`${blanco ? 'text-white' : ''} text-[48px] leading-[51px] font-medium`}>
          {'Dr.\nCamilo\nBedoya'}
        </Texto>
      ) : (
        <Texto
          style={{
            fontFamily: 'LibreBaskerville_400Regular',
            fontSize: 42,
            lineHeight: 50,
            letterSpacing: -1.6,
          }}
          className={blanco ? 'text-white' : ''}
        >
          CB
        </Texto>
      )}
      <View style={{ width: ancho, height: alto, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width, height, transform: [{ scale: ancho / width }] }}>
          <Svg />
        </View>
      </View>
    </View>
  );
}
