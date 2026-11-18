import { describe, expect, it } from 'vitest';

import { mapConfiguracion, mapPerfil, mapServicio } from '@/mappers/remoto.mapper';
import {
  ErrorApi,
  codigoDesdeMensaje,
  traducirErrorAuth,
  traducirErrorHttp,
} from '@/services/http/errores';
import { ErrorNegocio } from '@/utils/errores';

describe('traducirErrorHttp', () => {
  it('sin respuesta del servidor es SIN_CONEXION', () => {
    const error = traducirErrorHttp(undefined, undefined);
    expect(error.codigo).toBe('SIN_CONEXION');
    expect(error.message).toBe('Sin conexión. Revisa tu internet e intenta de nuevo.');
  });

  it('usa el código fijo que la RPC pone en message', () => {
    const error = traducirErrorHttp(400, {
      code: 'P0001',
      message: 'FUERA_DE_PLAZO',
      details: null,
    });
    expect(error.codigo).toBe('FUERA_DE_PLAZO');
  });

  it('la restricción de exclusión 23P01 es HORARIO_NO_DISPONIBLE', () => {
    expect(traducirErrorHttp(409, { code: '23P01', message: 'conflicting key' }).codigo).toBe(
      'HORARIO_NO_DISPONIBLE',
    );
  });

  it('RLS o 401/403 es NO_AUTORIZADO', () => {
    expect(traducirErrorHttp(403, { code: '42501' }).codigo).toBe('NO_AUTORIZADO');
    expect(traducirErrorHttp(401, {}).codigo).toBe('NO_AUTORIZADO');
  });

  it('cualquier otro error es ERROR_SERVICIO y guarda el detalle', () => {
    const error = traducirErrorHttp(500, { message: 'algo falló' });
    expect(error.codigo).toBe('ERROR_SERVICIO');
    expect(error.detalle).toBe('algo falló');
  });

  it('ErrorApi es un ErrorNegocio para que las pantallas lo traten igual', () => {
    expect(traducirErrorHttp(undefined, undefined)).toBeInstanceOf(ErrorNegocio);
  });
});

describe('mensajes con la anticipación configurada', () => {
  it('muestra las horas vigentes, no un 24 fijo', () => {
    expect(new ErrorApi('FUERA_DE_ANTICIPACION', { anticipacionHoras: 36 }).message).toBe(
      'Las citas se agendan con al menos 36 h de anticipación.',
    );
    expect(new ErrorApi('FUERA_DE_PLAZO', { anticipacionHoras: 12 }).message).toContain('12 h');
  });
});

describe('codigoDesdeMensaje', () => {
  it('solo reconoce códigos de negocio', () => {
    expect(codigoDesdeMensaje('CHOQUE_CON_CITA')).toBe('CHOQUE_CON_CITA');
    expect(codigoDesdeMensaje('duplicate key value')).toBeNull();
    expect(codigoDesdeMensaje(undefined)).toBeNull();
  });
});

describe('traducirErrorAuth', () => {
  it('traduce los códigos de Supabase Auth', () => {
    expect(
      traducirErrorAuth({ code: 'invalid_credentials', message: 'x', status: 400 }).codigo,
    ).toBe('CREDENCIALES_INVALIDAS');
    expect(traducirErrorAuth({ code: 'email_exists', message: 'x', status: 422 }).codigo).toBe(
      'CORREO_EN_USO',
    );
    expect(traducirErrorAuth({ message: 'Network request failed' }).codigo).toBe('SIN_CONEXION');
  });
});

describe('mappers remotos', () => {
  it('mapPerfil copia los datos sin la clave de la demo', () => {
    const perfil = mapPerfil({
      id: 'u1',
      rol: 'paciente',
      nombre: 'Ana Gómez',
      telefono: '3001234567',
      correo: 'ana@correo.com',
    });
    expect(perfil).toEqual({
      id: 'u1',
      rol: 'paciente',
      nombre: 'Ana Gómez',
      telefono: '3001234567',
      correo: 'ana@correo.com',
    });
  });

  it('mapServicio pasa a camelCase', () => {
    expect(
      mapServicio({
        id: 's1',
        nombre: 'Resina',
        duracion_min: 60,
        precio_cop: 180000,
        confirmacion: 'aprobacion',
        activo: true,
      }),
    ).toEqual({
      id: 's1',
      nombre: 'Resina',
      duracionMin: 60,
      precioCop: 180000,
      confirmacion: 'aprobacion',
      activo: true,
    });
  });

  it('mapConfiguracion toma las dos anticipaciones', () => {
    expect(
      mapConfiguracion({ anticipacion_agendar_horas: 24, anticipacion_cambios_horas: 12 }),
    ).toEqual({ anticipacionAgendarHoras: 24, anticipacionCambiosHoras: 12 });
  });
});
