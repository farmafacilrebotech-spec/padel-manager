## Público ON/OFF (torneos)

Estos SQL preparan el backend (Postgres/Supabase) para que el organizador controle la visibilidad pública del torneo.

### Qué incluyen

- **`public` boolean** en `public.torneos` con **default `false`**
- **Policy RLS** de **SELECT público** solo si `public = true`

### Cómo aplicar

- En Supabase: copia/pega los SQL en el editor SQL, o usa Supabase CLI si lo tienes configurado.
- Orden recomendado:
  1. `supabase/migrations/20260416_001_add_public_to_torneos.sql`
  2. `supabase/migrations/20260416_002_rls_torneos_public_select.sql`

### Nota importante

La policy `torneos_select_public` **solo** permite lectura de torneos públicos. El organizador debe tener sus policies (select/update) aparte, según tu modelo de auth (owner_id, roles, etc.).

