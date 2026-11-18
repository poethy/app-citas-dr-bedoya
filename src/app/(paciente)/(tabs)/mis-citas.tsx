import { useState } from 'react';
import { useCitas } from '@/hooks/useCitas';
import { useAhora } from '@/hooks/useAhora';
import { useSesionStore } from '@/store/sesion.store';
import { Campo, Estado, Opciones, Pantalla } from '@/components/ui';
import CitaCard from '@/components/CitaCard';
import { fechaTexto } from '@/utils/fechas';
export default function MisCitas() {
  const ahora = useAhora();
  const consulta = useCitas();
  const perfil = useSesionStore((s) => s.perfil);
  const [busqueda, setBusqueda] = useState(''),
    [filtro, setFiltro] = useState('proximas');
  const citas = (consulta.data ?? [])
    .filter(
      (c) =>
        c.pacienteId === perfil?.id &&
        `${c.servicioNombre} ${fechaTexto(c.inicio)} ${c.inicio}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()) &&
        (filtro === 'proximas'
          ? c.estado === 'confirmada' && Date.parse(c.inicio) > ahora
          : filtro === 'pasadas'
            ? c.estado === 'confirmada' && Date.parse(c.inicio) <= ahora
            : c.estado === filtro),
    )
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  if (consulta.isPending)
    return (
      <Pantalla menu titulo="Mis citas">
        <Estado titulo="Cargando citas" cargando />
      </Pantalla>
    );
  if (consulta.isError)
    return (
      <Pantalla menu titulo="Mis citas">
        <Estado
          titulo="No pudimos cargar tus citas"
          detalle={consulta.error.message}
          accion={() => consulta.refetch()}
        />
      </Pantalla>
    );
  return (
    <Pantalla menu titulo="Mis citas">
      <Campo
        label="Buscar"
        placeholder="Buscar por servicio o fecha"
        value={busqueda}
        onChangeText={setBusqueda}
      />
      <Opciones
        valor={filtro}
        onChange={setFiltro}
        opciones={[
          { valor: 'proximas', label: 'Próximas' },
          { valor: 'pendiente', label: 'Pendientes' },
          { valor: 'pasadas', label: 'Pasadas' },
          { valor: 'cancelada', label: 'Canceladas' },
          { valor: 'rechazada', label: 'Rechazadas' },
          { valor: 'vencida', label: 'Vencidas' },
        ]}
      />
      {citas?.length ? (
        citas.map((c) => <CitaCard key={c.id} cita={c} />)
      ) : (
        <Estado titulo="No hay citas en esta lista" detalle="Prueba otra búsqueda o filtro." />
      )}
    </Pantalla>
  );
}
