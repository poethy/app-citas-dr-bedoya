import { z } from 'zod';
export const perfilSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre completo.'),
  telefono: z.string().regex(/^3\d{9}$/, 'Escribe 10 dígitos, empezando por 3.'),
  correo: z.email('Escribe un correo válido.'),
});
export const registroSchema = perfilSchema.extend({
  clave: z
    .string()
    .min(8, 'Usa al menos 8 caracteres.')
    .regex(/[a-zA-Z]/, 'Incluye una letra.')
    .regex(/\d/, 'Incluye un número.'),
});

export const pacienteNuevaCitaSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre del paciente.'),
  telefono: z.preprocess(
    (valor) =>
      typeof valor === 'string' ? valor.replace(/[\s().-]/g, '').replace(/^\+57/, '') : valor,
    perfilSchema.shape.telefono,
  ),
});

export function validarNumero(valor: string, tipo: 'precio' | 'duracion'): string | null {
  if (!valor.trim())
    return tipo === 'precio'
      ? 'Escribe el precio del servicio.'
      : 'Escribe la duración del servicio.';
  if (/^-\d+$/.test(valor))
    return tipo === 'precio'
      ? 'El precio no puede ser negativo.'
      : 'La duración no puede ser negativa.';
  if (!/^\d+$/.test(valor)) return 'Escribe solo números, sin puntos ni signos.';
  const n = Number(valor);
  if (!Number.isSafeInteger(n)) return 'El valor es demasiado grande.';
  if (tipo === 'duracion' && n === 0) return 'La duración debe ser mayor que cero.';
  if (tipo === 'duracion' && (n < 15 || n > 180 || n % 15))
    return 'Usa de 15 a 180 minutos, en pasos de 15.';
  return null;
}
