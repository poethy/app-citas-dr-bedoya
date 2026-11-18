import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import type { Cita, HorarioAtencion } from '../src/models';
import { fechaLocal, instante, sumarDias } from '../src/utils/fechas';
import {
  citaFueraDeHorario,
  errorHorario,
  errorJornada,
  HORARIO_INICIAL,
  jornadaDe,
  almuerzoDe,
  resumirHorario,
  textoDias,
  textoHora,
  textoRango,
} from '../src/utils/horario';

const disco = vi.hoisted(() => ({ datos: new Map<string, string>() }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => disco.datos.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      disco.datos.set(k, v);
    }),
  },
}));
vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: async (_: string, v: string) => createHash('sha256').update(v).digest('hex'),
  randomUUID,
}));

const copia = (h: HorarioAtencion): HorarioAtencion => JSON.parse(JSON.stringify(h));

/** Una fecha (YYYY-MM-DD) futura que cae en el día de la semana pedido. */
function proximo(diaSemana: number): string {
  let f = sumarDias(fechaLocal(), 3);
  while (instante(f, 720).getUTCDay() !== diaSemana) f = sumarDias(f, 1);
  return f;
}
function cita(
  fecha: string,
  desde: number,
  minutos: number,
  estado: Cita['estado'] = 'confirmada',
): Cita {
  return {
    id: `c-${fecha}-${desde}`,
    pacienteId: 'ana',
    pacienteNombre: 'Ana Gómez',
    telefono: '3105551234',
    servicioId: 'limpieza',
    servicioNombre: 'Limpieza dental',
    inicio: instante(fecha, desde).toISOString(),
    fin: instante(fecha, desde + minutos).toISOString(),
    estado,
    precioAcordadoCop: 120000,
    duracionAcordadaMin: minutos,
    origen: 'app',
  };
}

describe('textos del horario (Figma C08 y P05)', () => {
  it('formatea horas como en las pantallas', () => {
    expect(textoHora(480)).toBe('8:00 a. m.');
    expect(textoHora(720)).toBe('12:00 m.');
    expect(textoHora(810)).toBe('1:30 p. m.');
    expect(textoHora(1080)).toBe('6:00 p. m.');
  });
  it('acorta el rango cuando las dos horas son de la tarde', () => {
    expect(textoRango(480, 1080)).toBe('8:00 a. m. – 6:00 p. m.');
    expect(textoRango(480, 720)).toBe('8:00 a. m. – 12:00 m.');
    expect(textoRango(750, 810)).toBe('12:30 – 1:30 p. m.');
  });
  it('nombra los días seguidos con «a»', () => {
    expect(textoDias([1, 2, 3, 4, 5])).toBe('lunes a viernes');
    expect(textoDias([1, 3, 5])).toBe('lunes, miércoles y viernes');
    expect(textoDias([6])).toBe('sábado');
  });
  it('P05 agrupa los días con la misma jornada', () => {
    expect(resumirHorario(HORARIO_INICIAL)).toEqual([
      { dias: 'Lunes a viernes', horas: '8:00 a. m. – 6:00 p. m.' },
      { dias: 'Sábado', horas: '8:00 a. m. – 12:00 m.' },
    ]);
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.filter((d) => d.diaSemana !== 3);
    expect(resumirHorario(h).map((g) => g.dias)).toEqual([
      'Lunes y martes',
      'Jueves y viernes',
      'Sábado',
    ]);
  });
});

describe('jornada y almuerzo de una fecha', () => {
  it('el domingo está cerrado y el sábado no tiene almuerzo', () => {
    expect(jornadaDe(proximo(0), HORARIO_INICIAL)).toBeNull();
    expect(almuerzoDe(proximo(6), HORARIO_INICIAL)).toBeNull();
    expect(jornadaDe(proximo(6), HORARIO_INICIAL)?.fin).toBe(
      instante(proximo(6), 720).toISOString(),
    );
  });
  it('lee el horario guardado, no uno fijo', () => {
    const h = copia(HORARIO_INICIAL);
    h.dias.push({ diaSemana: 0, apertura: 540, cierre: 660 });
    expect(jornadaDe(proximo(0), h)?.inicio).toBe(instante(proximo(0), 540).toISOString());
  });
});

describe('C09 validaciones', () => {
  it('el cierre debe ser posterior a la apertura', () => {
    expect(errorJornada(480, 1080)).toBeNull();
    expect(errorJornada(1080, 480)).toBe('La hora de cierre debe ser posterior a la de apertura.');
    expect(errorJornada(600, 600)).not.toBeNull();
  });
  it('rechaza días repetidos', () => {
    const h = copia(HORARIO_INICIAL);
    h.dias.push({ diaSemana: 1, apertura: 540, cierre: 600 });
    expect(errorHorario(h)).not.toBeNull();
    expect(errorHorario(HORARIO_INICIAL)).toBeNull();
  });
});

