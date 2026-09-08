# MyPets 3.0 — Gestión Integral de Mascotas

Aplicación web progresiva (PWA) de página única para tutores de mascotas. Permite registrar y gestionar toda la información de salud, vacunas, medicamentos, agenda y finanzas de múltiples mascotas desde un solo lugar.

🔗 **Demo en vivo:** [my-pets-3-0.vercel.app](https://my-pets-3-0.vercel.app)

---

## Características principales

### 🐾 Gestión de mascotas
- Registro de múltiples mascotas con ficha completa: nombre, especie, raza, fecha de nacimiento, sexo, color, estado reproductivo y microchip
- Catálogo de razas por especie (perro, gato, ave, conejo, pez, hámster, reptil)
- Avatar con emoji personalizado
- Datos del veterinario de cabecera (nombre, clínica, teléfono, email)
- Edad calculada automáticamente

### 💉 Vacunas
- Catálogo específico por especie (DHPP, antirrábica, triple felina, etc.)
- Periodicidades configurables: mensual, bimestral, trimestral, semestral, anual, cada 2 o 3 años
- Cálculo automático de fecha de próxima dosis
- Alertas cuando una vacuna está vencida o próxima a vencer

### 🪱 Desparasitaciones
- Registro de tratamientos antiparasitarios con producto, dosis y fecha
- Mismo sistema de periodicidades y alertas que las vacunas

### 💊 Medicamentos y tratamientos
- Registro completo: medicamento, dosis, unidad, frecuencia en horas o días
- Cálculo automático de horarios de dosificación del día
- Fecha de inicio, hora de inicio y duración del tratamiento
- Control de stock (cantidad, unidad, fecha de caducidad)
- Tratamientos activos vs. finalizados

### 📋 Historial clínico
- Registro de consultas, cirugías, análisis, emergencias y observaciones
- Vista cronológica del historial completo

### 📅 Agenda
- Calendario mensual con vista de eventos por día
- Tipos: veterinario, vacuna, medicamento, desparasitación, baño, peluquería y otros
- Indicadores visuales en días con eventos

### 💰 Finanzas
- Registro de gastos por categoría con filtros por mascota y período
- Gráfico de distribución de gastos (Chart.js)
- Exportación a CSV
- Predicción de gasto mensual

### 🧴 Botiquín
- Inventario de medicamentos e insumos del hogar
- Estado de stock: disponible, por agotarse o agotado
- Alertas de caducidad

### 📊 Seguimiento y nutrición
- Historial de peso con gráfico de evolución
- Registro de estado de ánimo y energía
- Log de síntomas con severidad
- Registro de comidas y actividad física

### 🏠 Dashboard
- Estadísticas: total de mascotas, alertas activas, eventos próximos y medicamentos del día
- Streaks de bienestar
- Recomendaciones inteligentes
- Cumpleaños próximos

### ⚙️ Panel de Administrador (SaaS)
- Acceso exclusivo para usuarios con `is_admin = true`
- **Dashboard:** métricas de usuarios, mascotas, distribución de planes, gráfico de registros 7 días
- **Usuarios:** tabla completa con plan, mascotas y fecha de registro
- **Planes:** gestión de planes Free / Basic / Pro / Clínica con cambio de plan por usuario

---

## Tecnología

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + JavaScript vanilla (SPA) |
| Estilos | Tailwind CSS v3 (CDN) + CSS custom |
| Gráficos | Chart.js 4.4 |
| Auth | Supabase Auth (email + password, recuperación) |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Email | Supabase Auth (SMTP) |
| Deploy | Vercel |

**Sin backend propio.** Auth y datos gestionados 100% por Supabase con Row Level Security.

---

## Arquitectura de base de datos (Supabase)

| Tabla | Descripción |
|---|---|
| `profiles` | Perfiles de usuario (nombre, plan, is_admin) |
| `pets` | Mascotas (owner_id, especie, raza, microchip, vet) |
| `pet_access` | Control de acceso por mascota (owner / editor) |
| `vaccines` | Vacunas por mascota |
| `dewormings` | Desparasitaciones por mascota |
| `medications` | Medicamentos y tratamientos |
| `clinical_history` | Historial clínico |
| `events` | Eventos de la agenda |
| `expenses` | Gastos y finanzas |
| `botiquin` | Inventario del botiquín |
| `weight_history` | Historial de peso |
| `mood_log` | Registro de estado de ánimo |
| `symptoms_log` | Log de síntomas |
| `food_items` | Alimento de cada mascota (producto, tamaño de paquete, consumo diario) — estima cuándo se acaba, reemplaza el antiguo registro de comidas |
| `activities` | Check-in diario de actividad (Poco/Normal/Mucho) |
| `dose_log` | Log de dosis administradas |

Todas las tablas tienen **Row Level Security (RLS)** activo — cada usuario solo ve sus propios datos.

---

## Estructura del proyecto

```
MyPets-3.0/
├── index.html               # Punto de entrada + CDN scripts
├── vercel.json               # Reescribe cualquier ruta a index.html (rutas reales en prod)
├── package.json               # Solo para tests (Vitest) — la app en sí no tiene build step
├── css/
│   └── style.css              # Estilos personalizados y animaciones
├── scripts/
│   ├── spa-server.py          # Servidor local con el mismo fallback de vercel.json
│   └── check-exports.mjs      # Verifica que toda función usada en onclick="..." esté exportada
└── js/
    ├── utils.js                    # Utilidades puras: fechas, formato, cálculo de estado
    ├── utils.test.js               # Tests de Vitest para js/utils.js
    ├── exports.test.js             # Corre check-exports.mjs como parte de `npm test`
    ├── app.js                      # Núcleo: estado, router, shell de UI, iconos, render/initApp
    ├── data.js                     # Carga de datos desde Supabase (mascotas, admin, agenda, gastos)
    ├── auth.js                     # Login/registro/logout y datos de demo
    ├── dashboard.js                # Vista de inicio
    ├── pets.js                     # Alta, ficha, edición, borrado y segundo tutor
    ├── vaccines-dewormings.js      # Vacunas y desparasitaciones
    ├── medications-history.js      # Tratamientos e historial clínico
    ├── calendar.js                 # Agenda
    ├── finance.js                  # Finanzas
    ├── botiquin.js                 # Botiquín
    ├── tracking.js                 # Seguimiento y Nutrición
    └── admin.js                    # Panel de administrador SaaS
```

**Sin build step para la app.** Los archivos se sirven tal cual — ver
[Deploy](#deploy). Todos los `js/*.js` se cargan como módulos ES nativos
(`<script type="module">`); ninguno importa de otro — cada función y
constante de nivel superior se expone además en `window` al final de su
archivo (misma convención en los 13 archivos), así que se siguen llamando
entre sí como globales exactamente igual que en el archivo único original.
`scripts/check-exports.mjs` (corrido en `npm test`) verifica automáticamente
que toda función referenciada desde un `onclick="..."` del HTML generado
esté realmente exportada — si falta una, el botón correspondiente se
rompería en silencio, y este chequeo lo convierte en un test que falla.

### Tests

```bash
npm install
npm test        # corre una vez
npm run test:watch   # modo watch
```

Cubre las funciones de `js/utils.js` (aritmética de fechas en zona local,
los 3 niveles de alerta de `careAlertStatus()`, los umbrales de
`medStockStatus()`/`foodStockStatus()`, el escape de HTML de `esc()`) y,
vía `js/exports.test.js`, que ningún botón quede roto por una función sin
exportar tras mover código entre archivos. El resto de la app (vistas,
Supabase) no tiene tests todavía — depende de verificación manual en el
navegador.

---

## Funciones principales

Repartidas entre `js/*.js` según la tabla de la sección anterior (ej.
`viewDashboard()` vive en `js/dashboard.js`, `saveVaccine()` en
`js/vaccines-dewormings.js`, etc.):

| Función | Descripción |
|---|---|
| `initApp()` | Inicialización, sesión Supabase, detección recovery |
| `loadDataFromSupabase()` | Carga paralela de todos los datos del usuario |
| `loadAdminData()` | Carga datos de todos los usuarios (solo admin) |
| `viewDashboard()` | Pantalla de inicio con resumen y streaks |
| `viewPets()` | Listado de mascotas |
| `viewAddPet()` | Stepper de registro (4 pasos) |
| `viewPetProfile()` | Perfil completo con pestañas |
| `viewCalendar()` | Agenda mensual |
| `viewFinance()` | Módulo de gastos y gráficos |
| `viewBotiquin()` | Inventario del botiquín |
| `viewAdmin()` | Panel de administrador SaaS |
| `savePet()` | Crear mascota en Supabase |
| `saveVaccine()` | Guardar vacuna en Supabase |
| `saveMedication()` | Guardar medicamento en Supabase |
| `saveEvent()` | Guardar evento en Supabase |
| `saveExpense()` | Guardar gasto en Supabase |
| `applyPlanChange()` | Cambiar plan de usuario (admin) |

---

## Autenticación (Supabase Auth)

- **Registro** con nombre, email y contraseña
- **Login** con persistencia de sesión (JWT)
- **Recuperación de contraseña** por email con link seguro
- **Modo demo** con datos precargados (`demo@mypets.cl`)
- Sesión persistente entre recargas con `getSession()`

---

## Planes SaaS

| Plan | Precio | Límites |
|---|---|---|
| Free | $0 | 1 mascota, funciones básicas |
| Basic | $4.990/mes | 3 mascotas, agenda y finanzas |
| Pro | $9.990/mes | Mascotas ilimitadas, seguimiento avanzado, IA |
| Clínica | $29.990/mes | Multi-usuario, gestión clínica, API |

---

## Configuración de Supabase

```javascript
const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Envío de correos (recuperar contraseña / invitar tutor)

La app usa **solo Supabase Auth** para enviar correos (recuperación de
contraseña y la invitación al segundo tutor, vía magic link) — ya no
depende de EmailJS ni de ningún otro tercero. Para que los correos
realmente lleguen hay que configurar en el Dashboard de Supabase:

1. **Authentication → Emails → SMTP Settings**: activa "Enable Custom
   SMTP" y configura un proveedor real (Resend, SendGrid, Postmark,
   tu propio Gmail/Workspace, etc.). El servicio de correo por
   defecto de Supabase es solo para pruebas y está limitado a unos
   pocos correos por hora — con eso jamás va a andar en producción.
2. **Authentication → URL Configuration → Redirect URLs**: agrega la
   URL donde vive la app (por ejemplo `https://tu-dominio.com/*`) para
   que los links de "recuperar contraseña" e "invitar tutor" puedan
   redirigir de vuelta.

### Marcar usuario como administrador

```sql
UPDATE public.profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');
```

### Corregir columnas faltantes en `vaccines` y `dewormings`

Las tablas `vaccines` y `dewormings` fueron creadas sin las columnas de
periodicidad, alerta y costo que la app envía al guardar, por lo que
crear una vacuna o desparasitación nueva fallaba con un error de
Supabase (`Could not find the '...' column ... in the schema cache`).
Ejecuta esto una sola vez en el SQL Editor de Supabase para agregarlas:

```sql
ALTER TABLE public.vaccines
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS periodicity numeric,
  ADD COLUMN IF NOT EXISTS alert_type text,
  ADD COLUMN IF NOT EXISTS alert_days integer,
  ADD COLUMN IF NOT EXISTS cost numeric;

ALTER TABLE public.dewormings
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS periodicity numeric,
  ADD COLUMN IF NOT EXISTS alert_type text,
  ADD COLUMN IF NOT EXISTS alert_days integer,
  ADD COLUMN IF NOT EXISTS cost numeric;
```

`periodicity` es `numeric` (no `integer`) para soportar la opción
"1 1/2 meses" (valor `1.5`).

### Corrección de deuda técnica (2026-08-28)

Se corrigieron varios bugs donde partes de la app parecían funcionar en
el modo demo pero no persistían datos reales en Supabase. La causa de
fondo, descubierta inspeccionando el esquema real de producción, es que
buena parte del código usaba nombres de tabla/columna que **no
coinciden con el proyecto real**:

| Código asumía | Tabla/columna real |
|---|---|
| `clinical_history` | `history_records` (y `doctor`→`vet`, `files` es `text[]`) |
| `mood_log` | `mood_logs` |
| `symptoms_log` | `symptoms_logs` |
| `dose_log` (`medication_id`, `given`) | `dose_logs` (`med_id`, `confirmed`) |
| `botiquin` (`category`, `status`) | `botiquin_items` (`type`, sin `status`) |
| `meals` (`time`, `food`, `portion`, `portion_unit`) | `time_of_day`, `type`, `amount`, `unit` |
| `medications.frequency` / `stock_total` / `expiry` | no existe `frequency`; es `stock_qty` / `expiry_date` |
| tabla nueva `pet_invites` | ya existía como `invitations` |

Todo esto ya está corregido en `js/app.js`. Lo único que falta son 6
columnas nuevas en `pets` (nunca existieron) y dos políticas RLS para
que la invitación de segundo tutor funcione de punta a punta. Ejecuta
esto una sola vez en el SQL Editor de Supabase:

```sql
-- MASCOTAS: campos del wizard que nunca se guardaban (peso, talla,
-- alergias, condiciones crónicas) — las únicas columnas realmente nuevas
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS weight_gr numeric,
  ADD COLUMN IF NOT EXISTS size_range text,
  ADD COLUMN IF NOT EXISTS activity_level integer,
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chronic_conditions text[] DEFAULT '{}';

-- INVITACIONES: la política existente ("Inviters manage invitations")
-- solo deja ver/editar filas a quien las creó. La persona invitada
-- necesita poder ver su propia invitación por token y marcarla usada.
CREATE POLICY "Invited user can view own invitation" ON public.invitations
  FOR SELECT USING (invited_email = auth.email());
CREATE POLICY "Invited user can accept own invitation" ON public.invitations
  FOR UPDATE USING (invited_email = auth.email()) WITH CHECK (invited_email = auth.email());

-- PET ACCESS: el dueño de la mascota necesita poder quitarle el acceso
-- a un segundo tutor ya aceptado (la política existente solo permite
-- a cada usuario tocar su propia fila).
CREATE POLICY "Owner can remove pet access" ON public.pet_access
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_access.pet_id AND p.owner_id = auth.uid())
  );
```

**Notas:**
- La política actual de `pet_access` (`Users see own access`, `ALL`
  usando `user_id = auth.uid()`) ya es lo bastante amplia como para que
  cualquier usuario autenticado pueda insertarse a sí mismo en
  `pet_access` con cualquier `pet_id` — no hace falta una política
  extra para que la invitación funcione, pero vale la pena que lo
  tengas presente como consideración de seguridad aparte.
- `invitations.used` (boolean) reemplaza a lo que iba a ser una columna
  `status`; una invitación vence a los 7 días vía `expires_at`.
- Si ya tenías medicamentos, comidas, síntomas, ánimo o historial
  clínico guardados antes de esta corrección, es muy probable que esos
  inserts hayan estado fallando silenciosamente contra Supabase (nombre
  de tabla/columna incorrecto) — es decir, probablemente no haya datos
  reales que migrar, salvo lo que hayas cargado manualmente en el
  Table Editor.

### Alimentación por stock en vez de registro diario (2026-09-07)

El tab "Nutrición" dejó de pedir registrar cada comida y cada actividad
física por separado — en su lugar:

- **Alimentación**: se carga el producto que se compra (tamaño de paquete,
  consumo diario, precio) y la app calcula sola cuándo se estima que se
  acaba. Requiere una tabla nueva, `food_items`, que nunca existió:

```sql
create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  product text,
  type text,
  package_size numeric,
  package_unit text,
  daily_amount numeric,
  price numeric,
  purchase_date date,
  notes text,
  created_at timestamptz default now()
);

alter table public.food_items enable row level security;

create policy "Users manage food_items of accessible pets" on public.food_items
  for all using (
    exists (select 1 from public.pet_access pa where pa.pet_id = food_items.pet_id and pa.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.pet_access pa where pa.pet_id = food_items.pet_id and pa.user_id = auth.uid())
  );
```

- **Actividad**: se reemplazó el formulario (tipo/duración/distancia) por
  un check-in de un toque (Poco/Normal/Mucho), un registro por día. Sigue
  usando la tabla `activities` ya existente — sin cambios de esquema.
- La tabla `meals` queda sin uso (no se borra por si tenías datos ahí).

---

## Deploy

El proyecto no requiere build. Se puede desplegar directamente en:

- **Vercel:** conectar el repositorio y desplegar automáticamente
- **GitHub Pages:** activar Pages desde la rama `main`
- **Cualquier hosting estático:** subir los 3 archivos

Requiere una cuenta gratuita en [supabase.com](https://supabase.com) para auth y base de datos.

---

## Licencia

MIT — libre uso, modificación y distribución.
