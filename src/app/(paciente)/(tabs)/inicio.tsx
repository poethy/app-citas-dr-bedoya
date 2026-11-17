// P01 · Inicio del paciente: próxima cita, recordatorio y accesos rápidos.
// Datos: próximas citas propias (RLS) y configuración del consultorio (docs/pantallas-y-datos.md).
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { AccesoRapido } from "@/components/AccesoRapido";
import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { EncabezadoInicio } from "@/components/EncabezadoInicio";
import { EstadoCarga, EstadoError, EstadoSinConexion } from "@/components/Estados";
import { TarjetaCita } from "@/components/TarjetaCita";
import { colores } from "@/constants/tema";
import { useConfiguracion, useProximasCitas } from "@/hooks/consultas";
import { ErrorApi } from "@/services/http/errores";
import { useSesionStore } from "@/store/sesion.store";
import { textoRecordatorio } from "@/utils/fechas";

function textoMisCitas(total: number, pendientes: number): string {
  if (total === 0) return "Aún no tienes citas";
  const proximas = `${total} ${total === 1 ? "próxima" : "próximas"}`;
  return pendientes > 0 ? `${proximas} · ${pendientes} ${pendientes === 1 ? "pendiente" : "pendientes"}` : proximas;
}

export default function InicioPaciente() {
  const nombre = useSesionStore((s) => s.perfil?.nombre ?? "");
  const primerNombre = nombre.split(" ")[0] ?? "";
  const citas = useProximasCitas();
  const configuracion = useConfiguracion();

  const recargar = () => {
    void citas.refetch();
    void configuracion.refetch();
  };

  const proxima = citas.data?.proxima ?? null;
  const recordatorio = proxima ? textoRecordatorio(proxima.inicio) : null;
  const lugar = configuracion.data?.lugar.replace(", ", " · ");

  function contenidoProximaCita() {
    if (citas.isPending) return <EstadoCarga compacto mensaje="Cargando tus citas…" />;
    if (citas.isError) {
      return citas.error instanceof ErrorApi && citas.error.codigo === "SIN_CONEXION" ? (
        <EstadoSinConexion compacto onReintentar={recargar} />
      ) : (
        <EstadoError compacto onReintentar={recargar} />
      );
    }
    if (!proxima) {
      return (
        <View className="gap-3">
          <Text className="font-poppins text-cuerpo text-gris-500">No tienes citas próximas.</Text>
          <Boton titulo="Agendar una cita" onPress={() => router.push("/agendar")} />
        </View>
      );
    }
    return (
      <View className="gap-3">
        <TarjetaCita
          cita={proxima}
          detalle={proxima.estado === "pendiente" ? "Esperando aprobación" : lugar}
          onPress={() => router.push(`/cita/${proxima.id}`)}
        />
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Boton titulo="Ver detalle" variante="secundario" onPress={() => router.push(`/cita/${proxima.id}`)} />
          </View>
          <View className="flex-1">
            <Boton titulo="Ver en el mapa" onPress={() => router.push("/mapa")} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gris-100">
      <EncabezadoInicio
        saludo={primerNombre ? `Hola, ${primerNombre} 👋` : "Hola 👋"}
        subtitulo="¿Lista para tu próxima cita?"
        onCampana={() => router.push("/notificaciones")}
      />
      <ScrollView
        contentContainerClassName="gap-3.5 p-4 pb-8"
        refreshControl={<RefreshControl refreshing={citas.isRefetching} onRefresh={recargar} tintColor={colores.navy900} />}
      >
        <View className="min-h-[160px] gap-3 rounded-[18px] bg-white p-4">
          <Text className="font-poppins-medium text-subtitulo text-navy-900">Tu próxima cita</Text>
          {contenidoProximaCita()}
        </View>

        {proxima && recordatorio ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/cita/${proxima.id}`)}>
            <Aviso mensaje={recordatorio} />
          </Pressable>
        ) : null}

        <Text className="mt-2 font-poppins-medium text-subtitulo text-navy-900">Accesos rápidos</Text>
        <View className="flex-row gap-3">
          <AccesoRapido
            titulo="Agendar cita"
            descripcion="Elige servicio y hora"
            icono="plus"
            destacado
            onPress={() => router.push("/agendar")}
          />
          <AccesoRapido
            titulo="Mis citas"
            descripcion={citas.data ? textoMisCitas(citas.data.totalProximas, citas.data.pendientes) : "…"}
            icono="list"
            onPress={() => router.push("/mis-citas")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
