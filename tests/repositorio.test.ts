import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import { instante, fechaLocal, sumarDias } from '../src/utils/fechas';
import { pacienteNuevaCitaSchema } from '../src/utils/validaciones';
const disco = vi.hoisted(() => ({ datos: new Map<string, string>(), fallar: false }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => disco.datos.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      if (disco.fallar) throw new Error('Disco no disponible');
      disco.datos.set(k, v);
    }),
  },
}));
vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: async (_: string, v: string) => createHash('sha256').update(v).digest('hex'),
  randomUUID,
}));
async function repo() {
  return (await import('../src/services/mock/repositorio')).repositorio;
}
beforeEach(() => {
  vi.resetModules();
  disco.datos.clear();
  disco.fallar = false;
});
describe('Repositorio persistente', () => {
  it('conserva la sesión y los cambios después de recargar el módulo', async () => {
    const r = await repo();
    await r.login('ana@demo.com', 'Demo2026');
    await r.guardarPerfil({
      nombre: 'Ana Actualizada',
      telefono: '3105551234',
      correo: 'ana@demo.com',
    });
    vi.resetModules();
    const db = await (await repo()).consultar();
    expect(db.sesionId).toBe('ana');
    expect(db.perfiles.find((p) => p.id === 'ana')?.nombre).toBe('Ana Actualizada');
  });
  it('no anuncia ni conserva un cambio si falla la escritura', async () => {
    const r = await repo();
    await r.login('ana@demo.com', 'Demo2026');
    disco.fallar = true;
    await expect(
      r.guardarPerfil({ nombre: 'No guardar', telefono: '3105551234', correo: 'ana@demo.com' }),
    ).rejects.toThrow('Disco');
    disco.fallar = false;
    expect((await r.consultar()).perfiles.find((p) => p.id === 'ana')?.nombre).toBe('Ana Gómez');
  });
  it('serializa dos registros en la misma franja', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    let fecha = sumarDias(fechaLocal(), 4);
    if (instante(fecha, 720).getUTCDay() === 0) fecha = sumarDias(fecha, 1);
    const datos = {
      servicioId: 'valoracion',
      inicio: instante(fecha, 480).toISOString(),
      pacienteNombre: 'Pedro Gil',
      telefono: '3112223344',
    };
    const results = await Promise.allSettled([r.crearCita(datos), r.crearCita(datos)]);
    expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((x) => x.status === 'rejected')).toHaveLength(1);
  });
  it.each(['2145678901', '1234', ''])(
    'registra como odontólogo con teléfono «%s»',
    async (telefono) => {
      const r = await repo();
      const paciente = pacienteNuevaCitaSchema.parse({ nombre: ' Ana Gómez ', telefono });
      await r.login('doctor@demo.com', 'Demo2026');
      let fecha = sumarDias(fechaLocal(), 4);
      if (instante(fecha, 720).getUTCDay() === 0) fecha = sumarDias(fecha, 1);
      const datos = {
        servicioId: 'resina',
        inicio: instante(fecha, 480).toISOString(),
        pacienteNombre: paciente.nombre,
        telefono: paciente.telefono,
      };
      await expect(r.crearCita({ ...datos, telefono: '12345678901' })).rejects.toThrow(
        /10 caracteres/,
      );
      const cita = await r.crearCita(datos);
      expect(cita).toMatchObject({
        pacienteNombre: 'Ana Gómez',
        telefono,
        estado: 'confirmada',
      });
    },
  );
  it('no elimina las citas al cerrar sesión', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    const antes = (await r.consultar()).citas.length;
    await r.salir();
    const despues = await r.consultar();
    expect(despues.sesionId).toBeNull();
    expect(despues.citas.length).toBe(antes);
  });
  it('persiste el vencimiento incluso si luego se rechaza la aprobación', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    const cita = await r.prepararVencimientoDemo();
    const db = await r.consultar();
    const pendiente = db.citas.find((c) => c.id === cita.id)!;
    pendiente.inicio = new Date(Date.now() - 1000).toISOString();
    pendiente.fin = new Date(Date.now() + 59000).toISOString();
    disco.datos.set('citas-bedoya:v1', JSON.stringify(db));
    vi.resetModules();
    const recargado = await repo();
    await expect(recargado.responder(cita.id, true)).rejects.toThrow(/venció/);
    vi.resetModules();
    const final = await (await repo()).consultar();
    expect(final.citas.find((c) => c.id === cita.id)?.estado).toBe('vencida');
    expect(
      final.avisos.filter((a) => a.citaId === cita.id && a.titulo === 'Solicitud vencida'),
    ).toHaveLength(2);
  });
  it('una reprogramación fallida mantiene el horario original', async () => {
    const r = await repo();
    await r.login('doctor@demo.com', 'Demo2026');
    const db = await r.consultar();
    const cita = db.citas.find((c) => c.id === 'A-1024')!;
    const ocupada = db.citas.find((c) => c.id === 'A-1022')!;
    await expect(r.reprogramar(cita.id, ocupada.inicio)).rejects.toThrow(/disponible/);
    expect((await r.consultar()).citas.find((c) => c.id === cita.id)?.inicio).toBe(cita.inicio);
  });
  it('la reprogramación del paciente reaplica aprobación y conserva valores históricos', async () => {
    const r = await repo();
    await r.login('ana@demo.com', 'Demo2026');
    let dia = sumarDias(fechaLocal(), 5);
    if (instante(dia, 720).getUTCDay() === 0) dia = sumarDias(dia, 1);
    const cita = await r.crearCita({
      servicioId: 'resina',
      inicio: instante(dia, 480).toISOString(),
    });
    await r.salir();
    await r.login('doctor@demo.com', 'Demo2026');
    await r.responder(cita.id, true);
    const servicio = (await r.consultar()).servicios.find((s) => s.id === 'resina')!;
    await r.guardarServicio({ ...servicio, precioCop: 500000, duracionMin: 90 });
    await r.salir();
    await r.login('ana@demo.com', 'Demo2026');
    const movida = await r.reprogramar(cita.id, instante(dia, 600).toISOString());
    expect(movida.estado).toBe('pendiente');
    expect(movida.precioAcordadoCop).toBe(180000);
    expect(movida.duracionAcordadaMin).toBe(60);
  });
});
