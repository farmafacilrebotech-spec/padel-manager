-- 1) Campo de visibilidad pública
-- Nota: `public` es palabra reservada en algunos lenguajes, pero en Postgres es válido como nombre de columna.
alter table public.torneos
  add column if not exists public boolean not null default false;

-- Opcional (recomendado): índice para búsquedas por código + público
-- create index if not exists torneos_codigo_public_idx on public.torneos (codigo, public);

