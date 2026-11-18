import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { router, useNavigation } from 'expo-router';
import { DrawerActions } from 'expo-router/react-navigation';
import { iconos, type NombreIcono } from '@/constants/iconos';
import { useInterfazStore } from '@/store/interfaz.store';
import { mensajeError } from '@/utils/errores';
import { extendTailwindMerge } from 'tailwind-merge';
const combinar = extendTailwindMerge({
  extend: { classGroups: { 'font-family': [{ font: ['regular', 'medium', 'semibold'] }] } },
});

export function Texto({ className = '', ...props }: TextProps) {
  return (
    <Text
      {...props}
      className={combinar('font-regular text-navy-900 text-sm leading-[22px]', className)}
    />
  );
}
export function Icono({ nombre, size = 22 }: { nombre: NombreIcono; size?: number }) {
  const { Svg, width, height } = iconos[nombre];
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width, height, transform: [{ scale: size / Math.max(width, height) }] }}>
        <Svg />
      </View>
    </View>
  );
}
export function Boton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  cargando = false,
}: {
  children: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  disabled?: boolean;
  cargando?: boolean;
}) {
  const fondo =
    variant === 'primary'
      ? 'bg-navy-900'
      : variant === 'text'
        ? 'bg-transparent'
        : 'bg-white border';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || cargando, busy: cargando }}
      disabled={disabled || cargando}
      onPress={onPress}
      className={`min-h-[52px] rounded-[14px] px-4 py-3 items-center justify-center ${fondo} ${variant === 'danger' ? 'border-danger' : 'border-navy-900'} ${disabled || cargando ? 'opacity-40' : 'active:opacity-70'}`}
    >
      {cargando ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#0b1f3a'} />
      ) : (
        <Texto
          className={`text-center font-semibold text-[15px] ${variant === 'primary' ? 'text-white' : variant === 'danger' ? 'text-danger' : 'text-navy-900'}`}
        >
          {children}
        </Texto>
      )}
    </Pressable>
  );
}
export function Campo({
  label,
  error,
  ayuda,
  ...props
}: TextInputProps & { label: string; error?: string; ayuda?: string }) {
  return (
    <View className="gap-1.5">
      <Texto className="font-medium text-xs">{label}</Texto>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#9aa1ae"
        className={`bg-white border rounded-xl px-4 min-h-[52px] py-3 font-regular text-sm text-navy-900 ${error ? 'border-danger' : 'border-line'}`}
      />
      {error || ayuda ? (
        <Texto className={`text-xs ${error ? 'text-danger' : 'text-muted'}`}>
          {error || ayuda}
        </Texto>
      ) : null}
    </View>
  );
}
export function Tarjeta({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return (
    <View
      className={combinar('bg-white rounded-[18px] p-4 gap-2', className)}
      style={{ boxShadow: '0px 4px 16px rgba(11,31,58,0.08)' }}
    >
      {children}
    </View>
  );
}
export function ErrorAviso({ error }: { error: unknown }) {
  return error ? (
    <View accessibilityRole="alert" className="bg-[#fbe9e7] rounded-xl p-3">
      <Texto className="text-danger text-xs">{mensajeError(error)}</Texto>
    </View>
  ) : null;
}
export function Estado({
  titulo,
  detalle,
  accion,
  label = 'Reintentar',
  cargando = false,
}: {
  titulo: string;
  detalle?: string;
  accion?: () => void;
  label?: string;
  cargando?: boolean;
}) {
  return (
    <View className="flex-1 items-center justify-center p-6 gap-4 min-h-[220px]">
      {cargando ? (
        <ActivityIndicator size="large" color="#0b1f3a" />
      ) : (
        <View className="rounded-full p-5 bg-navy-100">
          <Icono nombre="inbox" size={30} />
        </View>
      )}
      <Texto className="font-semibold text-lg text-center">{titulo}</Texto>
      {detalle ? <Texto className="text-muted text-center text-xs">{detalle}</Texto> : null}
      {accion ? (
        <View className="w-full">
          <Boton onPress={accion} variant="secondary">
            {label}
          </Boton>
        </View>
      ) : null}
    </View>
  );
}
export function Pantalla({
  children,
  titulo,
  menu = false,
  oscura = false,
  blanca = false,
  scroll = true,
  footer,
  headerRight,
  subtitulo,
  onVolver,
}: PropsWithChildren<{
  titulo?: string;
  menu?: boolean;
  oscura?: boolean;
  blanca?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
  headerRight?: ReactNode;
  subtitulo?: string;
  onVolver?: () => void;
}>) {
  const navigation = useNavigation();
  const content = <View className="flex-grow gap-4 p-4">{children}</View>;
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={`flex-1 ${blanca ? 'bg-white' : 'bg-navy-50'}`}
    >
      {titulo !== undefined ? (
        <View
          className={`flex-row items-center gap-3 px-3 py-2 min-h-[60px] ${oscura ? 'bg-navy-900' : ''}`}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={menu ? 'Abrir menú' : 'Volver'}
            onPress={
              onVolver ??
              (() =>
                menu
                  ? navigation.dispatch(DrawerActions.openDrawer())
                  : router.canGoBack()
                    ? router.back()
                    : router.replace('/'))
            }
            className={`p-3 rounded-full ${oscura ? 'bg-navy-700' : 'bg-white'}`}
          >
            <Icono nombre={menu ? (oscura ? 'menuLight' : 'menu') : 'back'} />
          </Pressable>
          <View className="flex-1">
            <Texto className={`font-semibold text-lg ${oscura ? 'text-white' : ''}`}>
              {titulo}
            </Texto>
            {subtitulo ? (
              <Texto className={`text-[11px] ${oscura ? 'text-navy-300' : 'text-muted'}`}>
                {subtitulo}
              </Texto>
            ) : null}
          </View>
          {headerRight}
        </View>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
            {content}
          </ScrollView>
        ) : (
          <View className="flex-1">{children}</View>
        )}
        {footer ? (
          <SafeAreaView edges={['bottom']} className="px-4 py-3 gap-3">
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
/** Hoja que sube desde abajo sobre un fondo oscurecido (C06, C09, C10, modales de confirmación). */
export function HojaInferior({
  visible,
  cerrar,
  children,
  etiquetaFondo = 'Cerrar',
}: PropsWithChildren<{ visible: boolean; cerrar: () => void; etiquetaFondo?: string }>) {
  const [montado, setMontado] = useState(false);
  const [alturaPanel, setAlturaPanel] = useState(0);
  const [progreso] = useState(() => new Animated.Value(0));
  const reducirMovimiento = useReducedMotion();

  useEffect(() => {
    if (!montado || (visible && !alturaPanel)) return;

    const animacion = Animated.timing(progreso, {
      toValue: visible ? 1 : 0,
      duration: reducirMovimiento ? 0 : visible ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animacion.start(({ finished }) => {
      if (finished && !visible) setMontado(false);
    });
    return () => animacion.stop();
  }, [alturaPanel, montado, progreso, reducirMovimiento, visible]);

  return (
    <Modal
      visible={visible || montado}
      transparent
      animationType="none"
      onShow={() => setMontado(true)}
      onRequestClose={cerrar}
    >
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progreso }]}>
          <Pressable
            accessibilityLabel={etiquetaFondo}
            onPress={cerrar}
            className="flex-1 bg-black/40"
          />
        </Animated.View>
        <Animated.View
          onLayout={({ nativeEvent }) => setAlturaPanel(nativeEvent.layout.height)}
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            opacity: alturaPanel ? 1 : 0,
            transform: [
              {
                translateY: progreso.interpolate({
                  inputRange: [0, 1],
                  outputRange: [alturaPanel, 0],
                }),
              },
            ],
          }}
        >
          {/* SafeAreaView fija su propio padding; el relleno de la hoja va en el View interno */}
          <SafeAreaView edges={['bottom']} className="bg-white rounded-t-3xl">
            <View className="p-6 gap-4">{children}</View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
export function ModalConfirmacion({
  visible,
  titulo,
  detalle,
  confirmar,
  cerrar,
  cargando = false,
  error,
}: {
  visible: boolean;
  titulo: string;
  detalle: string;
  confirmar: () => void;
  cerrar: () => void;
  cargando?: boolean;
  error?: unknown;
}) {
  return (
    <HojaInferior visible={visible} cerrar={cerrar} etiquetaFondo="Cerrar confirmación">
      <Texto className="font-semibold text-lg">{titulo}</Texto>
      <Texto className="text-muted">{detalle}</Texto>
      <ErrorAviso error={error} />
      <Boton variant="danger" onPress={confirmar} cargando={cargando}>
        Confirmar
      </Boton>
      <Boton variant="text" onPress={cerrar}>
        Volver
      </Boton>
    </HojaInferior>
  );
}
export function AvisoBreve() {
  const { aviso, mostrar } = useInterfazStore();
  useEffect(() => {
    if (aviso) {
      const timer = setTimeout(() => mostrar(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [aviso, mostrar]);
  return aviso ? (
    <Pressable
      accessibilityRole="alert"
      onPress={() => mostrar('')}
      className="absolute bottom-24 left-4 right-4 bg-navy-900 rounded-xl p-4"
    >
      <Texto className="text-white">{aviso}</Texto>
    </Pressable>
  ) : null;
}
export function Opciones<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: T; label: string }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {opciones.map((o) => (
        <Pressable
          key={o.valor}
          accessibilityRole="button"
          accessibilityState={{ selected: valor === o.valor }}
          onPress={() => onChange(o.valor)}
          className={`px-3 py-2.5 rounded-full ${valor === o.valor ? 'bg-navy-900' : 'bg-navy-100'}`}
        >
          <Texto className={`text-xs font-medium ${valor === o.valor ? 'text-white' : ''}`}>
            {o.label}
          </Texto>
        </Pressable>
      ))}
    </View>
  );
}
