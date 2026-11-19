// Servicio remoto: misma interfaz que el simulado (src/services/repositorio.ts), contra Supabase.
// Auth con supabase-js; todos los datos con Axios (clienteHttp). Las escrituras de citas van
// siempre por RPC: la base valida horario, choques, anticipación, permisos y estados.
import {
  mapAviso,
  mapBloqueo,
  mapConfiguracion,
  mapHorario,
  mapOcupados,
  isoUtc,
  mapServicio,
  parametrosHorario,
  type PerfilRemoto,
} from '@/mappers/remoto.mapper';
import type {
  Aviso,
  BaseDatos,
  Bloqueo,
  Cita,
  Configuracion,
  CrearCita,
  Franja,
  HorarioAtencion,
  Perfil,
  Servicio,
} from '@/models';
import { obtenerSupabase } from '@/lib/supabase';
import { clienteHttp } from '@/services/http/cliente';
import { ErrorApi } from '@/services/http/errores';
import type { Repositorio } from '@/services/repositorio';
import type {
  BloqueoRecurrenteRespuesta,
  BloqueoRespuesta,
  CitaFilaRespuesta,
  ConfiguracionRespuesta,
  DisponibilidadRespuesta,
  HorarioRespuesta,
  NotificacionRespuesta,
  ServicioRespuesta,
} from '@/types/api';
import { ErrorCitasFueraDeHorario, ErrorNegocio, type CitaAfectada } from '@/utils/errores';
import {
  citasFueraDeHorario,
  errorHorario,
  HORARIO_INICIAL,
  mensajeCitasFuera,
} from '@/utils/horario';
import { validarNumero } from '@/utils/validaciones';
import { cerrarSesion, iniciarSesion, registrarPaciente } from './auth.remoto';
import { listarCitas, obtenerCita } from './citas.remoto';
import { borrarTokenRegistrado } from './push.remoto';
import { obtenerPerfil } from './datos.remoto';

/** Código de un error de negocio (ErrorApi o ErrorNegocio), sin depender de la clase. */
const codigoDe = (e: unknown): string | undefined =>
  e instanceof Error && 'codigo' in e && typeof e.codigo === 'string' ? e.codigo : undefined;

/** Detalle de un ErrorApi, sin depender de la clase. */
const detalleDe = (e: unknown): string | undefined =>
  e instanceof Error && 'detalle' in e && typeof e.detalle === 'string' ? e.detalle : undefined;

