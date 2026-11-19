import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { repositorio } from '@/services/repositorio';
import { useSesionStore } from '@/store/sesion.store';
import { useAgendarStore } from '@/store/agendar.store';
import { Boton, ModalConfirmacion } from './ui';
export default function BotonSalir() {
  const [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const client = useQueryClient();
  async function salir() {
    setBusy(true);
    try {
      await repositorio.salir();
      client.clear();
      useAgendarStore.getState().limpiar();
      useSesionStore.getState().establecer(null);
      router.replace('/(auth)/bienvenida');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Boton variant="danger" onPress={() => setVisible(true)}>
        Cerrar sesión
      </Boton>
      <ModalConfirmacion
        visible={visible}
        titulo="¿Cerrar sesión?"
        detalle="Tendrás que ingresar de nuevo para ver tus citas."
        cerrar={() => setVisible(false)}
        confirmar={salir}
        cargando={busy}
        error={error}
      />
    </>
  );
}
