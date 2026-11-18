// C08 Horario de atención · C09 Editar horas del día · C10 Citas fuera del nuevo horario
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import type { HorarioAtencion } from '@/models';
import { useAccion, useDatos } from '@/hooks/useDatos';
import { repositorio } from '@/services/mock/repositorio';
import { Boton, ErrorAviso, Estado, HojaInferior, Pantalla, Texto } from '@/components/ui';
import SelectorHora from '@/components/SelectorHora';
import { ErrorNegocio } from '@/utils/errores';
import {
  buscarDia,
  errorJornada,
  JORNADA_POR_DEFECTO,
  NOMBRES_DIA,
  ORDEN_SEMANA,
  textoDias,
  textoRango,
} from '@/utils/horario';

const ALMUERZO_POR_DEFECTO = { inicio: 750, fin: 810, dias: [1, 2, 3, 4, 5] };

type Edicion = { tipo: 'dia'; diaSemana: number } | { tipo: 'almuerzo' };

export default function Horario() {
  const consulta = useDatos();
  if (!consulta.data)
    return (
      <Pantalla titulo="Horario de atención">
        {consulta.isError ? (
          <Estado titulo="No pudimos cargar el horario" accion={() => consulta.refetch()} />
        ) : (
          <Estado titulo="Cargando horario" cargando />
        )}
      </Pantalla>
    );
  return <Editor inicial={consulta.data.horario} />;
}

function Interruptor({
  valor,
  onChange,
  etiqueta,
}: {
  valor: boolean;
  onChange: (v: boolean) => void;
  etiqueta: string;
}) {
  return (
    <Switch
      accessibilityLabel={etiqueta}
      value={valor}
      onValueChange={onChange}
      trackColor={{ false: '#c9ced6', true: '#0b1f3a' }}
      thumbColor="#ffffff"
      // react-native-web usa su propio color para el círculo encendido
      {...({ activeThumbColor: '#ffffff' } as object)}
      ios_backgroundColor="#c9ced6"
    />
  );
}

