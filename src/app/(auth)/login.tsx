// A02 · Iniciar sesión (A03 cuando la contraseña es incorrecta) · RF-02
import { router } from "expo-router";
import { useState } from "react";

import { Aviso } from "@/components/Aviso";
import { Boton } from "@/components/Boton";
import { Campo } from "@/components/Campo";
import { EnlacePie, FormularioAuth } from "@/components/FormularioAuth";
import { iniciarSesion } from "@/services/api/auth.api";
import { ErrorApi, mensajeDeError } from "@/services/http/errores";
import { esquemaLogin, validar, type DatosLogin, type ErroresDe } from "@/utils/validaciones";

export default function Login() {
  const [valores, setValores] = useState<DatosLogin>({ correo: "", contrasena: "" });
  const [errores, setErrores] = useState<ErroresDe<DatosLogin>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [credencialesInvalidas, setCredencialesInvalidas] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof DatosLogin) => (texto: string) => {
    setValores((v) => ({ ...v, [campo]: texto }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setErrorGeneral(null);
    setCredencialesInvalidas(false);
  };

  async function ingresar() {
    const resultado = validar(esquemaLogin, valores);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion(resultado.datos);
      router.replace("/"); // A00 decide a dónde va según el rol
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
      setCredencialesInvalidas(error instanceof ErrorApi && error.codigo === "CREDENCIALES_INVALIDAS");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <FormularioAuth
      titulo="Bienvenido de nuevo"
      subtitulo="Ingresa con tu correo y contraseña."
      pie={<EnlacePie texto="¿No tienes cuenta?" enlace="Regístrate" onPress={() => router.replace("/registro")} />}
    >
      {errorGeneral ? <Aviso tipo="error" mensaje={errorGeneral} /> : null}
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
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
        value={valores.contrasena}
        onChangeText={cambiar("contrasena")}
        error={errores.contrasena ?? (credencialesInvalidas ? "Contraseña incorrecta" : undefined)}
        onSubmitEditing={ingresar}
      />
      <Boton titulo="Ingresar" cargando={enviando} onPress={ingresar} />
    </FormularioAuth>
  );
}
