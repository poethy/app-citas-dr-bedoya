// Envía como push (Expo) las notificaciones que la base ya creó: RF-11, RF-13, RF-16 y RF-17.
//
// La invoca pg_cron cada minuto (migración …_envio_push_cron.sql) solo cuando hay
// notificaciones sin enviar. No se llama desde la app.
//
// Seguridad: se despliega sin verificación de JWT y exige el encabezado
// `x-secreto-cron`, que se compara contra un secreto guardado en Supabase Vault
// (función `validar_secreto_cron`, que solo puede llamar service_role).
//
// Es idempotente: cada notificación se marca `enviada_push = true` una sola vez,
// tenga o no dispositivos registrados.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Notificacion = {
  id: string;
  destinatario_id: string;
  cita_id: string | null;
  tipo: string;
  titulo: string;
  cuerpo: string;
};

type MensajeExpo = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  priority: "high";
  data: { notificacionId: string; citaId: string | null; tipo: string };
};

type TicketExpo = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const LOTE_EXPO = 100; // máximo de mensajes por petición a Expo
const LIMITE = 200; // notificaciones por ejecución
const VIGENCIA_HORAS = 24; // las más viejas ya no se envían como push

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return responder({ error: "METODO_NO_PERMITIDO" }, 405);

  const { data: autorizado, error: errorSecreto } = await db.rpc("validar_secreto_cron", {
    p_secreto: req.headers.get("x-secreto-cron") ?? "",
  });
  if (errorSecreto || autorizado !== true) return responder({ error: "NO_AUTORIZADO" }, 401);

  const limiteVigencia = new Date(Date.now() - VIGENCIA_HORAS * 3600 * 1000).toISOString();

  // Las que ya vencieron no se envían: solo se marcan para no revisarlas otra vez
  await db.from("notificaciones").update({ enviada_push: true })
    .eq("enviada_push", false).lt("creado_en", limiteVigencia);

  const { data: pendientes, error: errorPendientes } = await db
    .from("notificaciones")
    .select("id, destinatario_id, cita_id, tipo, titulo, cuerpo")
    .eq("enviada_push", false)
    .gte("creado_en", limiteVigencia)
    .order("creado_en")
    .limit(LIMITE)
    .returns<Notificacion[]>();
  if (errorPendientes) return responder({ error: errorPendientes.message }, 500);
  if (!pendientes?.length) return responder({ procesadas: 0, mensajes: 0 });

  const destinatarios = [...new Set(pendientes.map((n) => n.destinatario_id))];
  const { data: tokens, error: errorTokens } = await db
    .from("tokens_push").select("token, perfil_id").in("perfil_id", destinatarios);
  if (errorTokens) return responder({ error: errorTokens.message }, 500);

  const tokensPorPerfil = new Map<string, string[]>();
  for (const t of tokens ?? []) {
    tokensPorPerfil.set(t.perfil_id, [...(tokensPorPerfil.get(t.perfil_id) ?? []), t.token]);
  }

  const mensajes: MensajeExpo[] = pendientes.flatMap((n) =>
    (tokensPorPerfil.get(n.destinatario_id) ?? []).map((token) => ({
      to: token,
      title: n.titulo,
      body: n.cuerpo,
      sound: "default" as const,
      priority: "high" as const,
      data: { notificacionId: n.id, citaId: n.cita_id, tipo: n.tipo },
    }))
  );

  // Enviar a Expo por lotes y recoger los tokens que ya no sirven
  const tokensInvalidos = new Set<string>();
  const errores: string[] = [];
  let lotesFallidos = 0;
  for (let i = 0; i < mensajes.length; i += LOTE_EXPO) {
    const lote = mensajes.slice(i, i + LOTE_EXPO);
    try {
      const respuesta = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(lote),
      });
      const json = await respuesta.json() as { data?: TicketExpo[]; errors?: { message: string }[] };
      if (!respuesta.ok || !json.data) {
        lotesFallidos++;
        errores.push(json.errors?.map((e) => e.message).join("; ") ?? `HTTP ${respuesta.status}`);
        continue;
      }
      json.data.forEach((ticket, k) => {
        if (ticket.status === "error") {
          errores.push(ticket.details?.error ?? ticket.message ?? "error");
          if (ticket.details?.error === "DeviceNotRegistered") tokensInvalidos.add(lote[k].to);
        }
      });
    } catch (e) {
      lotesFallidos++;
      errores.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (tokensInvalidos.size) {
    await db.from("tokens_push").delete().in("token", [...tokensInvalidos]);
  }

  // Si Expo no respondió, se reintenta en la próxima ejecución; si respondió, quedan marcadas
  if (lotesFallidos === 0) {
    await db.from("notificaciones").update({ enviada_push: true }).in("id", pendientes.map((n) => n.id));
  }

  return responder({
    procesadas: lotesFallidos === 0 ? pendientes.length : 0,
    mensajes: mensajes.length,
    tokensBorrados: tokensInvalidos.size,
    errores,
  });
});
