-- ============================================================
-- MYPETS 3.0 — Foto de las políticas RLS en producción
-- ============================================================
-- Generado a partir de `select * from pg_policies where schemaname = 'public'`
-- corrido en el SQL Editor de Supabase. Ver supabase/README.md para la
-- query exacta y cómo regenerar este archivo.
--
-- Esto es una FOTO para auditoría y recuperación ante desastre, NO una
-- migración idempotente para correr — las políticas ya existen en
-- producción. Si necesitás reconstruir el esquema desde cero, revisá cada
-- CREATE POLICY antes de ejecutarlo (y creá antes las funciones
-- pet_accessible(pet_id), pet_editor(pet_id) e is_admin(), referenciadas
-- acá pero cuya definición todavía no está versionada — ver TODO al final).
--
-- Última actualización: 2026-09-08

-- ---------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view activities" ON public.activities
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage activities" ON public.activities
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- botiquin_items
-- ---------------------------------------------------------------
CREATE POLICY "Users manage own botiquin" ON public.botiquin_items
  FOR ALL TO public
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------
-- dewormings
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view dewormings" ON public.dewormings
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage dewormings" ON public.dewormings
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- dose_logs
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view dose logs" ON public.dose_logs
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage dose logs" ON public.dose_logs
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- events
-- ---------------------------------------------------------------
CREATE POLICY "Users manage own events" ON public.events
  FOR ALL TO public
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------
CREATE POLICY "Users manage own expenses" ON public.expenses
  FOR ALL TO public
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------
-- food_items
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view food_items" ON public.food_items
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage food_items" ON public.food_items
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- history_records
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view history" ON public.history_records
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage history" ON public.history_records
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------
CREATE POLICY "Invited user can view own invitation" ON public.invitations
  FOR SELECT TO public
  USING (invited_email = auth.email());

CREATE POLICY "Invited user can accept own invitation" ON public.invitations
  FOR UPDATE TO public
  USING (invited_email = auth.email())
  WITH CHECK (invited_email = auth.email());

CREATE POLICY "Inviters manage invitations" ON public.invitations
  FOR ALL TO public
  USING (inviter_id = auth.uid());

-- ---------------------------------------------------------------
-- meals
-- NOTA: tabla del registro de comidas detallado, reemplazada por
-- food_items (estimación de stock) en el rediseño de Nutrición del
-- 2026-09-07 — la app ya no la usa. Las políticas siguen activas porque
-- nunca se borró la tabla; candidata a limpieza si se confirma que no
-- queda ningún dato ni código que la referencie.
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view meals" ON public.meals
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage meals" ON public.meals
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- medications
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view medications" ON public.medications
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage medications" ON public.medications
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- mood_logs
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view mood" ON public.mood_logs
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage mood" ON public.mood_logs
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- pet_access
-- El control de acceso compartido en sí: qué usuario puede ver/editar
-- qué mascota, y con qué rol (owner / editor / viewer). pet_accessible()
-- y pet_editor() (usadas en casi todas las tablas de arriba) se apoyan en
-- esta tabla.
-- ---------------------------------------------------------------
CREATE POLICY "Users view own access" ON public.pet_access
  FOR SELECT TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can remove own access" ON public.pet_access
  FOR DELETE TO public
  USING (user_id = auth.uid());

CREATE POLICY "Owner can remove pet access" ON public.pet_access
  FOR DELETE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_access.pet_id AND p.owner_id = auth.uid()
    )
  );

-- Se dispara al crear una mascota nueva: el propio dueño se inserta a sí
-- mismo con role='owner' (ver savePet() en js/pets.js, que hace el insert
-- en pets y el de pet_access como dos pasos, con rollback manual si el
-- segundo falla — ver js/pets.test.js).
CREATE POLICY "Owner grants self access on pet creation" ON public.pet_access
  FOR INSERT TO public
  WITH CHECK (
    (user_id = auth.uid())
    AND (role = 'owner')
    AND EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = pet_access.pet_id AND p.owner_id = auth.uid()
    )
  );

-- Se dispara cuando el segundo tutor invitado acepta la invitación (link
-- de magic link con ?invite=TOKEN, ver acceptPetInvite() en js/pets.js):
-- valida que exista una invitación sin usar, no vencida, para su email,
-- y que el rol que se está insertando coincida con el que se invitó.
CREATE POLICY "Accept own invitation grants access" ON public.pet_access
  FOR INSERT TO public
  WITH CHECK (
    (user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.pet_id = pet_access.pet_id
        AND i.invited_email = auth.email()
        AND i.used = false
        AND i.expires_at > now()
        AND i.role = CASE pet_access.role
                        WHEN 'editor' THEN 'edicion'
                        WHEN 'viewer' THEN 'lectura'
                        ELSE NULL
                      END
    )
  );

-- ---------------------------------------------------------------
-- pets
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view pets" ON public.pets
  FOR SELECT TO public
  USING ((owner_id = auth.uid()) OR pet_accessible(id) OR is_admin());

CREATE POLICY "Owner can insert pets" ON public.pets
  FOR INSERT TO public
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Pet editors can update pets" ON public.pets
  FOR UPDATE TO public
  USING ((owner_id = auth.uid()) OR pet_editor(id))
  WITH CHECK ((owner_id = auth.uid()) OR pet_editor(id));

-- Solo el dueño puede borrar — un editor invitado NO puede eliminar la
-- mascota, solo editarla.
CREATE POLICY "Owner can delete pets" ON public.pets
  FOR DELETE TO public
  USING (owner_id = auth.uid());

-- ---------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL TO public
  USING (auth.uid() = id);

-- Estas dos son las que cierran el hueco del panel Admin: sin ellas,
-- loadAdminData() (js/data.js) haría select * sobre profiles/pets y solo
-- el chequeo `state.user?.isAdmin` del cliente (js/admin.js) evitaría que
-- cualquier usuario autenticado leyera los datos de todos los demás.
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO public
  USING (is_admin() OR (auth.uid() = id));

CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO public
  USING (is_admin());

-- ---------------------------------------------------------------
-- symptoms_logs
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view symptoms" ON public.symptoms_logs
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage symptoms" ON public.symptoms_logs
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- vaccines
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view vaccines" ON public.vaccines
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage vaccines" ON public.vaccines
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ---------------------------------------------------------------
-- weight_history
-- ---------------------------------------------------------------
CREATE POLICY "Pet access can view weight" ON public.weight_history
  FOR SELECT TO public
  USING (pet_accessible(pet_id));

CREATE POLICY "Pet editors manage weight" ON public.weight_history
  FOR ALL TO public
  USING (pet_editor(pet_id))
  WITH CHECK (pet_editor(pet_id));

-- ============================================================
-- TODO: falta versionar en este mismo directorio
-- ============================================================
-- 1. La definición de las 3 funciones usadas arriba:
--      pet_accessible(pet_id uuid), pet_editor(pet_id uuid), is_admin()
--    Query para traerlas (ver supabase/README.md):
--      select p.proname, pg_get_functiondef(p.oid)
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public'
--        and p.proname in ('pet_accessible','pet_editor','is_admin');
-- 2. Confirmar que TODAS las tablas de la app tienen RLS activo
--    (relrowsecurity = true) — no solo las que aparecen en pg_policies.
--    Una tabla sin ninguna policy y CON RLS activo bloquea todo el
--    acceso (fail-closed); sin RLS activo, queda abierta a cualquier
--    usuario autenticado según los grants por defecto (fail-open) —
--    hay que revisar esto tabla por tabla, pg_policies solo no alcanza.
