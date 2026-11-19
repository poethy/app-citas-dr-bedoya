import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseDatos } from '../src/models';
import { leerRango, mapCita, mapHorario, parametrosHorario } from '../src/mappers/remoto.mapper';
import { calcularFranjas } from '../src/utils/franjas';
import { instante } from '../src/utils/fechas';
import { HORARIO_INICIAL } from '../src/utils/horario';
import { ErrorApi, traducirErrorHttp } from '../src/services/http/errores';
import type { CitaRespuesta } from '../src/types/api';

// Axios y Supabase Auth simulados: se revisan las peticiones exactas sin tocar el servidor
const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  usuario: null as { id: string; email: string } | null,
}));
vi.mock('@/services/http/cliente', () => ({ clienteHttp: http }));
vi.mock('@/lib/supabase', () => ({
  obtenerSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: { session: auth.usuario ? { user: auth.usuario, access_token: 't' } : null },
      }),
      signInWithPassword: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      signUp: vi.fn(),
    },
  }),
  obtenerToken: async () => 't',
}));

const ANA = { id: '00000000-0000-0000-0000-0000000000a1', email: 'ana@correo.com' };
const DOCTOR = { id: '00000000-0000-0000-0000-0000000000d1', email: 'doctor@consultorio.co' };

function filaCita(parcial: Partial<CitaRespuesta> = {}): CitaRespuesta {
  return {
    id: 'c1',
    numero: 1024,
    paciente_id: 'p1',
    servicio_id: 's1',
    inicio: '2026-11-26T16:00:00+00:00',
    fin: '2026-11-26T16:45:00+00:00',
    estado: 'confirmada',
    origen: 'app',
    precio_acordado_cop: 120000,
    duracion_acordada_min: 45,
    paciente: { nombre: 'Ana Gómez', telefono: '3105551234', perfil_id: ANA.id },
    servicio: { nombre: 'Limpieza dental' },
    ...parcial,
  };
}

/** Respuestas de GET según la ruta, como las daría PostgREST. */
function responderGet(rol: 'paciente' | 'odontologo', citas: CitaRespuesta[] = [filaCita()]) {
  http.get.mockImplementation(async (ruta: string) => {
    const tablas: Record<string, unknown[]> = {
      '/perfiles': [
        {
          id: rol === 'paciente' ? ANA.id : DOCTOR.id,
          rol,
          nombre: rol === 'paciente' ? 'Ana Gómez' : 'Camilo Bedoya',
          telefono: '3105551234',
          correo: rol === 'paciente' ? ANA.email : DOCTOR.email,
        },
      ],
      '/servicios': [
        {
          id: 's1',
          nombre: 'Limpieza dental',
          duracion_min: 45,
          precio_cop: 120000,
          confirmacion: 'inmediata',
          activo: true,
        },
      ],
      '/citas': citas,
      '/configuracion': [{ anticipacion_agendar_horas: 24, anticipacion_cambios_horas: 12 }],
      '/horario_atencion': [
        { dia_semana: 4, hora_inicio: '08:00:00', hora_fin: '18:00:00' },
        { dia_semana: 6, hora_inicio: '08:00:00', hora_fin: '12:00:00' },
      ],
      '/bloqueos_recurrentes': [
        {
          id: 'r1',
          dia_semana: 4,
          hora_inicio: '12:30:00',
          hora_fin: '13:30:00',
          motivo: 'Almuerzo',
        },
      ],
      '/notificaciones': [],
      '/bloqueos': [
        {
          id: 'b1',
          motivo: 'Ausencia',
          rango: '["2026-11-26 21:30:00+00","2026-11-26 22:15:00+00")',
        },
      ],
    };
    return { data: tablas[ruta] ?? [] };
  });
}

async function remoto() {
  return (await import('../src/services/remoto/repositorio.remoto')).repositorioRemoto;
}

beforeEach(() => {
  vi.resetModules();
  for (const f of Object.values(http)) f.mockReset();
  auth.usuario = null;
});

