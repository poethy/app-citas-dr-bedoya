// Estados globales reutilizables (G01 a G04 del Figma).
// `compacto` los muestra dentro de una tarjeta en vez de ocupar toda la pantalla.
import { ActivityIndicator, Text, View } from "react-native";

import { Boton } from "@/components/Boton";
import { colores } from "@/constants/tema";

interface ConCompacto {
  compacto?: boolean;
}

function Contenedor({ children, compacto = false }: { children: React.ReactNode } & ConCompacto) {
  return (
    <View className={compacto ? "items-center justify-center gap-3 py-6" : "flex-1 items-center justify-center gap-4 bg-gris-100 px-8"}>
      {children}
    </View>
  );
}

/** G01 · Cargando */
export function EstadoCarga({ mensaje = "Cargando…", compacto }: { mensaje?: string } & ConCompacto) {
  return (
    <Contenedor compacto={compacto}>
      <ActivityIndicator size="large" color={colores.navy900} />
      <Text className="font-poppins text-cuerpo text-gris-500">{mensaje}</Text>
    </Contenedor>
  );
}

/** G02 · Sin conexión */
export function EstadoSinConexion({ onReintentar, compacto }: { onReintentar: () => void } & ConCompacto) {
  return (
    <Contenedor compacto={compacto}>
      <Text className="text-center font-poppins-semibold text-titulo2 text-gris-900">No hay conexión</Text>
      <Text className="text-center font-poppins text-cuerpo text-gris-500">
        Revisa tu conexión y vuelve a intentarlo.
      </Text>
      <Boton titulo="Reintentar" onPress={onReintentar} />
    </Contenedor>
  );
}

/** G03 · Error al cargar */
export function EstadoError({ mensaje, onReintentar, compacto }: { mensaje?: string; onReintentar: () => void } & ConCompacto) {
  return (
    <Contenedor compacto={compacto}>
      <Text className="text-center font-poppins-semibold text-titulo2 text-gris-900">No pudimos cargar la información</Text>
      <Text className="text-center font-poppins text-cuerpo text-gris-500">
        {mensaje ?? "Ocurrió un problema con el servicio. Intenta de nuevo en unos segundos."}
      </Text>
      <Boton titulo="Reintentar" onPress={onReintentar} />
    </Contenedor>
  );
}

/** G04 · Acceso denegado (guardia de rol de cada _layout) */
export function AccesoDenegado({ onVolver }: { onVolver: () => void }) {
  return (
    <Contenedor>
      <Text className="text-center font-poppins-semibold text-titulo2 text-gris-900">No tienes acceso a esta sección</Text>
      <Text className="text-center font-poppins text-cuerpo text-gris-500">
        Esta parte de la app es para otro tipo de cuenta.
      </Text>
      <Boton titulo="Volver al inicio" onPress={onVolver} />
    </Contenedor>
  );
}
