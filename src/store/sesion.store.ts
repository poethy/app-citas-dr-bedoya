// Estado de la sesión compartido por todas las pantallas (Zustand).
// Lo llena useEscucharSesion (en el layout raíz) y lo leen A00 y las guardias de rol.
import { create } from "zustand";

import type { Perfil } from "@/models/perfil";

type EstadoSesion = "cargando" | "sin-sesion" | "con-sesion" | "error";

interface SesionStore {
  estado: EstadoSesion;
  perfil: Perfil | null;
  establecer: (perfil: Perfil) => void;
  limpiar: () => void;
  marcarError: () => void;
}

export const useSesionStore = create<SesionStore>((set) => ({
  estado: "cargando",
  perfil: null,
  establecer: (perfil) => set({ estado: "con-sesion", perfil }),
  limpiar: () => set({ estado: "sin-sesion", perfil: null }),
  marcarError: () => set({ estado: "error", perfil: null }),
}));
