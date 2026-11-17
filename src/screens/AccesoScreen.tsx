import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Boton, Campo, ErrorAviso, Pantalla, Texto } from '@/components/ui';
import Logo from '@/components/Logo';
import { repositorio } from '@/services/mock/repositorio';
import { useSesionStore } from '@/store/sesion.store';
import { registroSchema } from '@/utils/validaciones';
export default function AccesoScreen({ registro = false }: { registro?: boolean }) {
  const [nombre, setNombre] = useState(''),
    [telefono, setTelefono] = useState(''),
    [correo, setCorreo] = useState(''),
    [clave, setClave] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({}),
    [error, setError] = useState<unknown>(null),
    [cargando, setCargando] = useState(false);
  const client = useQueryClient();
  const establecer = useSesionStore((s) => s.establecer);
  async function enviar() {
    setError(null);
    setErrores({});
    if (registro) {
      const resultado = registroSchema.safeParse({ nombre, telefono, correo, clave });
      if (!resultado.success) {
        setErrores(
          Object.fromEntries(resultado.error.issues.map((i) => [String(i.path[0]), i.message])),
        );
        return;
      }
    } else if (!correo.trim() || !clave) {
      setError(new Error('Escribe tu correo y contraseña.'));
      return;
    }
    setCargando(true);
    try {
      const perfil = registro
        ? await repositorio.registro({ nombre, telefono, correo, clave })
        : await repositorio.login(correo, clave);
      client.clear();
      establecer(perfil);
      router.replace('/');
    } catch (e) {
      setError(e);
    } finally {
      setCargando(false);
    }
  }
  return (
    <Pantalla
      blanca
      titulo={registro ? 'Crear cuenta' : ''}
      footer={
        <>
          <Boton onPress={enviar} cargando={cargando}>
            {registro ? 'Crear cuenta' : 'Ingresar'}
          </Boton>
          <Pressable
            onPress={() => router.replace(registro ? '/(auth)/login' : '/(auth)/registro')}
            className="py-3"
          >
            <Texto className="text-center text-muted">
              {registro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Texto>
          </Pressable>
        </>
      }
    >
      {!registro ? (
        <>
          <Logo />
          <Texto className="font-semibold text-2xl leading-8">Bienvenido de nuevo</Texto>
        </>
      ) : null}
      {registro ? (
        <>
          <Campo
            label="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            error={errores.nombre}
            autoComplete="name"
          />
          <Campo
            label="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            error={errores.telefono}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </>
      ) : null}
      <Campo
        label="Correo electrónico"
        placeholder="nombre@correo.com"
        value={correo}
        onChangeText={setCorreo}
        error={errores.correo}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Campo
        label="Contraseña"
        value={clave}
        onChangeText={setClave}
        error={errores.clave}
        secureTextEntry
        ayuda={registro ? 'Usa al menos 8 caracteres, una letra y un número.' : undefined}
      />
      <ErrorAviso error={error} />
      {!registro ? (
        <View className="gap-2 mt-4">
          <Texto className="text-xs text-muted">Cuentas de prueba · contraseña: Demo2026</Texto>
          <Boton
            variant="secondary"
            onPress={() => {
              setCorreo('ana@demo.com');
              setClave('Demo2026');
            }}
          >
            Completar como paciente
          </Boton>
          <Boton
            variant="secondary"
            onPress={() => {
              setCorreo('doctor@demo.com');
              setClave('Demo2026');
            }}
          >
            Completar como odontólogo
          </Boton>
        </View>
      ) : (
        <Texto className="text-xs text-muted">
          Usa datos ficticios y una contraseña exclusiva para esta demo.
        </Texto>
      )}
    </Pantalla>
  );
}