describe('mappers de Supabase', () => {
  it('mapCita usa el perfil del paciente, el número y fechas ISO en UTC', () => {
    const cita = mapCita(filaCita());
    expect(cita).toMatchObject({
      id: 'c1',
      numero: 1024,
      pacienteId: ANA.id,
      pacienteNombre: 'Ana Gómez',
      servicioNombre: 'Limpieza dental',
      inicio: '2026-11-26T16:00:00.000Z',
      precioAcordadoCop: 120000,
      duracionAcordadaMin: 45,
    });
  });
  it('un paciente sin cuenta queda con pacienteId null', () => {
    expect(
      mapCita(filaCita({ paciente: { nombre: 'Pedro', telefono: '3112223344', perfil_id: null } }))
        .pacienteId,
    ).toBeNull();
  });
  it('lee el rango de un bloqueo', () => {
    expect(leerRango('["2026-11-26 21:30:00+00","2026-11-26 22:15:00+00")')).toEqual({
      inicio: '2026-11-26T21:30:00.000Z',
      fin: '2026-11-26T22:15:00.000Z',
    });
    expect(leerRango('empty')).toBeNull();
  });
  it('el horario va y vuelve igual entre la base y la app', () => {
    const p = parametrosHorario(HORARIO_INICIAL);
    expect(p.p_dias[0]).toEqual({ dia_semana: 1, hora_inicio: '08:00', hora_fin: '18:00' });
    expect(p.p_almuerzo).toEqual({
      hora_inicio: '12:30',
      hora_fin: '13:30',
      dias: [1, 2, 3, 4, 5],
    });
    const filas = p.p_dias.map((d) => ({
      ...d,
      hora_inicio: `${d.hora_inicio}:00`,
      hora_fin: `${d.hora_fin}:00`,
    }));
    const recurrentes = (p.p_almuerzo?.dias ?? []).map((d, i) => ({
      id: String(i),
      dia_semana: d,
      hora_inicio: '12:30:00',
      hora_fin: '13:30:00',
      motivo: 'Almuerzo',
    }));
    expect(mapHorario(filas, recurrentes)).toEqual(HORARIO_INICIAL);
  });
  it('FUERA_DE_PLAZO muestra las horas que manda la base', () => {
    expect(traducirErrorHttp(400, { message: 'FUERA_DE_PLAZO', details: '12' }).message).toContain(
      '12 h',
    );
  });
});

