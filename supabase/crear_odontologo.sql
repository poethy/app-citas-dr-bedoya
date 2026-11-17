-- =====================================================================
-- Convierte una cuenta en la del odontólogo (se ejecuta una sola vez)
--
-- 1. En Supabase: Authentication → Users → Add user → Create new user.
--    Correo y contraseña del doctor, con «Auto Confirm User» marcado.
-- 2. Cambia el correo de abajo y ejecuta este archivo en el SQL Editor.
-- =====================================================================

do $$
declare
  v_correo text := 'CAMBIAR@correo.com';  -- ← correo de la cuenta del doctor
  v_id     uuid;
begin
  select id into v_id from public.perfiles where correo = v_correo;
  if v_id is null then
    raise exception 'No existe una cuenta con el correo %', v_correo;
  end if;

  update public.perfiles
     set rol = 'odontologo', nombre = 'Dr. Camilo Bedoya Orozco'
   where id = v_id;

  -- Al crearse, la cuenta recibió una ficha de paciente; el odontólogo no la necesita
  delete from public.pacientes p
   where p.perfil_id = v_id
     and not exists (select 1 from public.citas c where c.paciente_id = p.id);

  raise notice 'Listo: % ahora es odontólogo', v_correo;
end $$;