function Editor({ inicial }: { inicial: HorarioAtencion }) {
  const [horario, setHorario] = useState<HorarioAtencion>(inicial);
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [desde, setDesde] = useState(0);
  const [hasta, setHasta] = useState(0);
  const accion = useAccion(repositorio.guardarHorario, 'Horario guardado.');

  const conflicto =
    accion.error instanceof ErrorNegocio && accion.error.codigo === 'CITAS_FUERA_DE_HORARIO'
      ? accion.error
      : null;
  const errorJornadaActual = edicion ? errorJornada(desde, hasta) : null;

  function cambiarDia(diaSemana: number, abierto: boolean) {
    accion.reset();
    setHorario((h) => ({
      ...h,
      dias: abierto
        ? [...h.dias, { diaSemana, ...JORNADA_POR_DEFECTO }].sort(
            (a, b) => a.diaSemana - b.diaSemana,
          )
        : h.dias.filter((d) => d.diaSemana !== diaSemana),
    }));
  }

  function abrirDia(diaSemana: number) {
    const dia = buscarDia(horario, diaSemana);
    if (!dia) return;
    setDesde(dia.apertura);
    setHasta(dia.cierre);
    setEdicion({ tipo: 'dia', diaSemana });
  }

  function abrirAlmuerzo() {
    const a = horario.almuerzo;
    if (!a) return;
    setDesde(a.inicio);
    setHasta(a.fin);
    setEdicion({ tipo: 'almuerzo' });
  }

  function aplicar() {
    if (!edicion || errorJornadaActual) return;
    accion.reset();
    setHorario((h) =>
      edicion.tipo === 'almuerzo'
        ? { ...h, almuerzo: h.almuerzo ? { ...h.almuerzo, inicio: desde, fin: hasta } : null }
        : {
            ...h,
            dias: h.dias.map((d) =>
              d.diaSemana === edicion.diaSemana ? { ...d, apertura: desde, cierre: hasta } : d,
            ),
          },
    );
    setEdicion(null);
  }

  const tituloHoja =
    edicion?.tipo === 'dia' ? NOMBRES_DIA[edicion.diaSemana] : edicion ? 'Almuerzo' : '';

  return (
    <Pantalla
      titulo="Horario de atención"
      footer={
        <>
          {conflicto ? null : <ErrorAviso error={accion.error} />}
          <Boton cargando={accion.isPending} onPress={() => accion.mutate(horario)}>
            Guardar
          </Boton>
        </>
      }
    >
      <Texto className="text-muted">Días y horas en que el consultorio recibe citas.</Texto>

      <View className="gap-2">
        {ORDEN_SEMANA.map((diaSemana) => {
          const dia = buscarDia(horario, diaSemana);
          const nombre = NOMBRES_DIA[diaSemana];
          return (
            <View
              key={diaSemana}
              className="flex-row items-center bg-white rounded-[14px] pl-4 pr-3 min-h-[60px]"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  dia
                    ? `${nombre}, ${textoRango(dia.apertura, dia.cierre)}, cambiar horas`
                    : `${nombre}, cerrado`
                }
                accessibilityState={{ disabled: !dia }}
                disabled={!dia}
                onPress={() => abrirDia(diaSemana)}
                className="flex-1 py-2.5"
              >
                <Texto className="font-medium">{nombre}</Texto>
                <Texto className="text-xs text-muted">
                  {dia ? textoRango(dia.apertura, dia.cierre) : 'Cerrado'}
                </Texto>
              </Pressable>
              <Interruptor
                etiqueta={`${nombre} abierto`}
                valor={!!dia}
                onChange={(v) => cambiarDia(diaSemana, v)}
              />
            </View>
          );
        })}
      </View>

      <Texto className="text-xs text-muted">
        Toca un día para cambiar la hora de apertura y de cierre.
      </Texto>

      <View className="flex-row items-center bg-navy-100 rounded-[14px] pl-4 pr-3 min-h-[60px]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            horario.almuerzo
              ? `Almuerzo, ${textoRango(horario.almuerzo.inicio, horario.almuerzo.fin)}, cambiar horas`
              : 'Almuerzo desactivado'
          }
          accessibilityState={{ disabled: !horario.almuerzo }}
          disabled={!horario.almuerzo}
          onPress={abrirAlmuerzo}
          className="flex-1 py-2.5"
        >
          <Texto className="font-medium">Almuerzo</Texto>
          <Texto className="text-xs text-muted">
            {horario.almuerzo
              ? `${textoRango(horario.almuerzo.inicio, horario.almuerzo.fin)} · ${textoDias(horario.almuerzo.dias)}`
              : 'Sin almuerzo'}
          </Texto>
        </Pressable>
        <Interruptor
          etiqueta="Almuerzo"
          valor={!!horario.almuerzo}
          onChange={(v) => {
            accion.reset();
            setHorario((h) => ({ ...h, almuerzo: v ? { ...ALMUERZO_POR_DEFECTO } : null }));
          }}
        />
      </View>

      {/* C09 · Editar horas del día */}
      <HojaInferior visible={!!edicion} cerrar={() => setEdicion(null)}>
        <Texto className="font-semibold text-lg">{tituloHoja}</Texto>
        <View className="flex-row gap-3">
          <SelectorHora
            label={edicion?.tipo === 'almuerzo' ? 'Empieza' : 'Abre'}
            valor={desde}
            onChange={setDesde}
            error={!!errorJornadaActual}
          />
          <SelectorHora
            label={edicion?.tipo === 'almuerzo' ? 'Termina' : 'Cierra'}
            valor={hasta}
            onChange={setHasta}
            error={!!errorJornadaActual}
          />
        </View>
        <Texto
          accessibilityLiveRegion="polite"
          className={`text-xs ${errorJornadaActual ? 'text-danger' : 'text-muted'}`}
        >
          {edicion?.tipo === 'almuerzo'
            ? 'La hora en que termina debe ser posterior a la de inicio.'
            : 'La hora de cierre debe ser posterior a la de apertura.'}
        </Texto>
        <Boton onPress={aplicar} disabled={!!errorJornadaActual}>
          Aplicar
        </Boton>
        <Boton variant="text" onPress={() => setEdicion(null)}>
          Cancelar
        </Boton>
      </HojaInferior>

      {/* C10 · Citas fuera del nuevo horario */}
      <HojaInferior visible={!!conflicto} cerrar={() => accion.reset()}>
        <Texto className="font-semibold text-lg">No se puede guardar el horario</Texto>
        <Texto className="text-muted">{conflicto?.message}</Texto>
        {conflicto?.referencia ? (
          <Boton
            onPress={() => {
              const id = conflicto.referencia;
              accion.reset();
              router.push(`/cita/${id}`);
            }}
          >
            Ver la cita
          </Boton>
        ) : null}
        <Boton variant="text" onPress={() => accion.reset()}>
          Entendido
        </Boton>
      </HojaInferior>
    </Pantalla>
  );
}
