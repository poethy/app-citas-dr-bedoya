// Escucha la sesión de Supabase Auth y carga el perfil (con su rol) en useSesionStore.
// Entradas: ninguna. Efecto: suscripción a onAuthStateChange, que se libera al desmontar.
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";
import { obtenerPerfil } from "@/services/api/perfiles.api";
import { useSesionStore } from "@/store/sesion.store";

export function useEscucharSesion(): void {
  const { establecer, limpiar, marcarError } = useSesionStore();

  useEffect(() => {
    let activo = true;

    async function cargar(usuarioId: string | undefined) {
      if (!usuarioId) {
        limpiar();
        return;
      }
      try {
        const perfil = await obtenerPerfil(usuarioId);
        if (activo) establecer(perfil);
      } catch {
        if (activo) marcarError();
      }
    }

    // onAuthStateChange también emite la sesión guardada al iniciar (INITIAL_SESSION)
    const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "TOKEN_REFRESHED") return;
      // Se difiere para no llamar a la API dentro del callback de Auth
      setTimeout(() => void cargar(sesion?.user.id), 0);
    });

    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, [establecer, limpiar, marcarError]);
}
