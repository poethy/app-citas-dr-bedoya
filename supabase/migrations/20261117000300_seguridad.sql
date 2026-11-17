-- =====================================================================
-- App Citas Dr. Camilo Bedoya · Migración 3: seguridad por rol (RLS, RF-03)
-- Ver docs/especificaciones-tecnicas.md, sección 4.1.
--
-- Regla general: el paciente solo lee lo suyo y nunca escribe citas
-- directamente; crear, cancelar y reprogramar pasa por las funciones RPC
-- (security definer), que validan todas las reglas.
-- =====================================================================

alter table public.perfiles             enable row level security;
alter table public.pacientes            enable row level security;
alter table public.servicios            enable row level security;
alter table public.horario_atencion     enable row level security;
alter table public.bloqueos_recurrentes enable row level security;
alter table public.bloqueos             enable row level security;
alter table public.configuracion        enable row level security;
alter table public.citas                enable row level security;
alter table public.notificaciones       enable row level security;
alter table public.tokens_push          enable row level security;

-- Sin sesión no se ve nada
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon, public;

-- perfiles: cada quien lee y edita el suyo (sin poder cambiar su rol); el odontólogo lee todos
create policy perfiles_leer on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_odontologo());
create policy perfiles_editar on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.perfiles from authenticated;
grant update (nombre, telefono) on public.perfiles to authenticated;

-- pacientes: el paciente ve su fila; el odontólogo todo
create policy pacientes_leer on public.pacientes for select to authenticated
  using (perfil_id = auth.uid() or public.es_odontologo());
create policy pacientes_odontologo on public.pacientes for all to authenticated
  using (public.es_odontologo()) with check (public.es_odontologo());

-- Catálogos y configuración: todos leen; solo el odontólogo escribe
create policy servicios_leer   on public.servicios for select to authenticated using (true);
create policy servicios_editar on public.servicios for all    to authenticated
  using (public.es_odontologo()) with check (public.es_odontologo());

create policy horario_leer   on public.horario_atencion for select to authenticated using (true);
create policy horario_editar on public.horario_atencion for all    to authenticated
  using (public.es_odontologo()) with check (public.es_odontologo());

create policy recurrentes_leer   on public.bloqueos_recurrentes for select to authenticated using (true);
create policy recurrentes_editar on public.bloqueos_recurrentes for all    to authenticated
  using (public.es_odontologo()) with check (public.es_odontologo());

create policy configuracion_leer   on public.configuracion for select to authenticated using (true);
create policy configuracion_editar on public.configuracion for update to authenticated
  using (public.es_odontologo()) with check (public.es_odontologo());

-- bloqueos: solo el odontólogo (el paciente ve la ocupación con disponibilidad_dia)
create policy bloqueos_odontologo on public.bloqueos for all to authenticated
  using (public.es_odontologo()) with check (public.es_odontologo());

-- citas: solo lectura por políticas; las escrituras van por RPC
create policy citas_leer on public.citas for select to authenticated
  using (public.es_odontologo() or paciente_id = public.paciente_actual_id());
revoke insert, update, delete on public.citas from authenticated;

-- notificaciones: cada quien las suyas; solo puede marcarlas como leídas
create policy notificaciones_leer on public.notificaciones for select to authenticated
  using (destinatario_id = auth.uid());
create policy notificaciones_marcar on public.notificaciones for update to authenticated
  using (destinatario_id = auth.uid()) with check (destinatario_id = auth.uid());
revoke insert, update, delete on public.notificaciones from authenticated;
grant update (leida) on public.notificaciones to authenticated;

-- tokens_push: cada quien los suyos
create policy tokens_propios on public.tokens_push for all to authenticated
  using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- Funciones que la app puede llamar (POST /rest/v1/rpc/<nombre>)
grant execute on function public.disponibilidad_dia(date)                                   to authenticated;
grant execute on function public.solicitar_cita(uuid, timestamptz)                          to authenticated;
grant execute on function public.cancelar_cita(uuid)                                        to authenticated;
grant execute on function public.reprogramar_cita(uuid, timestamptz)                        to authenticated;
grant execute on function public.responder_solicitud(uuid, boolean)                         to authenticated;
grant execute on function public.registrar_cita_consultorio(text, text, uuid, timestamptz)  to authenticated;
grant execute on function public.crear_bloqueo(timestamptz, timestamptz, text)              to authenticated;
grant execute on function public.es_odontologo()                                            to authenticated;
grant execute on function public.paciente_actual_id()                                       to authenticated;

-- Las funciones internas (validaciones, avisos, recordatorios) no se exponen
revoke execute on function public.validar_franja(timestamptz, timestamptz, uuid) from authenticated;
revoke execute on function public.generar_recordatorios()                        from authenticated;
revoke execute on function public.generar_resumen_diario()                       from authenticated;
revoke execute on function public.avisar_odontologos(public.citas, text, text, text) from authenticated;
revoke execute on function public.avisar_paciente(public.citas, text, text, text)    from authenticated;
revoke execute on function public.texto_cita(public.citas)                           from authenticated;
revoke execute on function public.lanzar(text, text)                                 from authenticated;
