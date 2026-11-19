// Mappers de las respuestas de Supabase a los modelos internos. Funciones puras con pruebas
// (tests/remoto.test.ts y tests/integracion.test.ts).
import type {
  Aviso,
  Bloqueo,
  Cita,
  Configuracion,
  Franja,
  HorarioAtencion,
  Perfil,
  Servicio,
} from '@/models';
import type {
  ActualizarHorarioParametros,
  BloqueoRecurrenteRespuesta,
  BloqueoRespuesta,
  CitaRespuesta,
  ConfiguracionRespuesta,
  DisponibilidadRespuesta,
  HorarioRespuesta,
  NotificacionRespuesta,
  PerfilRespuesta,
  ServicioRespuesta,
} from '@/types/api';

/** El perfil remoto no tiene la clave de la demo. */
export type PerfilRemoto = Omit<Perfil, 'claveDemo'>;

/** Las fechas de Postgres llegan como «2026-11-19T13:00:00+00:00»; la app compara ISO en UTC. */
export const isoUtc = (valor: string): string => new Date(valor).toISOString();

export function mapPerfil(r: PerfilRespuesta): PerfilRemoto {
  return { id: r.id, rol: r.rol, nombre: r.nombre, telefono: r.telefono, correo: r.correo };
}

export function mapServicio(r: ServicioRespuesta): Servicio {
  return {
    id: r.id,
    nombre: r.nombre,
    duracionMin: r.duracion_min,
    precioCop: r.precio_cop,
    confirmacion: r.confirmacion,
    activo: r.activo,
  };
}

export function mapConfiguracion(r: ConfiguracionRespuesta): Configuracion {
  return {
    anticipacionAgendarHoras: r.anticipacion_agendar_horas,
    anticipacionCambiosHoras: r.anticipacion_cambios_horas,
    ubicacion:
      r.latitud !== null && r.longitud !== null
        ? { latitud: r.latitud, longitud: r.longitud }
        : null,
  };
}

/**
 * Cita con el paciente y el servicio embebidos. `pacienteId` es el perfil (la cuenta) del
 * paciente, como en el servicio simulado; es null si el doctor lo agendó sin cuenta.
 */
export function mapCita(r: CitaRespuesta): Cita {
  return {
    id: r.id,
    numero: r.numero,
    pacienteId: r.paciente?.perfil_id ?? null,
    pacienteNombre: r.paciente?.nombre ?? 'Paciente',
    telefono: r.paciente?.telefono ?? '',
    servicioId: r.servicio_id,
    servicioNombre: r.servicio?.nombre ?? 'Servicio',
    inicio: isoUtc(r.inicio),
    fin: isoUtc(r.fin),
    estado: r.estado,
    precioAcordadoCop: r.precio_acordado_cop,
    duracionAcordadaMin: r.duracion_acordada_min,
    origen: r.origen,
  };
}

export function mapAviso(r: NotificacionRespuesta): Aviso {
  return {
    id: r.id,
    destinatarioId: r.destinatario_id,
    citaId: r.cita_id ?? '',
    titulo: r.titulo,
    cuerpo: r.cuerpo,
    creadoEn: isoUtc(r.creado_en),
    leida: r.leida,
  };
}

/** `["2026-11-19 16:30:00+00","2026-11-19 17:15:00+00")` → inicio y fin en ISO. */
export function leerRango(rango: string): Franja | null {
  const partes = rango
    .replace(/^[[(]|[\])]$/g, '')
    .split(',')
    .map((p) => p.trim().replace(/^"|"$/g, ''));
  const [a, b] = partes;
  if (!a || !b) return null;
  // Postgres escribe la zona como «+00»; JavaScript necesita «+00:00»
  const iso = (t: string) => t.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const inicio = Date.parse(iso(a));
  const fin = Date.parse(iso(b));
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return null;
  return { inicio: new Date(inicio).toISOString(), fin: new Date(fin).toISOString() };
}

export function mapBloqueo(r: BloqueoRespuesta): Bloqueo | null {
  const rango = leerRango(r.rango);
  return rango ? { id: r.id, motivo: r.motivo, ...rango } : null;
}

/** «08:00:00» → 480 */
export function minutosDe(hora: string): number {
  const [h = '0', m = '0'] = hora.split(':');
  return Number(h) * 60 + Number(m);
}
/** 480 → «08:00» */
export function horaDe(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

export function mapHorario(
  dias: HorarioRespuesta[],
  recurrentes: BloqueoRecurrenteRespuesta[],
): HorarioAtencion {
  const almuerzos = recurrentes.filter((r) => r.motivo === 'Almuerzo');
  const primero = almuerzos[0];
  return {
    dias: dias
      .map((d) => ({
        diaSemana: d.dia_semana,
        apertura: minutosDe(d.hora_inicio),
        cierre: minutosDe(d.hora_fin),
      }))
      .sort((a, b) => a.diaSemana - b.diaSemana),
    almuerzo: primero
      ? {
          inicio: minutosDe(primero.hora_inicio),
          fin: minutosDe(primero.hora_fin),
          dias: almuerzos.map((a) => a.dia_semana).sort((a, b) => a - b),
        }
      : null,
  };
}

export function parametrosHorario(h: HorarioAtencion): ActualizarHorarioParametros {
  return {
    p_dias: h.dias.map((d) => ({
      dia_semana: d.diaSemana,
      hora_inicio: horaDe(d.apertura),
      hora_fin: horaDe(d.cierre),
    })),
    p_almuerzo: h.almuerzo
      ? {
          hora_inicio: horaDe(h.almuerzo.inicio),
          hora_fin: horaDe(h.almuerzo.fin),
          dias: h.almuerzo.dias,
        }
      : null,
  };
}

/** Ocupación de un día (citas, bloqueos y almuerzo) sin datos de pacientes (RF-03). */
export function mapOcupados(r: DisponibilidadRespuesta): Franja[] {
  return r.abierto ? r.ocupados.map((o) => ({ inicio: isoUtc(o.inicio), fin: isoUtc(o.fin) })) : [];
}
