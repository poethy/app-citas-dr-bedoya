// Validaciones de formularios con mensajes específicos (requisito del curso, RF-01).
import { z } from "zod";

export const esquemaLogin = z.object({
  correo: z.string().trim().min(1, "Escribe tu correo.").email("Escribe un correo válido, por ejemplo nombre@correo.com."),
  contrasena: z.string().min(1, "Escribe tu contraseña."),
});

export const esquemaRegistro = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre completo.")
    .min(3, "El nombre es muy corto."),
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .min(1, "Escribe tu teléfono.")
        .regex(/^3\d{9}$/, "Escribe un celular de 10 dígitos que empiece por 3."),
    ),
  correo: z.string().trim().min(1, "Escribe tu correo.").email("Escribe un correo válido, por ejemplo nombre@correo.com."),
  contrasena: z
    .string()
    .min(8, "Usa al menos 8 caracteres, una letra y un número.")
    .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "Usa al menos 8 caracteres, una letra y un número.")
    .regex(/\d/, "Usa al menos 8 caracteres, una letra y un número."),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export type ErroresDe<T> = Partial<Record<keyof T, string>>;

/** Valida y devuelve los datos limpios, o el primer mensaje de error de cada campo. */
export function validar<T extends z.ZodType>(
  esquema: T,
  valores: unknown,
): { ok: true; datos: z.infer<T> } | { ok: false; errores: ErroresDe<z.infer<T>> } {
  const resultado = esquema.safeParse(valores);
  if (resultado.success) return { ok: true, datos: resultado.data };
  const errores: Record<string, string> = {};
  for (const problema of resultado.error.issues) {
    const campo = String(problema.path[0] ?? "");
    if (campo && !errores[campo]) errores[campo] = problema.message;
  }
  return { ok: false, errores: errores as ErroresDe<z.infer<T>> };
}
