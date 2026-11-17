// A04 · Crear cuenta (A05 cuando el correo ya existe) · RF-01
import { router } from "expo-router";
import { useState } from "react";

import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { Campo } from "@/components/Campo";
import { EnlacePie, FormularioAuth } from "@/components/FormularioAuth";
import { registrarPaciente } from "@/services/api/auth.api";
import { ErrorApi, mensajeDeError } from "@/services/http/errores";
import { esquemaRegistro, validar, type DatosRegistro, type ErroresDe } from "@/utils/validaciones";

export default function Registro() {
  const [valores, setValores] = useState<DatosRegistro>({ nombre: "", telefono: "", correo: "", contrasena: "" });
  const [errores, setErrores] = useState<ErroresDe<DatosRegistro>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmarCorreo, setConfirmarCorreo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof DatosRegistro) => (texto: string) => {
    setValores((v) => ({ ...v, [campo]: texto }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setErrorGeneral(null);
  };

  async function crearCuenta() {
    const resultado = validar(esquemaRegistro, valores);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }
    setEnviando(true);
    try {
      const conSesion = await registrarPaciente(resultado.datos);
      if (conSesion) router.replace("/");
      else setConfirmarCorreo(true);
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === "CORREO_EN_USO") {
        setErrores((e) => ({ ...e, correo: error.message }));
      } else {
        setErrorGeneral(mensajeDeError(error));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <FormularioAuth
      titulo="Crear cuenta"
      subtitulo="Regístrate como paciente para agendar tus citas."
      pie={<EnlacePie texto="¿Ya tienes cuenta?" enlace="Inicia sesión" onPress={() => router.replace("/login")} />}
    >
      {confirmarCorreo ? (
        <Aviso tipo="exito" mensaje="Te enviamos un correo para confirmar tu cuenta. Confírmala y luego inicia sesión." />
      ) : null}
      {errorGeneral ? <Aviso tipo="error" mensaje={errorGeneral} /> : null}
      <Campo
        etiqueta="Nombre completo"
        placeholder="Ana Gómez"
        autoCapitalize="words"
        autoComplete="name"
        value={valores.nombre}
        onChangeText={cambiar("nombre")}
        error={errores.nombre}
      />
      <Campo
        etiqueta="Teléfono"
        placeholder="310 555 1234"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={valores.telefono}
        onChangeText={cambiar("telefono")}
        error={errores.telefono}
      />
      <Campo
        etiqueta="Correo electrónico"
        placeholder="nombre@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={valores.correo}
        onChangeText={cambiar("correo")}
        error={errores.correo}
      />
      <Campo
        etiqueta="Contraseña"
        placeholder="Mínimo 8 caracteres"
        secureTextEntry
        autoComplete="new-password"
        value={valores.contrasena}
        onChangeText={cambiar("contrasena")}
        error={errores.contrasena}
        ayuda="Usa al menos 8 caracteres, una letra y un número."
      />
      <Boton titulo="Crear cuenta" cargando={enviando} onPress={crearCuenta} />
    </FormularioAuth>
  );
}
