import { describe, expect, it } from 'vitest';
import { crearDatosIniciales } from '../src/services/mock/seed';
import { calcularFranjas, cruza } from '../src/utils/franjas';
import {
  registrarCita,
  validarCambio,
  validarInicio,
  vencerSolicitudes,
  obtenerCita,
} from '../src/services/mock/reglas';
import { instante, HORA, MINUTO } from '../src/utils/fechas';
import { validarNumero } from '../src/utils/validaciones';

const fecha = '2026-11-19';
const ahora = new Date('2026-11-17T12:00:00-05:00');
function base() {
  const db = crearDatosIniciales('hash');
  db.citas = [];
  db.bloqueos = [];
  return db;
}
describe('Disponibilidad por tramos', () => {
  it('no suma dos huecos de 30 minutos para una cita de 45', () => {
    const db = base();
    db.bloqueos = [
      {
        id: '1',
        inicio: instante(fecha, 510).toISOString(),
        fin: instante(fecha, 1050).toISOString(),
        motivo: 'Ausencia',
      },
    ];
    expect(calcularFranjas(db, fecha, 45, 'paciente', ahora).capacidad).toBe(0);
  });
  it('resta una sola vez bloqueos que se superponen', () => {
    const db = base();
    db.bloqueos = [
      {
        id: '1',
        inicio: instante(fecha, 480).toISOString(),
        fin: instante(fecha, 540).toISOString(),
        motivo: '',
      },
      {
        id: '2',
        inicio: instante(fecha, 510).toISOString(),
        fin: instante(fecha, 570).toISOString(),
        motivo: '',
      },
    ];
    expect(calcularFranjas(db, fecha, 30, 'paciente', ahora).capacidad).toBe(15);
  });
  it('no permite que una franja cruce el almuerzo', () => {
    const resultado = calcularFranjas(base(), fecha, 90, 'paciente', ahora);
    expect(
      resultado.franjas.every(
        (f) =>
          !cruza(f, {
            inicio: instante(fecha, 750).toISOString(),
            fin: instante(fecha, 810).toISOString(),
          }),
      ),
    ).toBe(true);
  });
  it('permite intervalos contiguos', () => {
    expect(
      cruza(
        { inicio: instante(fecha, 480).toISOString(), fin: instante(fecha, 510).toISOString() },
        { inicio: instante(fecha, 510).toISOString(), fin: instante(fecha, 540).toISOString() },
      ),
    ).toBe(false);
  });
  it('el domingo está cerrado', () =>
    expect(calcularFranjas(base(), '2026-11-22', 30, 'paciente', ahora).capacidad).toBe(0));
  it('el doctor puede usar las franjas de hoy que el paciente no puede', () => {
    const n = instante(fecha, 480);
    expect(calcularFranjas(base(), fecha, 30, 'paciente', n).capacidad).toBe(0);
    expect(calcularFranjas(base(), fecha, 30, 'odontologo', n).capacidad).toBeGreaterThan(0);
  });
  it.each([0, -15, NaN, 16, 181])('rechaza duración inválida %s', (d) =>
    expect(calcularFranjas(base(), fecha, d, 'paciente', ahora).capacidad).toBe(0),
  );
});
describe('Reglas por rol y vencimiento', () => {
  it('una cita del doctor queda confirmada aunque el servicio exija aprobación', () => {
    const db = base();
    const cita = registrarCita(
      db,
      db.perfiles[1],
      {
        servicioId: 'resina',
        inicio: instante(fecha, 480).toISOString(),
        pacienteNombre: 'Pedro Gil',
        telefono: '3112223344',
      },
      'nueva',
      instante(fecha, 470),
    );
    expect(cita.estado).toBe('confirmada');
  });
  it('el paciente debe cumplir su anticipación para agendar', () => {
    const db = base();
    expect(() =>
      registrarCita(
        db,
        db.perfiles[0],
        { servicioId: 'resina', inicio: instante(fecha, 480).toISOString() },
        'nueva',
        instante(fecha, 470),
      ),
    ).toThrow(/anticipación/);
  });
  it('exactamente en el límite se permite agendar', () => {
    const db = base();
    const inicio = instante(fecha, 480);
    expect(() =>
      validarInicio(
        db,
        db.perfiles[0],
        inicio.toISOString(),
        30,
        new Date(inicio.getTime() - 24 * HORA),
      ),
    ).not.toThrow();
  });
  it('solo el doctor puede cancelar fuera del plazo', () => {
    const db = base();
    const cita = registrarCita(
      db,
      db.perfiles[0],
      { servicioId: 'limpieza', inicio: instante(fecha, 480).toISOString() },
      'c',
      ahora,
    );
    const n = instante(fecha, 470);
    expect(() => validarCambio(db, db.perfiles[0], cita, n)).toThrow(/Llama/);
    expect(() => validarCambio(db, db.perfiles[1], cita, n)).not.toThrow();
  });
  it('vence al inicio exacto sin cambiar una confirmada', () => {
    const db = base();
    const a = registrarCita(
      db,
      db.perfiles[0],
      { servicioId: 'resina', inicio: instante(fecha, 480).toISOString() },
      'a',
      ahora,
    );
    const b = registrarCita(
      db,
      db.perfiles[0],
      { servicioId: 'valoracion', inicio: instante(fecha, 540).toISOString() },
      'b',
      ahora,
    );
    expect(vencerSolicitudes(db, new Date(Date.parse(a.inicio) - 1))).toHaveLength(0);
    expect(vencerSolicitudes(db, new Date(a.inicio))).toHaveLength(1);
    expect(a.estado).toBe('vencida');
    expect(b.estado).toBe('confirmada');
    expect(vencerSolicitudes(db, new Date(a.inicio))).toHaveLength(0);
  });
  it('un cambio del catálogo no cambia lo acordado en una cita', () => {
    const db = base();
    const c = registrarCita(
      db,
      db.perfiles[0],
      { servicioId: 'limpieza', inicio: instante(fecha, 480).toISOString() },
      'c',
      ahora,
    );
    db.servicios.find((s) => s.id === 'limpieza')!.precioCop = 999999;
    db.servicios.find((s) => s.id === 'limpieza')!.duracionMin = 90;
    expect(c.precioAcordadoCop).toBe(120000);
    expect(c.duracionAcordadaMin).toBe(45);
    expect(Date.parse(c.fin) - Date.parse(c.inicio)).toBe(45 * MINUTO);
  });
  it('deniega el detalle de otro paciente y el identificador inexistente', () => {
    const db = base();
    registrarCita(
      db,
      db.perfiles[1],
      {
        servicioId: 'valoracion',
        inicio: instante(fecha, 480).toISOString(),
        pacienteNombre: 'Pedro',
        telefono: '3112223344',
      },
      'c',
      ahora,
    );
    expect(() => obtenerCita(db, db.perfiles[0], 'c')).toThrow(/acceso/);
    expect(() => obtenerCita(db, db.perfiles[0], 'inexistente')).toThrow(/encontramos/);
  });
});
describe('Validaciones de campos', () => {
  it.each(['', 'texto', '-15', '0', '16', '181'])('rechaza duración %s', (v) =>
    expect(validarNumero(v, 'duracion')).not.toBeNull(),
  );
  it('permite precio cero sin permitir negativos', () => {
    expect(validarNumero('0', 'precio')).toBeNull();
    expect(validarNumero('-1', 'precio')).not.toBeNull();
  });
});
