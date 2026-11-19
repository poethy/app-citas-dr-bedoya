import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useSeguimientoUbicacion } from '@/hooks/useSeguimientoUbicacion';
import { useConexion } from '@/hooks/useConexion';
import { useInterfazStore } from '@/store/interfaz.store';
import MapaVista from '@/components/MapaVista';
import { Boton, ErrorAviso, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { useDatos } from '@/hooks/useDatos';
export default function Mapa() {
  const gps = useSeguimientoUbicacion();
  const { data } = useDatos();
  const ubicacion = data?.configuracion.ubicacion ?? null;
  const punto = ubicacion ? { latitude: ubicacion.latitud, longitude: ubicacion.longitud } : null;
  const { conectado } = useConexion();
  const [continuar, setContinuar] = useState(false),
    [centrar, setCentrar] = useState(0),
    [estadoMapa, setEstadoMapa] = useState('cargando'),
    [intento, setIntento] = useState(0);
  const mostrarPermiso = !continuar && gps.permiso !== 'granted';
  return (
    <Pantalla menu titulo="Mapa de la cita" scroll={false}>
      <View className="flex-1 p-4 gap-3">
        {mostrarPermiso ? (
          <View className="flex-1 justify-center gap-4">
            <Texto className="font-semibold text-2xl text-center">Tu ubicación en el mapa</Texto>
            <Texto className="text-muted text-center">
              Usamos tu ubicación solo mientras ves el mapa. Puedes continuar sin compartirla.
            </Texto>
            {gps.permiso === 'denied' ? (
              <>
                {Platform.OS === 'web' ? (
                  <>
                    {/* En el navegador no hay ajustes que abrir: el permiso se da en la barra de direcciones */}
                    <ErrorAviso
                      error={
                        new Error(
                          'El navegador bloqueó tu ubicación. Permítela desde el candado de la barra de direcciones y vuelve a intentarlo.',
                        )
                      }
                    />
                    <Boton cargando={gps.cargando} onPress={() => gps.activar()}>
                      Volver a intentar
                    </Boton>
                  </>
                ) : (
                  <>
                    <ErrorAviso error={new Error('El permiso de ubicación está denegado.')} />
                    <Boton variant="secondary" onPress={() => Linking.openSettings()}>
                      Abrir ajustes
                    </Boton>
                  </>
                )}
              </>
            ) : (
              <Boton cargando={gps.cargando} onPress={() => gps.activar()}>
                Permitir ubicación
              </Boton>
            )}
            <Boton variant="secondary" onPress={() => setContinuar(true)}>
              Continuar sin ubicación
            </Boton>
          </View>
        ) : (
          <>
            <View className="flex-1 min-h-[260px] rounded-2xl overflow-hidden">
              <MapaVista
                key={intento}
                posicion={gps.posicion}
                centrar={centrar}
                onEstado={setEstadoMapa}
                punto={punto}
                etiqueta={punto ? 'Consultorio 201 · Ed. Torcoroma' : undefined}
              />
            </View>
            {estadoMapa === 'error' || !conectado ? (
              <>
                <ErrorAviso
                  error={
                    new Error(
                      'No pudimos cargar el mapa. Revisa tu conexión o consulta la dirección.',
                    )
                  }
                />
                <Boton
                  variant="secondary"
                  onPress={() => {
                    setEstadoMapa('cargando');
                    setIntento((v) => v + 1);
                  }}
                >
                  Reintentar mapa
                </Boton>
              </>
            ) : null}
            <ErrorAviso error={gps.error} />
            <Tarjeta>
              <Texto className="font-medium">
                El consultorio ·{' '}
                {gps.estado === 'activo'
                  ? 'Seguimiento activo'
                  : gps.posicion
                    ? 'En pausa'
                    : 'Sin ubicación'}
              </Texto>
              <Texto className="text-xs text-muted">
                Calle 18 # 5-27, Edificio Torcoroma, Consultorio 201
              </Texto>
              {punto ? null : (
                <Texto className="text-[11px] text-muted">
                  El marcador es una referencia en Pereira. Coordenadas exactas pendientes de
                  confirmar.
                </Texto>
              )}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Boton
                    variant="secondary"
                    cargando={gps.cargando}
                    onPress={() => (gps.estado === 'activo' ? gps.pausar() : gps.activar())}
                  >
                    {gps.estado === 'activo' ? 'Pausar' : gps.posicion ? 'Reanudar' : 'Activar'}
                  </Boton>
                </View>
                <View className="flex-1">
                  <Boton
                    cargando={gps.cargando}
                    onPress={async () => {
                      if (gps.permiso === 'granted') await gps.activar(false);
                      else
                        useInterfazStore
                          .getState()
                          .mostrar(
                            'No tenemos tu ubicación. Centramos el mapa en la referencia del consultorio.',
                          );
                      setCentrar((v) => v + 1);
                    }}
                  >
                    Centrar en mí
                  </Boton>
                </View>
              </View>
            </Tarjeta>
            <Boton variant="text" onPress={() => router.push('/consultorio')}>
              Ver dirección
            </Boton>
          </>
        )}
      </View>
    </Pantalla>
  );
}
