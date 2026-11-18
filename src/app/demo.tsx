import { Redirect, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSesionStore } from '@/store/sesion.store';
import { useAccion } from '@/hooks/useDatos';
import { repositorio, simularChoque, simularFallo } from '@/services/mock/repositorio';
import { useInterfazStore } from '@/store/interfaz.store';
import { Boton, ErrorAviso, Pantalla, Texto } from '@/components/ui';
export default function Demo() {
  const perfil = useSesionStore((s) => s.perfil);
  const client = useQueryClient();
  const vencer = useAccion(
    repositorio.prepararVencimientoDemo,
    'Solicitud de prueba creada. Vencerá en 30 segundos.',
  );
  if (!perfil) return <Redirect href="/(auth)/bienvenida" />;
  if (perfil.rol !== 'odontologo') return <Redirect href="/" />;
  return (
    <Pantalla titulo="Escenarios de demostración">
      <Texto>
        Estos controles solo preparan datos y fallos de la demo local. No envían información a un
        servidor.
      </Texto>
      <Boton
        variant="secondary"
        onPress={() => {
          simularFallo('error');
          client.invalidateQueries({ queryKey: ['datos'] });
        }}
      >
        Simular error de consulta
      </Boton>
      <Boton
        variant="secondary"
        onPress={() => {
          simularFallo('conexion');
          client.invalidateQueries({ queryKey: ['datos'] });
        }}
      >
        Simular falta de conexión
      </Boton>
      <Texto className="text-xs text-muted">
        El botón Reintentar desactiva el fallo simulado y recupera la consulta.
      </Texto>
      <Boton
        variant="secondary"
        onPress={() => {
          simularChoque();
          useInterfazStore
            .getState()
            .mostrar('El siguiente intento de registrar una cita mostrará un choque.');
        }}
      >
        Simular choque al registrar
      </Boton>
      <Boton
        cargando={vencer.isPending}
        onPress={async () => {
          try {
            await vencer.mutateAsync(undefined);
            router.replace('/(odontologo)/(principal)/(tabs)/solicitudes');
          } catch {}
        }}
      >
        Crear solicitud que vence en 30 s
      </Boton>
      <Texto className="text-xs text-muted">
        La solicitud temporal ignora horario y anticipación únicamente para probar el vencimiento.
        Las operaciones normales mantienen todas sus validaciones.
      </Texto>
      <ErrorAviso error={vencer.error} />
    </Pantalla>
  );
}
