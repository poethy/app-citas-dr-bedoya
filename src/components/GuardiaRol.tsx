// Guardia de rol de cada _layout (RF-03): sin sesión → Bienvenida; rol distinto → G04.
import { Redirect, router } from "expo-router";

import { AccesoDenegado, EstadoCarga, EstadoError } from "@/components/Estados";
import type { Rol } from "@/models/perfil";
import { useSesionStore } from "@/store/sesion.store";

export function GuardiaRol({ rol, children }: { rol: Rol; children: React.ReactNode }) {
  const { estado, perfil } = useSesionStore();

  if (estado === "cargando") return <EstadoCarga />;
  if (estado === "error") return <EstadoError onReintentar={() => router.replace("/")} />;
  if (estado === "sin-sesion" || !perfil) return <Redirect href="/bienvenida" />;
  if (perfil.rol !== rol) return <AccesoDenegado onVolver={() => router.replace("/")} />;
  return <>{children}</>;
}