describe('C10 citas fuera del nuevo horario', () => {
  const jueves = proximo(4);
  const ahora = new Date();
  it('encuentra la cita que queda después del cierre', () => {
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.map((d) => (d.diaSemana === 4 ? { ...d, cierre: 600 } : d));
    const c = cita(jueves, 660, 45);
    expect(citaFueraDeHorario([c], h, ahora)?.id).toBe(c.id);
  });
  it('encuentra la cita de un día que se cierra o que cruza el almuerzo', () => {
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.filter((d) => d.diaSemana !== 4);
    expect(citaFueraDeHorario([cita(jueves, 480, 45)], h, ahora)).not.toBeNull();
    const h2 = copia(HORARIO_INICIAL);
    h2.almuerzo = { inicio: 840, fin: 900, dias: [4] };
    expect(citaFueraDeHorario([cita(jueves, 855, 90)], h2, ahora)).not.toBeNull();
  });
  it('no cuenta canceladas, vencidas ni citas que ya pasaron', () => {
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.filter((d) => d.diaSemana !== 4);
    expect(citaFueraDeHorario([cita(jueves, 480, 45, 'cancelada')], h, ahora)).toBeNull();
    expect(citaFueraDeHorario([cita(jueves, 480, 45, 'vencida')], h, ahora)).toBeNull();
    const pasado = sumarDias(fechaLocal(), -7);
    expect(
      citaFueraDeHorario([cita(pasado, 480, 45)], { dias: [], almuerzo: null }, ahora),
    ).toBeNull();
  });
  it('devuelve la primera por fecha', () => {
    const otra = sumarDias(jueves, 7);
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.filter((d) => d.diaSemana !== 4);
    const primera = cita(jueves, 600, 45);
    expect(citaFueraDeHorario([cita(otra, 600, 45), primera], h, ahora)?.id).toBe(primera.id);
  });
});

describe('servicio simulado: guardarHorario', () => {
  async function repo() {
    return (await import('../src/services/mock/repositorio')).repositorio;
  }
  beforeEach(() => {
    vi.resetModules();
    disco.datos.clear();
  });

  it('el paciente no puede cambiar el horario', async () => {
    const r = await repo();
    await r.login('ana@demo.com', 'Demo2026');
    await expect(r.guardarHorario(copia(HORARIO_INICIAL))).rejects.toMatchObject({
      codigo: 'NO_AUTORIZADO',
    });
  });

  it('guarda el horario y las franjas lo usan', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.map((d) => (d.diaSemana === 6 ? { ...d, cierre: 780 } : d));
    await r.guardarHorario(h);
    vi.resetModules();
    const db = await (await repo()).consultar();
    expect(db.horario.dias.find((d) => d.diaSemana === 6)?.cierre).toBe(780);
  });

  it('C10: no guarda si una cita queda fuera y dice cuál', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    const db = await r.consultar();
    const activa = db.citas
      .filter((c) => c.estado === 'confirmada' && Date.parse(c.inicio) > Date.now())
      .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio))[0];
    expect(activa).toBeDefined();
    const dia = instante(fechaLocal(activa!.inicio), 720).getUTCDay();
    const h = copia(db.horario);
    h.dias = h.dias.filter((d) => d.diaSemana !== dia);
    await expect(r.guardarHorario(h)).rejects.toMatchObject({
      codigo: 'CITAS_FUERA_DE_HORARIO',
      referencia: activa!.id,
    });
    expect((await r.consultar()).horario).toEqual(db.horario);
  });

  it('rechaza un cierre antes de la apertura', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    const h = copia(HORARIO_INICIAL);
    h.dias = h.dias.map((d) => (d.diaSemana === 1 ? { ...d, apertura: 1080, cierre: 480 } : d));
    await expect(r.guardarHorario(h)).rejects.toMatchObject({ codigo: 'HORARIO_INVALIDO' });
  });

  it('los datos guardados antes de C08 reciben el horario inicial', async () => {
    const r = await repo();
    await r.consultar();
    const [clave, raw] = [...disco.datos.entries()][0]!;
    const viejo = JSON.parse(raw);
    delete viejo.horario;
    disco.datos.set(clave, JSON.stringify(viejo));
    vi.resetModules();
    expect((await (await repo()).consultar()).horario).toEqual(HORARIO_INICIAL);
  });
});