/** Lista de citas del detalle de CITAS_FUERA_DE_HORARIO: [{ id, paciente, inicio }]. */
export function leerAfectadas(detalle: string | undefined): CitaAfectada[] {
  if (!detalle) return [];
  try {
    const lista: unknown = JSON.parse(detalle);
    if (!Array.isArray(lista)) return [];
    return lista.flatMap((x: { id?: unknown; paciente?: unknown; inicio?: unknown }) =>
      typeof x.id === 'string' && typeof x.paciente === 'string' && typeof x.inicio === 'string'
        ? [{ id: x.id, pacienteNombre: x.paciente, inicio: isoUtc(x.inicio) }]
        : [],
    );
  } catch {
    return [];
  }
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El modelo de la demo tiene `claveDemo`; con Supabase la contraseña nunca llega a la app. */
const comoPerfil = (p: PerfilRemoto): Perfil => ({ ...p, claveDemo: '' });

async function usuarioActual(): Promise<{ id: string; correo: string } | null> {
  const { data } = await obtenerSupabase().auth.getSession();
  const usuario = data.session?.user;
  return usuario ? { id: usuario.id, correo: usuario.email ?? '' } : null;
}

async function exigirUsuario(): Promise<{ id: string; correo: string }> {
  const usuario = await usuarioActual();
  if (!usuario) throw new ErrorApi('NO_AUTORIZADO', { detalle: 'Sin sesión' });
  return usuario;
}

function baseVacia(): BaseDatos {
  return {
    version: 1,
    perfiles: [],
    servicios: [],
    citas: [],
    bloqueos: [],
    avisos: [],
    configuracion: { anticipacionAgendarHoras: 24, anticipacionCambiosHoras: 24 },
    horario: HORARIO_INICIAL,
    sesionId: null,
  };
}

async function rpc<T>(nombre: string, parametros: object): Promise<T> {
  const { data } = await clienteHttp.post<T>(`/rpc/${nombre}`, parametros);
  return data;
}

/** Las RPC devuelven la fila de citas; se vuelve a pedir con el paciente y el servicio. */
async function citaCompleta(fila: CitaFilaRespuesta): Promise<Cita> {
  return obtenerCita(fila.id);
}

export const repositorioRemoto: Repositorio = {
  async consultar() {
    const usuario = await usuarioActual();
    if (!usuario) return baseVacia();
    const perfil = comoPerfil(await obtenerPerfil(usuario.id));
    const esDoctor = perfil.rol === 'odontologo';
    const [servicios, citas, configuracion, dias, recurrentes, avisos, bloqueos] =
      await Promise.all([
        clienteHttp.get<ServicioRespuesta[]>('/servicios', {
          params: { select: '*', order: 'nombre' },
        }),
        listarCitas(),
        clienteHttp.get<ConfiguracionRespuesta[]>('/configuracion', {
          params: {
            id: 'eq.1',
            select: 'anticipacion_agendar_horas,anticipacion_cambios_horas,latitud,longitud',
          },
        }),
        clienteHttp.get<HorarioRespuesta[]>('/horario_atencion', {
          params: { select: '*', order: 'dia_semana' },
        }),
        clienteHttp.get<BloqueoRecurrenteRespuesta[]>('/bloqueos_recurrentes', {
          params: { select: '*' },
        }),
        clienteHttp.get<NotificacionRespuesta[]>('/notificaciones', {
          params: {
            select: 'id,destinatario_id,cita_id,titulo,cuerpo,creado_en,leida',
            order: 'creado_en.desc',
          },
        }),
        // El paciente no lee bloqueos: la ocupación le llega con disponibilidad_dia
        esDoctor
          ? clienteHttp.get<BloqueoRespuesta[]>('/bloqueos', {
              params: { select: 'id,motivo,rango' },
            })
          : Promise.resolve({ data: [] as BloqueoRespuesta[] }),
      ]);
    const config = configuracion.data[0];
    return {
      version: 1,
      perfiles: [perfil],
      servicios: servicios.data.map(mapServicio),
      citas,
      bloqueos: bloqueos.data.map(mapBloqueo).filter((b): b is Bloqueo => b !== null),
      avisos: avisos.data.map(mapAviso) satisfies Aviso[],
      configuracion: config ? mapConfiguracion(config) : baseVacia().configuracion,
      horario: mapHorario(dias.data, recurrentes.data),
      sesionId: perfil.id,
    };
  },

  async login(correo, clave) {
    await iniciarSesion(correo, clave);
    const usuario = await exigirUsuario();
    return comoPerfil(await obtenerPerfil(usuario.id));
  },

  async registro(datos) {
    const conSesion = await registrarPaciente(datos);
    if (!conSesion)
      throw new ErrorNegocio(
        'CORREO_SIN_CONFIRMAR',
        'Te enviamos un correo para confirmar tu cuenta. Ábrelo y luego inicia sesión.',
      );
    const usuario = await exigirUsuario();
    return comoPerfil(await obtenerPerfil(usuario.id));
  },

  async salir() {
    // Primero el token (necesita la sesión para pasar la RLS), luego la sesión
    await borrarTokenRegistrado();
    await cerrarSesion();
  },

  // S06 (paciente) y O09 (odontólogo)
  async crearCita(datos: CrearCita) {
    const usuario = await exigirUsuario();
    const perfil = await obtenerPerfil(usuario.id);
    const fila =
      perfil.rol === 'odontologo'
        ? await rpc<CitaFilaRespuesta>('registrar_cita_consultorio', {
            p_nombre: datos.pacienteNombre ?? '',
            p_telefono: datos.telefono ?? '',
            p_servicio_id: datos.servicioId,
            p_inicio: datos.inicio,
          })
        : await rpc<CitaFilaRespuesta>('solicitar_cita', {
            p_servicio_id: datos.servicioId,
            p_inicio: datos.inicio,
          });
    return citaCompleta(fila);
  },

  // M05
  async cancelar(id) {
    return citaCompleta(await rpc<CitaFilaRespuesta>('cancelar_cita', { p_cita_id: id }));
  },

  // M07
  async reprogramar(id, inicio) {
    return citaCompleta(
      await rpc<CitaFilaRespuesta>('reprogramar_cita', { p_cita_id: id, p_nuevo_inicio: inicio }),
    );
  },

  // O04, O05. Si la solicitud ya llegó a su hora, la base la deja vencida y la devuelve
  // sin error (B4); aquí se convierte en SOLICITUD_VENCIDA para mostrar el mensaje.
  async responder(id, aprobar) {
    const fila = await rpc<CitaFilaRespuesta>('responder_solicitud', {
      p_cita_id: id,
      p_aprobar: aprobar,
    });
    if (fila.estado === 'vencida') throw new ErrorApi('SOLICITUD_VENCIDA');
    return citaCompleta(fila);
  },

  // C01, C02
  async guardarServicio(servicio: Servicio) {
    const error =
      validarNumero(String(servicio.precioCop), 'precio') ||
      validarNumero(String(servicio.duracionMin), 'duracion');
    if (error || !servicio.nombre.trim())
      throw new ErrorNegocio('DATOS_INVALIDOS', error || 'Escribe el nombre del servicio.');
    const cuerpo = {
      nombre: servicio.nombre.trim(),
      precio_cop: servicio.precioCop,
      duracion_min: servicio.duracionMin,
      confirmacion: servicio.confirmacion,
      activo: servicio.activo,
    };
    if (ES_UUID.test(servicio.id))
      await clienteHttp.patch('/servicios', cuerpo, { params: { id: `eq.${servicio.id}` } });
    else await clienteHttp.post('/servicios', cuerpo);
  },

  // C04
  async guardarConfiguracion(config: Configuracion) {
    const horas = [config.anticipacionAgendarHoras, config.anticipacionCambiosHoras];
    if (horas.some((v) => !Number.isInteger(v) || v < 1 || v > 72))
      throw new ErrorNegocio('DATOS_INVALIDOS', 'Usa valores entre 1 y 72 horas.');
    await clienteHttp.patch(
      '/configuracion',
      {
        anticipacion_agendar_horas: config.anticipacionAgendarHoras,
        anticipacion_cambios_horas: config.anticipacionCambiosHoras,
      },
      { params: { id: 'eq.1' } },
    );
  },

  // C08–C10
  async guardarHorario(horario: HorarioAtencion) {
    const invalido = errorHorario(horario);
    if (invalido) throw new ErrorNegocio('HORARIO_INVALIDO', invalido);
    try {
      await rpc('actualizar_horario', parametrosHorario(horario));
    } catch (e) {
      if (codigoDe(e) !== 'CITAS_FUERA_DE_HORARIO') throw e;
      // La base no guardó nada. Su detalle trae la lista (migración …_actualizar_horario_lista);
      // con la versión anterior se calcula aquí con las citas.
      const desdeBase = leerAfectadas(detalleDe(e));
      const afectadas: CitaAfectada[] = desdeBase.length
        ? desdeBase
        : citasFueraDeHorario(await listarCitas(), horario, new Date()).map((c) => ({
            id: c.id,
            pacienteNombre: c.pacienteNombre,
            inicio: c.inicio,
          }));
      if (!afectadas.length) throw e;
      throw new ErrorCitasFueraDeHorario(afectadas, mensajeCitasFuera(afectadas));
    }
    return horario;
  },

  // P04. El correo es el de la cuenta de Auth: no se cambia desde aquí.
  async guardarPerfil(datos) {
    const usuario = await exigirUsuario();
    if (datos.correo.trim().toLowerCase() !== usuario.correo.toLowerCase())
      throw new ErrorNegocio(
        'CORREO_NO_EDITABLE',
        'El correo de la cuenta no se puede cambiar desde la app.',
      );
    await clienteHttp.patch(
      '/perfiles',
      { nombre: datos.nombre.trim(), telefono: datos.telefono },
      { params: { id: `eq.${usuario.id}` } },
    );
  },

  // C05–C07
  async bloquear(input) {
    await rpc('crear_bloqueo', {
      p_inicio: input.inicio,
      p_fin: input.fin,
      p_motivo: input.motivo,
    });
  },
  async eliminarBloqueo(id) {
    await clienteHttp.delete('/bloqueos', { params: { id: `eq.${id}` } });
  },

  // P03, O11
  async leerAviso(id) {
    await clienteHttp.patch('/notificaciones', { leida: true }, { params: { id: `eq.${id}` } });
  },

  listarCitas,
  obtenerCita,

  // S03, M07, O09
  async ocupacionDia(fecha: string): Promise<Franja[]> {
    return mapOcupados(
      await rpc<DisponibilidadRespuesta>('disponibilidad_dia', { p_fecha: fecha }),
    );
  },
};
