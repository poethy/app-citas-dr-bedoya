import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type {
  Aviso,
  BaseDatos,
  Bloqueo,
  Configuracion,
  CrearCita,
  Perfil,
  Servicio,
} from '@/models';
import { crearDatosIniciales } from './seed';
import {
  exigirDoctor,
  obtenerCita,
  registrarCita,
  validarCambio,
  validarInicio,
  vencerSolicitudes,
} from './reglas';
import { ErrorNegocio } from '@/utils/errores';
import { cruza, horarioDia, ocupacion } from '@/utils/franjas';
import { fechaLocal, HORA, horaTexto } from '@/utils/fechas';
import { validarNumero } from '@/utils/validaciones';

const CLAVE = 'citas-bedoya:v1';
// La base solo contiene valores JSON; funciona también en motores sin structuredClone.
const copiarBase = (db: BaseDatos): BaseDatos => JSON.parse(JSON.stringify(db));
let memoria: BaseDatos | null = null;
let cola: Promise<unknown> = Promise.resolve();
let falloDemo: 'error' | 'conexion' | null = null;
let choqueDemo = false;
export function simularChoque(): void {
  choqueDemo = true;
}
export function simularFallo(tipo: typeof falloDemo): void {
  falloDemo = tipo;
}
export const hashClave = (valor: string): Promise<string> =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, valor);
const idNuevo = (): string => Crypto.randomUUID();
function actorActual(db: BaseDatos): Perfil {
  const actor = db.perfiles.find((p) => p.id === db.sesionId);
  if (!actor) throw new ErrorNegocio('NO_AUTORIZADO', 'Inicia sesión para continuar.');
  return actor;
}
function avisar(
  db: BaseDatos,
  citaId: string,
  destinatarioId: string | null,
  titulo: string,
  cuerpo: string,
): void {
  if (!destinatarioId) return;
  const aviso: Aviso = {
    id: idNuevo(),
    citaId,
    destinatarioId,
    titulo,
    cuerpo,
    creadoEn: new Date().toISOString(),
    leida: false,
  };
  db.avisos.unshift(aviso);
}
function aplicarVencimientos(db: BaseDatos): boolean {
  const vencidas = vencerSolicitudes(db, new Date());
  for (const cita of vencidas) {
    avisar(
      db,
      cita.id,
      cita.pacienteId,
      'Solicitud vencida',
      `${cita.servicioNombre}: llegó la hora de la cita sin aprobación.`,
    );
    avisar(
      db,
      cita.id,
      'doctor',
      'Solicitud vencida',
      `${cita.pacienteNombre} · ${cita.servicioNombre}`,
    );
  }
  return vencidas.length > 0;
}
function aplicarRecordatorios(db: BaseDatos): boolean {
  let cambiado = false;
  const ahora = Date.now();
  for (const cita of db.citas) {
    const falta = Date.parse(cita.inicio) - ahora;
    const id = `recordatorio:${cita.id}:${cita.inicio}`;
    if (
      cita.estado !== 'confirmada' ||
      !cita.pacienteId ||
      falta <= 0 ||
      falta > 24 * HORA ||
      db.avisos.some((a) => a.id === id)
    )
      continue;
    db.avisos.unshift({
      id,
      destinatarioId: cita.pacienteId,
      citaId: cita.id,
      titulo: 'Recordatorio de tu cita',
      cuerpo: `${cita.servicioNombre} · ${horaTexto(cita.inicio)}`,
      creadoEn: new Date(ahora).toISOString(),
      leida: false,
    });
    cambiado = true;
  }
  return cambiado;
}
async function cargar(): Promise<BaseDatos> {
  if (memoria) return memoria;
  const raw = await AsyncStorage.getItem(CLAVE);
  if (!raw) {
    const inicial = crearDatosIniciales(await hashClave('Demo2026'));
    await AsyncStorage.setItem(CLAVE, JSON.stringify(inicial));
    memoria = inicial;
  } else {
    const datos: BaseDatos = JSON.parse(raw);
    if (datos.version !== 1 || !Array.isArray(datos.citas) || !Array.isArray(datos.perfiles))
      throw new Error('No se pudo leer la información guardada. No se reemplazaron tus datos.');
    memoria = datos;
  }
  return memoria;
}
function serializar<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = cola.then(tarea, tarea);
  cola = resultado.catch(() => undefined);
  return resultado;
}
async function transaccion<T>(cambio: (db: BaseDatos, actor: Perfil) => T): Promise<T> {
  return serializar(async () => {
    const db = copiarBase(await cargar());
    // Persistir el vencimiento antes de una acción que podría devolver un error.
    if (aplicarVencimientos(db)) {
      await AsyncStorage.setItem(CLAVE, JSON.stringify(db));
      memoria = db;
    }
    const copia = copiarBase(db);
    const resultado = cambio(copia, actorActual(copia));
    await AsyncStorage.setItem(CLAVE, JSON.stringify(copia));
    memoria = copia;
    return resultado;
  });
}
export const repositorio = {
  consultar: (): Promise<BaseDatos> =>
    serializar(async () => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      if (falloDemo)
        throw new ErrorNegocio(
          falloDemo === 'conexion' ? 'SIN_CONEXION' : 'ERROR_DEMO',
          falloDemo === 'conexion'
            ? 'Conexión simulada no disponible. Desactiva el escenario para continuar.'
            : 'Fallo de consulta simulado. Desactívalo y reintenta.',
        );
      const db = copiarBase(await cargar());
      const vencidas = aplicarVencimientos(db);
      const recordatorios = aplicarRecordatorios(db);
      if (vencidas || recordatorios) {
        await AsyncStorage.setItem(CLAVE, JSON.stringify(db));
        memoria = db;
      }
      return db;
    }),
  login: (correo: string, clave: string): Promise<Perfil> =>
    serializar(async () => {
      const db = copiarBase(await cargar());
      const hash = await hashClave(clave);
      const perfil = db.perfiles.find(
        (p) => p.correo.toLowerCase() === correo.trim().toLowerCase() && p.claveDemo === hash,
      );
      if (!perfil)
        throw new ErrorNegocio('CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
      db.sesionId = perfil.id;
      await AsyncStorage.setItem(CLAVE, JSON.stringify(db));
      memoria = db;
      return perfil;
    }),
  registro: (datos: {
    nombre: string;
    telefono: string;
    correo: string;
    clave: string;
  }): Promise<Perfil> =>
    serializar(async () => {
      const db = copiarBase(await cargar());
      const correo = datos.correo.trim().toLowerCase();
      if (db.perfiles.some((p) => p.correo.toLowerCase() === correo))
        throw new ErrorNegocio('CORREO_EN_USO', 'Este correo ya está registrado.');
      const perfil: Perfil = {
        id: idNuevo(),
        nombre: datos.nombre.trim(),
        telefono: datos.telefono,
        correo,
        rol: 'paciente',
        claveDemo: await hashClave(datos.clave),
      };
      db.perfiles.push(perfil);
      db.sesionId = perfil.id;
      await AsyncStorage.setItem(CLAVE, JSON.stringify(db));
      memoria = db;
      return perfil;
    }),
  salir: (): Promise<void> =>
    transaccion((db) => {
      db.sesionId = null;
    }),
  crearCita: (datos: CrearCita) =>
    transaccion((db, actor) => {
      if (choqueDemo) {
        choqueDemo = false;
        throw new ErrorNegocio(
          'HORARIO_NO_DISPONIBLE',
          'Otra persona acaba de ocupar ese horario. Elige otro.',
        );
      }
      const cita = registrarCita(db, actor, datos, idNuevo(), new Date());
      avisar(
        db,
        cita.id,
        cita.pacienteId,
        cita.estado === 'confirmada' ? 'Cita confirmada' : 'Solicitud enviada',
        cita.servicioNombre,
      );
      if (actor.rol === 'paciente')
        avisar(
          db,
          cita.id,
          'doctor',
          cita.estado === 'pendiente' ? 'Nueva solicitud' : 'Nueva cita',
          `${cita.pacienteNombre} · ${cita.servicioNombre}`,
        );
      return cita;
    }),
  cancelar: (id: string) =>
    transaccion((db, actor) => {
      const cita = obtenerCita(db, actor, id);
      validarCambio(db, actor, cita, new Date());
      cita.estado = 'cancelada';
      avisar(
        db,
        id,
        actor.rol === 'paciente' ? 'doctor' : cita.pacienteId,
        'Cita cancelada',
        `${cita.pacienteNombre} · ${cita.servicioNombre}`,
      );
      return cita;
    }),
  reprogramar: (id: string, inicio: string) =>
    transaccion((db, actor) => {
      const cita = obtenerCita(db, actor, id);
      const ahora = new Date();
      validarCambio(db, actor, cita, ahora);
      const fin = validarInicio(db, actor, inicio, cita.duracionAcordadaMin, ahora, id);
      cita.inicio = inicio;
      cita.fin = fin;
      if (actor.rol === 'paciente')
        cita.estado =
          db.servicios.find((s) => s.id === cita.servicioId)?.confirmacion === 'aprobacion'
            ? 'pendiente'
            : 'confirmada';
      avisar(
        db,
        id,
        actor.rol === 'paciente' ? 'doctor' : cita.pacienteId,
        'Cita reprogramada',
        `${cita.pacienteNombre} · ${cita.servicioNombre}`,
      );
      return cita;
    }),
  responder: (id: string, aprobar: boolean) =>
    transaccion((db, actor) => {
      exigirDoctor(actor);
      const cita = obtenerCita(db, actor, id);
      if (cita.estado === 'vencida')
        throw new ErrorNegocio(
          'SOLICITUD_VENCIDA',
          'Esta solicitud venció al llegar la hora de la cita.',
        );
      if (cita.estado !== 'pendiente')
        throw new ErrorNegocio('ESTADO_INVALIDO', 'Esta solicitud ya fue gestionada.');
      cita.estado = aprobar ? 'confirmada' : 'rechazada';
      avisar(
        db,
        id,
        cita.pacienteId,
        aprobar ? 'Solicitud aprobada' : 'Solicitud rechazada',
        cita.servicioNombre,
      );
      return cita;
    }),
  guardarServicio: (servicio: Servicio) =>
    transaccion((db, actor) => {
      exigirDoctor(actor);
      const error =
        validarNumero(String(servicio.precioCop), 'precio') ||
        validarNumero(String(servicio.duracionMin), 'duracion');
      if (error || !servicio.nombre.trim())
        throw new Error(error || 'Escribe el nombre del servicio.');
      const existente = db.servicios.find((s) => s.id === servicio.id);
      if (existente) Object.assign(existente, servicio);
      else db.servicios.push({ ...servicio, id: idNuevo() });
    }),
  guardarConfiguracion: (config: Configuracion) =>
    transaccion((db, actor) => {
      exigirDoctor(actor);
      if (Object.values(config).some((v) => !Number.isInteger(v) || v < 1 || v > 72))
        throw new Error('Usa valores entre 1 y 72 horas.');
      db.configuracion = config;
    }),
  guardarPerfil: (datos: Pick<Perfil, 'nombre' | 'telefono' | 'correo'>) =>
    transaccion((db, actor) => {
      if (
        db.perfiles.some(
          (p) => p.id !== actor.id && p.correo.toLowerCase() === datos.correo.toLowerCase(),
        )
      )
        throw new Error('Este correo ya está registrado.');
      Object.assign(actor, datos);
    }),
  bloquear: (input: Omit<Bloqueo, 'id'>) =>
    transaccion((db, actor) => {
      exigirDoctor(actor);
      const horario = horarioDia(fechaLocal(input.inicio));
      if (
        !horario ||
        Date.parse(input.inicio) <= Date.now() ||
        input.fin <= input.inicio ||
        input.inicio < horario.inicio ||
        input.fin > horario.fin
      )
        throw new Error('Elige un intervalo futuro dentro del horario de atención.');
      if (ocupacion(db, fechaLocal(input.inicio)).some((r) => cruza(r, input)))
        throw new ErrorNegocio(
          'CHOQUE_CON_CITA',
          'Ese intervalo coincide con una cita o bloqueo. Elige un espacio libre.',
        );
      db.bloqueos.push({ ...input, id: idNuevo() });
    }),
  eliminarBloqueo: (id: string) =>
    transaccion((db, actor) => {
      exigirDoctor(actor);
      db.bloqueos = db.bloqueos.filter((b) => b.id !== id);
    }),
  leerAviso: (id: string) =>
    transaccion((db, actor) => {
      const aviso = db.avisos.find((a) => a.id === id && a.destinatarioId === actor.id);
      if (aviso) aviso.leida = true;
    }),
  prepararVencimientoDemo: () =>
    transaccion((db, actor) => {
      exigirDoctor(actor);
      const servicio = db.servicios.find((s) => s.id === 'resina') ?? db.servicios[0];
      const inicio = new Date(Date.now() + 30000);
      const cita = {
        id: idNuevo(),
        pacienteId: 'ana',
        pacienteNombre: 'Ana Gómez',
        telefono: '3105551234',
        servicioId: servicio.id,
        servicioNombre: servicio.nombre,
        inicio: inicio.toISOString(),
        fin: new Date(inicio.getTime() + servicio.duracionMin * 60000).toISOString(),
        estado: 'pendiente' as const,
        precioAcordadoCop: servicio.precioCop,
        duracionAcordadaMin: servicio.duracionMin,
        origen: 'app' as const,
        solicitudOriginal: true,
      };
      db.citas.push(cita);
      return cita;
    }),
};