describe('repositorio remoto', () => {
  it('sin sesión devuelve datos vacíos y no consulta tablas', async () => {
    const r = await remoto();
    const db = await r.consultar();
    expect(db.sesionId).toBeNull();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('el paciente carga sus datos y no pide la tabla de bloqueos', async () => {
    auth.usuario = ANA;
    responderGet('paciente');
    const db = await (await remoto()).consultar();
    expect(db.sesionId).toBe(ANA.id);
    expect(db.perfiles[0]?.rol).toBe('paciente');
    expect(db.citas[0]?.pacienteId).toBe(ANA.id);
    expect(db.horario.dias.map((d) => d.diaSemana)).toEqual([4, 6]);
    expect(db.horario.almuerzo).toEqual({ inicio: 750, fin: 810, dias: [4] });
    expect(db.configuracion.anticipacionCambiosHoras).toBe(12);
    expect(http.get.mock.calls.map((c) => c[0])).not.toContain('/bloqueos');
  });

  it('el odontólogo también recibe los bloqueos', async () => {
    auth.usuario = DOCTOR;
    responderGet('odontologo');
    const db = await (await remoto()).consultar();
    expect(db.bloqueos).toEqual([
      {
        id: 'b1',
        motivo: 'Ausencia',
        inicio: '2026-11-26T21:30:00.000Z',
        fin: '2026-11-26T22:15:00.000Z',
      },
    ]);
  });

  it('listado y detalle de citas van por GET /citas (requisito HTTP)', async () => {
    auth.usuario = ANA;
    responderGet('paciente');
    const r = await remoto();
    expect(await r.listarCitas()).toHaveLength(1);
    expect((await r.obtenerCita('c1')).id).toBe('c1');
    const detalle = http.get.mock.calls.at(-1);
    expect(detalle?.[0]).toBe('/citas');
    expect(detalle?.[1].params.id).toBe('eq.c1');
  });

  it('el detalle de una cita que no existe da CITA_NO_EXISTE (M04)', async () => {
    auth.usuario = ANA;
    http.get.mockResolvedValue({ data: [] });
    await expect((await remoto()).obtenerCita('x')).rejects.toMatchObject({
      codigo: 'CITA_NO_EXISTE',
    });
  });

  it('el paciente agenda con solicitar_cita', async () => {
    auth.usuario = ANA;
    responderGet('paciente');
    http.post.mockResolvedValue({ data: { id: 'c1', estado: 'confirmada' } });
    const cita = await (
      await remoto()
    ).crearCita({ servicioId: 's1', inicio: '2026-11-26T16:00:00.000Z' });
    expect(http.post).toHaveBeenCalledWith('/rpc/solicitar_cita', {
      p_servicio_id: 's1',
      p_inicio: '2026-11-26T16:00:00.000Z',
    });
    expect(cita.id).toBe('c1');
  });

  it('el odontólogo registra con registrar_cita_consultorio (O09)', async () => {
    auth.usuario = DOCTOR;
    responderGet('odontologo');
    http.post.mockResolvedValue({ data: { id: 'c1', estado: 'confirmada' } });
    await (
      await remoto()
    ).crearCita({
      servicioId: 's1',
      inicio: '2026-11-26T16:00:00.000Z',
      pacienteNombre: 'Pedro Gil',
      telefono: '3112223344',
    });
    expect(http.post.mock.calls[0]?.[0]).toBe('/rpc/registrar_cita_consultorio');
  });

  it('aprobar una solicitud vencida avisa SOLICITUD_VENCIDA', async () => {
    auth.usuario = DOCTOR;
    http.post.mockResolvedValue({ data: { id: 'c1', estado: 'vencida' } });
    await expect((await remoto()).responder('c1', true)).rejects.toMatchObject({
      codigo: 'SOLICITUD_VENCIDA',
    });
  });

  it('C10: si la base rechaza el horario, se busca la cita para «Ver la cita»', async () => {
    auth.usuario = DOCTOR;
    const futura = new Date(Date.now() + 9 * 86400e3);
    // Un jueves futuro a las 11:00 a. m.
    while (futura.getUTCDay() !== 4) futura.setUTCDate(futura.getUTCDate() + 1);
    const fecha = futura.toISOString().slice(0, 10);
    const inicio = instante(fecha, 660).toISOString();
    const fin = instante(fecha, 705).toISOString();
    responderGet('odontologo', [filaCita({ id: 'jueves', inicio, fin })]);
    http.post.mockRejectedValue(new ErrorApi('CITAS_FUERA_DE_HORARIO'));
    const sinJueves = {
      ...HORARIO_INICIAL,
      dias: HORARIO_INICIAL.dias.filter((d) => d.diaSemana !== 4),
    };
    const error = await (await remoto()).guardarHorario(sinJueves).catch((e: unknown) => e);
    expect(error).toMatchObject({ codigo: 'CITAS_FUERA_DE_HORARIO', referencia: 'jueves' });
    expect(http.post.mock.calls[0]?.[0]).toBe('/rpc/actualizar_horario');
  });

  it('no deja cambiar el correo desde el perfil', async () => {
    auth.usuario = ANA;
    await expect(
      (await remoto()).guardarPerfil({
        nombre: 'Ana',
        telefono: '3105551234',
        correo: 'otro@correo.com',
      }),
    ).rejects.toMatchObject({ codigo: 'CORREO_NO_EDITABLE' });
    expect(http.patch).not.toHaveBeenCalled();
  });

  it('un día cerrado no tiene ocupación', async () => {
    http.post.mockResolvedValue({
      data: { fecha: '2026-11-29', abierto: false, ocupados: [], anticipacion_agendar_horas: 24 },
    });
    expect(await (await remoto()).ocupacionDia('2026-11-29')).toEqual([]);
  });
});

describe('franjas con la ocupación del servidor', () => {
  const fecha = '2026-11-26'; // jueves
  const db: BaseDatos = {
    version: 1,
    perfiles: [],
    servicios: [],
    citas: [],
    bloqueos: [],
    avisos: [],
    configuracion: { anticipacionAgendarHoras: 0, anticipacionCambiosHoras: 0 },
    horario: HORARIO_INICIAL,
    sesionId: null,
  };
  const ahora = new Date('2026-11-20T12:00:00Z');
  it('el paciente no ve libres las franjas ocupadas por otros', () => {
    const otro = {
      inicio: instante(fecha, 480).toISOString(),
      fin: instante(fecha, 600).toISOString(),
    };
    const franjas = calcularFranjas(db, fecha, 60, 'paciente', ahora, undefined, [otro]).franjas;
    expect(franjas[0]?.inicio).toBe(instante(fecha, 600).toISOString());
  });
  it('al reprogramar, la cita propia no ocupa su espacio', () => {
    const propia = {
      inicio: instante(fecha, 480).toISOString(),
      fin: instante(fecha, 540).toISOString(),
    };
    const conCita: BaseDatos = {
      ...db,
      citas: [
        {
          id: 'mia',
          pacienteId: 'ana',
          pacienteNombre: 'Ana',
          telefono: '',
          servicioId: 's',
          servicioNombre: 'S',
          ...propia,
          estado: 'confirmada',
          precioAcordadoCop: 0,
          duracionAcordadaMin: 60,
          origen: 'app',
        },
      ],
    };
    const franjas = calcularFranjas(conCita, fecha, 60, 'paciente', ahora, 'mia', [propia]).franjas;
    expect(franjas[0]?.inicio).toBe(propia.inicio);
  });
});
