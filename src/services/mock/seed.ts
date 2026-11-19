import type { BaseDatos, Cita, Servicio } from '@/models';
import { fechaLocal, instante, MINUTO, sumarDias } from '@/utils/fechas';
import { HORARIO_INICIAL } from '@/utils/horario';

export function crearDatosIniciales(claveDemo: string): BaseDatos {
  // La agenda de ejemplo va en el primer día hábil (lunes a viernes) desde pasado mañana:
  // un sábado cierra a las 12:00 m. y el domingo está cerrado, y las citas quedarían fuera.
  let fecha = sumarDias(fechaLocal(), 2);
  while ([0, 6].includes(instante(fecha, 720).getUTCDay())) fecha = sumarDias(fecha, 1);
  const servicios: Servicio[] = [
    {
      id: 'valoracion',
      nombre: 'Valoración general',
      duracionMin: 30,
      precioCop: 60000,
      confirmacion: 'inmediata',
      activo: true,
    },
    {
      id: 'limpieza',
      nombre: 'Limpieza dental',
      duracionMin: 45,
      precioCop: 120000,
      confirmacion: 'inmediata',
      activo: true,
    },
    {
      id: 'resina',
      nombre: 'Resina',
      duracionMin: 60,
      precioCop: 180000,
      confirmacion: 'aprobacion',
      activo: true,
    },
    {
      id: 'endodoncia',
      nombre: 'Endodoncia',
      duracionMin: 90,
      precioCop: 450000,
      confirmacion: 'aprobacion',
      activo: true,
    },
  ];
  const pacientes = [
    {
      id: 'ana',
      nombre: 'Ana Gómez',
      telefono: '3105551234',
      correo: 'ana@demo.com',
      rol: 'paciente' as const,
      claveDemo,
    },
    {
      id: 'doctor',
      nombre: 'Dr. Camilo Bedoya',
      telefono: '3100000000',
      correo: 'doctor@demo.com',
      rol: 'odontologo' as const,
      claveDemo,
    },
  ];
  function cita(
    id: string,
    nombre: string,
    servicioId: string,
    minutos: number,
    estado: Cita['estado'],
    pacienteId: string | null = null,
  ): Cita {
    const servicio = servicios.find((s) => s.id === servicioId)!;
    const inicio = instante(fecha, minutos);
    return {
      solicitudOriginal: servicio.confirmacion === 'aprobacion',
      id,
      pacienteNombre: nombre,
      pacienteId,
      telefono: '3100000000',
      servicioId,
      servicioNombre: servicio.nombre,
      inicio: inicio.toISOString(),
      fin: new Date(inicio.getTime() + servicio.duracionMin * MINUTO).toISOString(),
      estado,
      precioAcordadoCop: servicio.precioCop,
      duracionAcordadaMin: servicio.duracionMin,
      origen: 'app',
    };
  }
  return {
    version: 1,
    perfiles: pacientes,
    servicios,
    citas: [
      cita('A-1022', 'Carlos Ruiz', 'limpieza', 480, 'confirmada'),
      cita('A-1023', 'Laura Pérez', 'endodoncia', 570, 'pendiente'),
      cita('A-1024', 'Ana Gómez', 'limpieza', 660, 'confirmada', 'ana'),
      cita('A-1025', 'Jorge Díaz', 'endodoncia', 855, 'confirmada'),
      cita('A-1026', 'Sofía Mejía', 'limpieza', 990, 'cancelada'),
    ],
    bloqueos: [],
    avisos: [],
    configuracion: { anticipacionAgendarHoras: 24, anticipacionCambiosHoras: 24 },
    horario: JSON.parse(JSON.stringify(HORARIO_INICIAL)),
    sesionId: null,
  };
}
