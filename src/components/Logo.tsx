import { View } from 'react-native';
import { Texto } from './ui';
import { iconos } from '@/constants/iconos';
interface Props {
  blanco?: boolean;
  completo?: boolean;
  centrado?: boolean;
  /** Monograma grande de A00 Splash (150 de ancho). */
  grande?: boolean;
}
export default function Logo({
  blanco = false,
  completo = false,
  centrado = false,
  grande = false,
}: Props) {
  const { Svg, width, height } = blanco ? iconos.smileWhite : iconos.smile;
  const ancho = grande ? 150 : completo ? 104 : 64,
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
            fontSize: grande ? 96 : 42,
            lineHeight: grande ? 106 : 50,
            letterSpacing: grande ? -3.6 : -1.6,
          }}
          className={blanco ? 'text-white' : ''}
        >
          CB
        </Texto>
      )}
      <View
        style={{
          width: ancho,
          height: alto,
          marginTop: grande ? -8 : 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width, height, transform: [{ scale: ancho / width }] }}>
          <Svg />
        </View>
      </View>
    </View>
  );
}
