-- 2) RLS: lectura pública solo si public=true
-- Asume que RLS ya está habilitado en `public.torneos`. Si no:
-- alter table public.torneos enable row level security;

-- Permite a usuarios anónimos/autenticados leer torneos marcados como públicos.
-- Importante: esta policy SOLO cubre SELECT; el organizador debería tener su policy separada.
drop policy if exists "torneos_select_public" on public.torneos;
create policy "torneos_select_public"
  on public.torneos
  for select
  using (public = true);

