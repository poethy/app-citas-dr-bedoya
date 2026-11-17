import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
export interface Posicion {
  latitude: number;
  longitude: number;
}
export function useSeguimientoUbicacion() {
  const [permiso, setPermiso] = useState<Location.PermissionStatus | null>(null),
    [posicion, setPosicion] = useState<Posicion | null>(null),
    [estado, setEstado] = useState<'inactivo' | 'activo' | 'pausado'>('inactivo'),
    [error, setError] = useState<unknown>(),
    [cargando, setCargando] = useState(false);
  const sub = useRef<Location.LocationSubscription | null>(null),
    generacion = useRef(0),
    enPantalla = useRef(false);
  const detener = useCallback(() => {
    generacion.current++;
    sub.current?.remove();
    sub.current = null;
  }, []);
  const comprobar = useCallback(async () => {
    try {
      const p = await Location.getForegroundPermissionsAsync();
      if (enPantalla.current) {
        setPermiso(p.status);
        if (p.status !== 'granted') {
          setPosicion(null);
          detener();
          setEstado('inactivo');
        }
      }
    } catch (e) {
      if (enPantalla.current) setError(e);
    }
  }, [detener]);
  useFocusEffect(
    useCallback(() => {
      enPantalla.current = true;
      comprobar();
      return () => {
        enPantalla.current = false;
        detener();
        setEstado('pausado');
      };
    }, [comprobar, detener]),
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (s) => {
      if (s !== 'active') {
        detener();
        setEstado('pausado');
      } else if (enPantalla.current) comprobar();
    });
    return () => {
      listener.remove();
      detener();
    };
  }, [comprobar, detener]);
  async function activar(seguir = true) {
    detener();
    const turno = generacion.current;
    setCargando(true);
    setError(undefined);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!enPantalla.current || turno !== generacion.current) return;
      setPermiso(p.status);
      if (p.status !== 'granted') {
        setPosicion(null);
        setEstado('inactivo');
        return;
      }
      if (!(await Location.hasServicesEnabledAsync()))
        throw new Error('El GPS no está disponible. Actívalo e intenta de nuevo.');
      const ubicacion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!enPantalla.current || turno !== generacion.current) return;
      setPosicion(ubicacion.coords);
      setEstado(seguir ? 'activo' : 'pausado');
      if (seguir) {
        const seguimiento = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
          (u) => {
            if (enPantalla.current && turno === generacion.current) setPosicion(u.coords);
          },
        );
        if (!enPantalla.current || turno !== generacion.current) seguimiento.remove();
        else sub.current = seguimiento;
      }
    } catch (e) {
      if (enPantalla.current && turno === generacion.current) {
        setError(e);
        setEstado('pausado');
      }
    } finally {
      if (enPantalla.current) setCargando(false);
    }
  }
  return {
    permiso,
    posicion,
    estado,
    error,
    cargando,
    activar,
    pausar: () => {
      detener();
      setEstado('pausado');
    },
  };
}
