import { useCallback, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { useAhora } from '@/hooks/useAhora';
import {
  Boton,
  Campo,
  ErrorAviso,
  Estado,
  Opciones,
  Pantalla,
  Tarjeta,
  Texto,
} from '@/components/ui';
import Calendario from '@/components/Calendario';
import Franjas from '@/components/Franjas';
import LineaTiempoBloqueo, { duracionBloqueo } from '@/components/LineaTiempoBloqueo';
import type { Franja } from '@/models';
import { fechaLocal, fechaTexto, horaTexto } from '@/utils/fechas';
import { calcularFranjas, horarioDia, obtenerFinalesDeBloqueo } from '@/utils/franjas';
import { repositorio } from '@/services/mock/repositorio';

type Paso = 'fecha' | 'horario' | 'motivo';

export default function Bloqueos() {
  const consulta = useDatos();
  const { data } = consulta;
  const ahora = new Date(useAhora());
  const [paso, setPaso] = useState<Paso>('fecha');
  const [fecha, setFecha] = useState(fechaLocal);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [usarBotones, setUsarBotones] = useState(false);
  const crear = useAccion(repositorio.bloquear, 'Horario bloqueado.');
  const eliminar = useAccion(repositorio.eliminarBloqueo, 'Bloqueo eliminado.');
  const seleccionar = useCallback((rango: Franja) => {
    setInicio(rango.inicio);
    setFin(rango.fin);
  }, []);

  const volver = useCallback(() => {
    if (paso === 'fecha') return false;
    if (!crear.isPending) setPaso(paso === 'motivo' ? 'horario' : 'fecha');
    return true;
  }, [paso, crear.isPending]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android' || paso === 'fecha') return;
      const suscripcion = BackHandler.addEventListener('hardwareBackPress', volver);
      return () => suscripcion.remove();
    }, [paso, volver]),
  );

  if (!data) {
    return (
      <Pantalla titulo="Bloquear disponibilidad">
        {consulta.isError ? (
          <Estado titulo="No pudimos cargar los horarios" accion={() => consulta.refetch()} />
        ) : (
          <Estado titulo="Cargando horarios" cargando />
        )}
      </Pantalla>
    );
  }

  const franjas = calcularFranjas(data, fecha, 15, 'odontologo', ahora).franjas;
  const horario = horarioDia(fecha);
  const finales = obtenerFinalesDeBloqueo(franjas, inicio);
  const horarioValido = finales.includes(fin);
  const seleccion = horarioValido ? { inicio, fin } : null;
  const duracion = seleccion ? duracionBloqueo(seleccion) : '';

  function elegirFecha(dia: string) {
    if (dia !== fecha) {
      setInicio('');
      setFin('');
      setMotivo('');
    }
    setFecha(dia);
    setPaso('horario');
  }

  async function guardarBloqueo() {
    if (!horarioValido || !motivo.trim()) return;
    try {
      await crear.mutateAsync({ inicio, fin, motivo: motivo.trim() });
      setInicio('');
      setFin('');
      setMotivo('');
      setPaso('horario');
    } catch {
      // El aviso muestra el error y permite corregir el intervalo o reintentar.
    }
  }

  return (
    <Pantalla
      key={paso}
      titulo="Bloquear disponibilidad"
      subtitulo={paso === 'fecha' ? undefined : fechaTexto(fecha)}
      onVolver={paso === 'fecha' ? undefined : volver}
      footer={
        paso === 'horario' ? (
          <>
            {duracion && <Texto className="font-medium">Duración del bloqueo: {duracion}</Texto>}
            <Boton disabled={!horarioValido} onPress={() => setPaso('motivo')}>
              Continuar
            </Boton>
          </>
        ) : paso === 'motivo' ? (
          <Boton
            disabled={!horarioValido || !motivo.trim()}
            cargando={crear.isPending}
            onPress={guardarBloqueo}
          >
            Bloquear horario
          </Boton>
        ) : undefined
      }
    >
      {paso === 'fecha' && (
        <>
          <Texto className="font-medium">Elige la fecha del bloqueo</Texto>
          <Calendario valor={fecha} onChange={elegirFecha} />
        </>
      )}

      {paso === 'horario' && (
        <>
          {franjas.length > 0 && (
            <Boton variant="text" onPress={() => setUsarBotones(!usarBotones)}>
              {usarBotones ? 'Volver a la cuadrícula' : 'Seleccionar horas con botones'}
            </Boton>
          )}
          {horario && !usarBotones && (
            <LineaTiempoBloqueo
              horario={horario}
              franjas={franjas}
              seleccion={seleccion}
              onSeleccionar={seleccionar}
            />
          )}
          {franjas.length === 0 && (
            <Estado
              titulo="No hay horarios libres"
              detalle="Vuelve al calendario y elige otra fecha."
            />
          )}
          {usarBotones && franjas.length > 0 && (
            <>
              <Texto className="font-medium">Selecciona la hora de inicio</Texto>
              <Franjas
                franjas={franjas}
                valor={inicio}
                onChange={(hora) => {
                  if (hora === inicio) return;
                  setInicio(hora);
                  setFin('');
                }}
              />
              {finales.length > 0 && (
                <>
                  <Texto className="font-medium">Selecciona la hora de fin</Texto>
                  <Opciones
                    opciones={finales.map((hora) => ({ valor: hora, label: horaTexto(hora) }))}
                    valor={fin}
                    onChange={setFin}
                  />
                </>
              )}
            </>
          )}
          <ErrorAviso error={eliminar.error} />
          {data.citas
            .filter(
              (cita) =>
                fechaLocal(cita.inicio) === fecha &&
                (cita.estado === 'confirmada' ||
                  (cita.estado === 'pendiente' && Date.parse(cita.inicio) > ahora.getTime())),
            )
            .map((cita) => (
              <Tarjeta key={cita.id}>
                <Texto className="font-medium">
                  {cita.pacienteNombre} · {horaTexto(cita.inicio)} – {horaTexto(cita.fin)}
                </Texto>
                <Texto className="text-xs text-muted">{cita.servicioNombre} · Ocupado</Texto>
              </Tarjeta>
            ))}
          {data.bloqueos
            .filter((bloqueo) => fechaLocal(bloqueo.inicio) === fecha)
            .map((bloqueo) => (
              <Tarjeta key={bloqueo.id}>
                <Texto>
                  {bloqueo.motivo} · {horaTexto(bloqueo.inicio)} – {horaTexto(bloqueo.fin)}
                </Texto>
                <Boton
                  variant="danger"
                  cargando={eliminar.isPending}
                  onPress={() => eliminar.mutate(bloqueo.id)}
                >
                  Eliminar bloqueo
                </Boton>
              </Tarjeta>
            ))}
        </>
      )}

      {paso === 'motivo' && (
        <>
          <Tarjeta>
            <Texto className="font-medium">
              {horaTexto(inicio)} – {horaTexto(fin)}
            </Texto>
            {duracion && <Texto>Duración del bloqueo: {duracion}</Texto>}
          </Tarjeta>
          <Campo
            label="Motivo de la ausencia"
            placeholder="Escribe el motivo"
            value={motivo}
            onChangeText={setMotivo}
            editable={!crear.isPending}
            multiline
          />
          {!horarioValido && (
            <Texto accessibilityRole="alert" className="text-danger">
              El horario ya no está disponible. Vuelve y selecciona otro intervalo.
            </Texto>
          )}
          <ErrorAviso error={crear.error} />
        </>
      )}
    </Pantalla>
  );
}
