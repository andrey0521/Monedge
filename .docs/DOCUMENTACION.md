# Monedge — Documentación Completa del Proyecto

> **Proyecto:** ATE2 — Tecnologías Emergentes para el Desarrollo de Soluciones  
> **Institución:** UABC  
> **Versión del documento:** 1.0

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Investigación de usuarios](#2-investigación-de-usuarios)
3. [Arquitectura de información](#3-arquitectura-de-información)
4. [Diseño UI/UX](#4-diseño-uiux)
5. [Arquitectura del sistema](#5-arquitectura-del-sistema)
6. [Base de datos](#6-base-de-datos)
7. [API y servicios](#7-api-y-servicios)
8. [Sistema de IA](#8-sistema-de-ia)
9. [Decisiones que cambiaron durante el desarrollo](#9-decisiones-que-cambiaron-durante-el-desarrollo)
10. [Problemas encontrados y cómo se resolvieron](#10-problemas-encontrados-y-cómo-se-resolvieron)
11. [Lecciones aprendidas](#11-lecciones-aprendidas)

---

## 1. Resumen ejecutivo

### ¿Qué es Monedge?

Monedge es una aplicación web de gestión de finanzas personales con inteligencia artificial. Permite a cualquier persona registrar sus ingresos y gastos, organizar su dinero en cuentas, definir presupuestos por categoría y establecer metas de ahorro, todo con el apoyo de un asistente de IA que analiza sus datos y genera recomendaciones personalizadas.

### ¿Para quién es?

El perfil principal es el de un estudiante universitario o profesional joven que quiere tomar control de sus finanzas pero no tiene experiencia contable. La app debe ser intuitiva lo suficiente para que un usuario nuevo pueda registrar su primera transacción en menos de dos minutos.

### ¿Qué problema resuelve?

La mayoría de las apps de finanzas personales tienen dos problemas: son demasiado complejas (piden configurar demasiadas cosas antes de ser útiles) o son demasiado simples (solo suman y restan). Monedge busca el punto medio: configuración mínima, contexto máximo. La IA hace el trabajo de interpretar los datos para que el usuario no tenga que hacerlo.

### Diferenciadores clave

- **Categorización automática con IA**: el usuario escribe "starbucks $85" y el sistema selecciona la categoría correcta automáticamente
- **Presupuestos etiquetables**: cada gasto puede vincularse explícitamente a un presupuesto específico, no solo por categoría
- **Metas impulsadas por transacciones**: al registrar un ingreso, puedes asignarlo directamente a una meta y el progreso se actualiza solo
- **Laboratorio de IA**: preguntas en lenguaje natural con respuestas basadas en cálculos reales sobre los datos del usuario, no respuestas genéricas
- **Proyecciones de metas**: basadas en el ritmo de ahorro real del usuario

---

## 2. Investigación de usuarios

### Perfil de usuario

**Usuario primario:**
- Estudiante universitario o recién egresado
- Edad: 18-28 años
- Ingresos variables (beca, trabajo part-time, freelance o primer empleo)
- Usa el teléfono para todo pero accede a datos financieros desde computadora
- No tiene experiencia con contabilidad ni hojas de cálculo
- Ha intentado antes llevar un registro de gastos pero lo abandona

**Usuario secundario:**
- Profesional junior (25-35 años)
- Ingresos más estables pero múltiples cuentas (débito, crédito, efectivo)
- Quiere saber si puede darse un gasto grande sin descuadrar el mes

### Necesidades identificadas

| Necesidad | Frecuencia | Prioridad |
|-----------|-----------|-----------|
| Saber cuánto puede gastar hoy sin descuadrar el mes | Diaria | Alta |
| Ver cuánto gastó en X categoría este mes | Semanal | Alta |
| Recibir alertas cuando está cerca de agotar un presupuesto | Semanal | Alta |
| Entender a dónde va el dinero sin hacer cálculos manuales | Mensual | Alta |
| Proyectar cuándo alcanzará una meta de ahorro | Mensual | Media |
| Comparar este mes con el anterior | Mensual | Media |
| Preguntar "¿qué pasa si...?" sobre sus finanzas | Ocasional | Media |

### Problemas detectados con apps existentes

- **Curva de aprendizaje alta**: piden conectar cuentas bancarias o configurar categorías antes de registrar nada
- **Demasiadas opciones**: apps como YNAB o Mint abruman al usuario nuevo
- **Contexto sin acción**: muestran gráficas pero no dicen qué hacer con ellas
- **Sin IA útil**: las pocas apps con IA dan consejos genéricos ("gasta menos en entretenimiento")

### Insights que guiaron el diseño

1. **El número más importante es "cuánto puedo gastar hoy"** — se convirtió en el KPI hero de la pantalla Inicio
2. **Los usuarios no piensan en "categorías", piensan en "mandado", "gasolina", "Netflix"** — llevó al diseño de presupuestos con nombre libre en vez de presupuestos por categoría
3. **El "Balance Total" puede mentir** — un usuario con $50k ahorrados pero que gasta $3k más de lo que gana cada mes se siente bien hasta que no. Por eso se separa el "Flujo del mes" del "Patrimonio total"
4. **La IA solo es útil si trabaja con datos reales** — el Laboratorio IA corre cálculos SQL antes de llamar al modelo, no solo le manda texto

---

## 3. Arquitectura de información

### Estructura de navegación

```
/ (Landing)
├── /login
├── /register   ← flujo de 2 pasos: datos + elección de categorías
└── /panel      ← protegido por middleware (requiere cookie JWT)
    ├── /panel              → Inicio (dashboard del mes actual)
    ├── /panel/movimientos  → Transacciones (CRUD + filtros + IA)
    ├── /panel/billetera    → Cuentas (CRUD)
    ├── /panel/planificacion → Presupuestos, Metas y Recurrentes
    ├── /panel/analisis     → Análisis financiero (5 modales + IA)
    └── /panel/categorias   → Gestión de categorías (acceso desde Settings)
```

### Jerarquía de datos

```
Usuario
├── Cuentas (Billetera)
│   └── balance actualizado automáticamente al crear/eliminar transacciones
├── Categorías
│   ├── Predeterminadas (18: 12 gastos + 6 ingresos)
│   └── Personalizadas (ilimitadas)
├── Transacciones
│   ├── → pertenecen a una Cuenta (opcional)
│   ├── → pertenecen a una Categoría (opcional)
│   ├── → etiquetadas a un Presupuesto (opcional, gastos)
│   └── → etiquetadas a una Meta (opcional, ingresos)
├── Presupuestos
│   ├── spent = suma de transacciones con budget_id = este presupuesto
│   └── puede ser recurrente (semanal / quincenal / mensual)
├── Metas de ahorro
│   └── saved_amount aumenta automáticamente cuando se etiqueta un ingreso
└── Transacciones Recurrentes
    └── apply() → crea Transacción + avanza next_date
```

### Modelo mental del usuario

El diseño intenta que el usuario piense en términos simples:

- **Cuentas** = dónde vive el dinero (banco, efectivo, tarjeta)
- **Categorías** = etiquetas genéricas para clasificar y analizar
- **Presupuestos** = límites específicos que el usuario define ("mandado semanal: $500")
- **Metas** = destinos específicos de ahorro ("laptop nueva: $15,000")
- **Transacciones** = eventos que conectan todo lo anterior

La diferencia clave entre Categorías y Presupuestos se estableció después de detectar confusión: las categorías son para análisis (¿en qué gasto?), los presupuestos son para control (¿cuánto me permito gastar en esto?).

---

## 4. Diseño UI/UX

### Principios de diseño

1. **Contexto antes que datos** — cada número debe tener un label que explique qué es y para qué sirve
2. **Acción visible** — el usuario siempre sabe qué puede hacer desde donde está
3. **Sin confirmaciones nativas del navegador** — todos los diálogos de confirmación son modales propios con "Cancelar / Sí, eliminar"
4. **Dark mode real** — no solo invertir colores, sino colores diseñados para fondos oscuros
5. **Responsive sin sacrificar** — desktop primero, pero todas las pantallas funcionan en móvil

### Sistema de color

| Token | Valor | Uso |
|-------|-------|-----|
| Azul brand | `#165BC5` | CTAs, elementos activos, KPIs neutros |
| Azul hover | `#0B3EA1` | Estados hover del azul brand |
| Verde ingreso | `#34d399` (emerald-400) | Ingresos, ahorro positivo, estados OK |
| Rojo gasto | `#ef4444` | Gastos, déficit, presupuestos excedidos |
| Ámbar alerta | `#f59e0b` | Advertencias (presupuesto al 70-90%) |
| Fondo claro | `#f5f7fa` | Fondo de la app en light mode |
| Fondo card claro | `bg-white` | Cards en light mode |
| Fondo oscuro | `#111827` | Fondo app en dark mode |
| Fondo card oscuro | `#1e2433` | Cards en dark mode |
| Fondo input oscuro | `#252d3d` | Inputs y selects en dark mode |

### Tipografía

- Fuente base: Next.js default (system font stack)
- Escala global: `font-size: 115%` en `<html>` — escala todos los `rem` sin tocar clases individuales
- Pesos usados: `font-medium` (labels), `font-semibold` (valores secundarios), `font-bold` (títulos y KPIs)

### Sistema de componentes

#### Cards de entrada a modales
```
EntryCard: rounded-2xl border hover:border-[#165BC5] hover:shadow-md
└── Icon + title (font-bold text-base) + subtitle (text-sm text-gray-400)
└── ChevronRight que cambia a azul en hover
```

#### KPIs duales (ingresos | gastos)
```
DualKpi: bg-gray-50 rounded-xl p-5
└── label text-sm text-gray-400
└── grid 2 cols dividido con border
    ├── Ingresos: text-xs text-emerald-500 + text-xl font-bold text-emerald-600
    └── Gastos:   text-xs text-red-400    + text-xl font-bold text-red-500
```

#### KPIs individuales
```
SingleKpi: bg-gray-50 rounded-xl p-5
└── label text-sm text-gray-400
└── value text-2xl font-bold (color contextual)
└── sub text-xs text-gray-400
```

#### Formularios
```
INPUT_CLS = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5
            text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d]
            focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30"
```

#### Modal de confirmación de eliminación
Patrón consistente en toda la app:
```
Estado: deleteTarget: { id, label } | null
handleDelete(id) → setDeleteTarget (no llama al API)
confirmDelete()  → llama al API → setDeleteTarget(null)
Modal: fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4
  └── div bg-white dark:bg-[#1e2433] rounded-2xl max-w-xs p-6
      ├── h3 título
      ├── p descripción con nombre del elemento
      └── flex gap-3: [Cancelar] [Sí, eliminar (rojo)]
```

> **Regla:** nunca usar `confirm()` nativo del navegador. Viola el patrón visual de la app y no se puede estilizar.

### Dark mode

Se implementa con la clase `dark` en `<html>`. El toggle vive en el sidebar y persiste en `localStorage`.

```css
/* globals.css */
@custom-variant dark (&:where(.dark, .dark *));
```

Las gráficas de Recharts no responden a CSS variables, así que usan detección dinámica:
```typescript
const [isDark, setIsDark] = useState(false);
useEffect(() => {
  const obs = new MutationObserver(() =>
    setIsDark(document.documentElement.classList.contains("dark"))
  );
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}, []);
```

Variables de color para Recharts en dark mode:
- Grid: `#374151` (dark) / `#f3f4f6` (light)
- Ticks: `#6b7280` (dark) / `#9ca3af` (light)
- Gastos: `#93c5fd` (dark, azul claro) / `#165BC5` (light, azul brand)

### Patrones de interacción

**Formularios con estado:**
- Todas las páginas bajo `/panel` con formulario tienen: `items[]`, `showForm`, `form`, `editing`, `saving`
- Al editar, se popula el form con los valores actuales
- Al guardar, se actualiza el array local sin recargar (optimistic UI-style)
- Toast de confirmación en cada acción exitosa

**Filtros en Movimientos:**
- Panel colapsable con badge que indica cuántos filtros están activos
- Chips de "mes rápido" (Este mes, Mes ant., Hace 2) que setean `filterStart`/`filterEnd`
- "Limpiar filtros" solo aparece cuando `activeFiltersCount > 0`

**Carga progresiva en Movimientos:**
- Carga inicial: últimos 30 días (300 transacciones)
- "Cargar historial completo" en el footer: carga en bloques de 31 días hacia atrás

**Sugerencia automática de presupuesto:**
- Al seleccionar una categoría en un gasto, si existe un presupuesto activo con esa categoría, se preselecciona automáticamente
- Badge "Sugerido" indica que fue seleccionado por el sistema, no por el usuario

### Feedback y estados vacíos

Cada sección con datos tiene un estado vacío explícito con:
- Ícono ilustrativo (de lucide-react)
- Texto descriptivo breve
- CTA opcional (ej: "Agregar una categoría →")

---

## 5. Arquitectura del sistema

### Stack tecnológico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Frontend | Next.js + React + TypeScript | 16 / 19 | App Router, "use client" |
| Estilos | Tailwind CSS v4 | 4.x | Sin config file; customización en globals.css |
| Íconos | lucide-react | ^1.8.0 | |
| Gráficas | Recharts | ^3.8.1 | AreaChart, BarChart, LineChart, PieChart |
| Backend | FastAPI + SQLAlchemy (async) | — | Python 3.12+ |
| Base de datos | PostgreSQL 15 | 15 | Docker, puerto 5433 en host |
| Autenticación | JWT (HS256) en cookie HttpOnly | — | |
| IA | Google AI Studio | — | Modelo: `gemini-2.5-flash` |
| SDK de IA | google-genai | — | Cliente async |
| Orquestación | Docker Compose | — | 3 contenedores: db, backend, frontend |

### Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario (Navegador)                                        │
│  Next.js 16 — localhost:3000                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  middleware.ts → protege /panel/* con JWT cookie    │   │
│  │  panel/layout.tsx → Sidebar + Header                │   │
│  │  panel/page.tsx         → Inicio                    │   │
│  │  panel/movimientos/     → Transacciones             │   │
│  │  panel/billetera/       → Cuentas                   │   │
│  │  panel/planificacion/   → Presupuestos+Metas+Rec.   │   │
│  │  panel/analisis/        → Análisis + Lab IA         │   │
│  │  panel/categorias/      → Gestión de categorías     │   │
│  └─────────────┬───────────────────────────────────────┘   │
└────────────────│────────────────────────────────────────────┘
                 │ HTTP + credentials: "include" (cookie JWT)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI — localhost:8000                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CORS: solo permite FRONTEND_URL                    │   │
│  │  Dependency: get_current_user → decode JWT          │   │
│  │                                                     │   │
│  │  /auth         /accounts      /categories           │   │
│  │  /transactions /budgets       /goals                │   │
│  │  /recurring    /dashboard     /ai                   │   │
│  │                                                     │   │
│  │  ai_service.py → SQLAlchemy aggregations            │   │
│  │               → google-genai (gemini-2.5-flash)     │   │
│  └─────────────┬───────────────────────────────────────┘   │
└────────────────│────────────────────────────────────────────┘
                 │ asyncpg
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL 15 — localhost:5433                             │
│  Base de datos: monedge_app                                 │
│  Usuario: admin / Password: adminpassword                   │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼ (solo ai_service)
┌─────────────────────────────────────────────────────────────┐
│  Google AI Studio API                                       │
│  Modelo: gemini-2.5-flash (free tier)                      │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de autenticación

```
1. POST /auth/login → FastAPI verifica password → genera JWT (HS256)
2. Response: Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax
3. Browser almacena cookie automáticamente
4. Next.js middleware.ts: lee cookie en cada request a /panel/*
   → si no hay cookie: redirect a /login
   → si hay cookie: pass
5. Frontend: todas las llamadas incluyen credentials: "include"
6. FastAPI: Depends(get_current_user) → lee cookie → decode JWT → retorna User
```

### Migración de base de datos

No se usa Alembic. En su lugar, el startup de FastAPI ejecuta `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para cada columna nueva. Esto es idempotente y suficiente para un proyecto con instancia única.

```python
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migraciones inline
        await conn.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR ..."))
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS budget_id UUID ..."))
        await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS goal_id UUID ..."))
        await conn.execute(text("ALTER TABLE budgets ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN ..."))
        await conn.execute(text("ALTER TABLE budgets ADD COLUMN IF NOT EXISTS frequency VARCHAR"))
```

---

## 6. Base de datos

### Diagrama de entidades

```
users
  ├── accounts (user_id FK)
  ├── categories (user_id FK, nullable = global)
  ├── transactions (user_id FK)
  │     ├── account_id FK → accounts
  │     ├── category_id FK → categories
  │     ├── budget_id FK → budgets (nullable)  ← agregado en iteración 2
  │     └── goal_id FK → goals (nullable)      ← agregado en iteración 2
  ├── budgets (user_id FK)
  │     └── category_id FK → categories (nullable, solo decorativo)
  ├── goals (user_id FK)
  └── recurring_transactions (user_id FK)
        ├── account_id FK → accounts
        └── category_id FK → categories
```

### Tablas principales

#### `transactions`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| account_id | UUID FK nullable | |
| category_id | UUID FK nullable | Para clasificación y análisis |
| budget_id | UUID FK nullable | Para control de presupuesto |
| goal_id | UUID FK nullable | Para seguimiento de meta |
| amount | Numeric(14,2) | |
| type | VARCHAR | `income` \| `expense` |
| description | VARCHAR | |
| date | Date | |
| created_at | DateTime | |
| installment_months | Integer nullable | Para pagos a meses |
| monthly_amount | Numeric nullable | Cuota mensual calculada |

#### `budgets`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| category_id | UUID FK nullable | Solo para mostrar emoji/nombre |
| name | VARCHAR | Nombre libre del presupuesto |
| amount | Numeric(14,2) | Límite de gasto |
| start_date | Date | |
| end_date | Date | |
| is_recurring | Boolean | Default: false |
| frequency | VARCHAR nullable | `weekly` \| `biweekly` \| `monthly` |

> `spent` NO se almacena. Se calcula en tiempo real sumando transacciones con `budget_id = este_presupuesto`.

#### `goals`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| name | VARCHAR | |
| emoji | VARCHAR nullable | |
| target_amount | Numeric(14,2) | |
| saved_amount | Numeric(14,2) | Se actualiza al crear/eliminar transacciones con goal_id |
| deadline | Date nullable | |

### Lógica de negocio crítica

**Balance de cuenta:**
Al crear una transacción con `account_id`:
- `income` → `account.balance += amount`
- `expense` → `account.balance -= amount`

Al eliminar: operación inversa. Sin triggers SQL; está en `transaction_service.py`.

**Budget.spent (calculado):**
```python
spent = SUM(Transaction.amount
            WHERE budget_id = este_budget
            AND type = 'expense')
```
No tiene restricción de fechas — si el usuario etiqueta un gasto a un presupuesto, cuenta siempre.

**Goal.saved_amount (actualizado en cascada):**
Al crear ingreso con `goal_id` → `goal.saved_amount += amount`
Al eliminar ingreso con `goal_id` → `goal.saved_amount = max(0, saved_amount - amount)`

**Presupuesto recurrente (renew):**
`POST /budgets/{id}/renew` crea un nuevo presupuesto con las mismas propiedades y el siguiente período calculado según `frequency`.

---

## 7. API y servicios

### Endpoints completos

| Método | Ruta | Body / Params | Respuesta |
|--------|------|---------------|-----------|
| POST | `/auth/register` | `{email, full_name, password, use_default_categories}` | UserOut |
| POST | `/auth/login` | `{email, password}` | `{message}` + cookie |
| POST | `/auth/logout` | — | `{message}` |
| GET | `/auth/me` | — | UserOut |
| GET | `/dashboard` | — | DashboardOut |
| GET | `/accounts` | — | Account[] |
| POST | `/accounts` | `{name, bank?, balance, type}` | Account |
| PUT | `/accounts/{id}` | campos parciales | Account |
| DELETE | `/accounts/{id}` | — | 204 |
| GET | `/categories` | `?type=income\|expense` | Category[] |
| POST | `/categories` | `{name, emoji, color, type}` | Category |
| PUT | `/categories/{id}` | `{name?, emoji?, color?}` | Category |
| POST | `/categories/seed` | — | 204 (solo si no hay) |
| DELETE | `/categories/{id}` | — | 204 |
| GET | `/transactions` | `?start_date&end_date&limit` | Transaction[] |
| POST | `/transactions` | `{description, amount, type, date, category_id?, account_id?, budget_id?, goal_id?}` | Transaction |
| PUT | `/transactions/{id}` | campos parciales | Transaction |
| DELETE | `/transactions/{id}` | — | 204 |
| GET | `/budgets` | — | Budget[] (con spent calculado) |
| POST | `/budgets` | `{name, amount, start_date, end_date, category_id?, is_recurring, frequency?}` | Budget |
| PUT | `/budgets/{id}` | campos parciales | Budget |
| DELETE | `/budgets/{id}` | — | 204 |
| POST | `/budgets/{id}/renew` | — | Budget (nuevo período) |
| GET | `/goals` | — | Goal[] |
| POST | `/goals` | `{name, emoji?, target_amount, saved_amount?, deadline?}` | Goal |
| PUT | `/goals/{id}` | campos parciales | Goal |
| DELETE | `/goals/{id}` | — | 204 |
| GET | `/recurring` | — | RecurringTransaction[] |
| POST | `/recurring` | `{name, amount, type, frequency, next_date?, category_id?, account_id?, is_active}` | RecurringTransaction |
| PUT | `/recurring/{id}` | campos parciales | RecurringTransaction |
| DELETE | `/recurring/{id}` | — | 204 |
| POST | `/recurring/{id}/apply` | — | Transaction (la creada) |
| POST | `/ai/categorize` | `{description, amount}` | `{category_name, emoji, category_id}` |
| GET | `/ai/summary` | — | `{text}` |
| GET | `/ai/recommendations` | — | `{text}` |
| POST | `/ai/query` | `{query}` | `{text}` — consulta rápida, últimos 30 días |
| POST | `/ai/analyze` | `{query}` | `{text, chart, metrics}` — análisis profundo con SQL |

---

## 8. Sistema de IA

### Evolución del modelo

| Iteración | Modelo | Motivo del cambio |
|-----------|--------|-------------------|
| v1 | `gemma-3-4b-it` | Modelo inicial, open-source, free tier |
| v2 | `gemini-2.5-flash` | `gemma-3-4b-it` fue deprecado por Google (404 NOT_FOUND). `gemini-2.5-flash` fue el primer modelo que respondió correctamente en los tests |

> **Lección:** nunca hardcodear nombres de modelos de IA como constantes sin plan de actualización. El campo `GEMMA_MODEL` en `.env` fue la decisión correcta, pero aun así tomó tiempo detectar el problema porque el modelo no devolvía un error de autenticación sino un 404.

### Funciones de IA

#### 1. Auto-categorización (`/ai/categorize`)
- Recibe: descripción de la transacción + monto + lista de categorías del usuario
- Devuelve: categoría sugerida con ID (para preseleccionar en el formulario)
- Contexto enviado al modelo: ~200 tokens
- Usado en: formulario de nueva transacción (botón ✨)

#### 2. Resumen diario (`/ai/summary`)
- Recibe: balance total, ingresos/gastos del mes, presupuestos, metas
- Devuelve: 1-2 oraciones con datos concretos
- Comportamiento adaptativo: si no hay datos, sugiere qué registrar
- Usado en: Inicio (dashboard)

#### 3. Recomendaciones (`/ai/recommendations`)
- Recibe: ingresos, gastos, categorías top, presupuestos, metas
- Devuelve: exactamente 2 recomendaciones no obvias con números concretos
- Prompt con restricciones explícitas: prohibido dar consejos genéricos
- Usado en: Laboratorio IA (modal de Análisis)

#### 4. Consulta rápida (`/ai/query`)
- Recibe: pregunta en lenguaje natural + contexto de últimos 30 días (compacto)
- Devuelve: texto (2-3 oraciones)
- Usado en: Movimientos (input libre de IA) — respuesta ligera

#### 5. Análisis profundo (`/ai/analyze`) — el más poderoso
Antes de llamar al modelo, el backend corre **cálculos reales** en Python sobre la DB del usuario:

```
Datos que computa el backend:
├── Totales globales (6 meses): ingresos, gastos, tasa de ahorro
├── Desglose mensual: income/expense/savings por mes
├── Tendencia de gastos: regresión lineal simple → "en aumento / estable / en descenso"
├── Top categorías: por monto y por frecuencia
├── Patrones por día de semana: gasto promedio por día (Lun-Dom)
├── Estadísticas por transacción: mediana, desviación estándar, máximo
├── Gastos recurrentes: misma descripción más de 1 vez
├── Estado de presupuestos: spent calculado desde budget_id
└── Proyección de metas: based en transacciones con goal_id
```

Gemini recibe todos estos datos calculados y solo interpreta + formatea.

**Respuesta estructurada:**
```json
{
  "text": "Respuesta directa con números reales",
  "chart": {
    "type": "bar | line | pie",
    "title": "Título de la gráfica",
    "data": [{ "label": "...", "value": 1234 }]
  },
  "metrics": [{ "label": "nombre", "value": "$X o X%" }]
}
```

El frontend renderiza automáticamente la gráfica correspondiente usando Recharts.

---

## 9. Decisiones que cambiaron durante el desarrollo

### 9.1 Lógica de presupuestos: de categorías a etiquetado explícito

**Diseño original:**
`Budget.spent` = suma de todas las transacciones cuya `category_id` coincida con la del presupuesto, en el rango de fechas.

**Problema detectado:**
Si el usuario tiene dos presupuestos con la misma categoría (ej: "Mandado semanal" y "Mandado extra del mes"), ambos cuentan las mismas transacciones. El usuario no puede distinguir a qué presupuesto va cada gasto.

**Decisión tomada:**
Mover a etiquetado explícito: cada transacción tiene un `budget_id` opcional. `Budget.spent` = suma de transacciones con ese `budget_id`. El campo `category_id` en Budget se vuelve decorativo (solo para mostrar emoji).

**Impacto:**
- Se agregó `budget_id` y `goal_id` a `Transaction`
- El formulario de movimientos ahora muestra selectores opcionales de presupuesto/meta
- La sugerencia automática preselecciona el presupuesto que comparte categoría con la transacción
- Las transacciones viejas sin `budget_id` ya no cuentan en ningún presupuesto

**Lección:** el modelo de "presupuesto por categoría" funciona para casos simples pero falla cuando el usuario quiere granularidad. La solución fue diseñar para el caso difícil desde el inicio.

### 9.2 Goal.saved_amount: de manual a transaccional

**Diseño original:**
El usuario actualiza `saved_amount` manualmente con un input "Agregar ahorro".

**Problema detectado:**
El flujo de dinero real (la transacción que trae ese dinero) no quedaba registrado. El usuario debía registrar el ingreso Y además ir a la meta a actualizar el ahorro. Doble trabajo.

**Decisión tomada:**
Al registrar un ingreso, el usuario puede etiquetarlo a una meta. Automáticamente se suma a `goal.saved_amount`. Al eliminar ese ingreso, se resta.

**Impacto:**
- Se agregó `goal_id` a `Transaction`
- `transaction_service.create_transaction` ahora actualiza `goal.saved_amount` si hay `goal_id`
- El botón manual "Agregar ahorro" en Planificación se mantiene para casos donde el ahorro ya existía antes

### 9.3 Nombre "Panorama" → "Inicio"

**Problema:**
"Panorama" era el nombre de la página principal (`/panel`) Y había un modal llamado "Panorama General" en la sección de Análisis. El usuario no sabía a cuál se referían las instrucciones.

**Decisión:** Renombrar la página principal a "Inicio" en el sidebar. El modal en Análisis fue eventualmente eliminado en una reestructura posterior.

### 9.4 Reestructura de la sección Análisis (de 2 a 5 modales correctos)

**Historia:**

- **Versión 1:** Una sola página con 8 KPIs y 7 gráficas fijas. Sobrecargada, sin enfoque.
- **Versión 2:** 2 modales ("Resumen del período" y "Estadísticas de gasto"). Muchas métricas repetidas entre los dos.
- **Versión 3:** 5 modales (Panorama General, Flujo de Dinero, Análisis de Gastos, Metas & Presupuestos, Laboratorio IA). Mejor, pero Panorama duplicaba el dashboard de Inicio y Metas duplicaba Planificación.
- **Versión final:** 5 modales con preguntas únicas:
  - **Estadísticas** → ¿Qué pasó? (solo números)
  - **Flujo & Tendencias** → ¿Estoy mejorando? (gráficas temporales)
  - **Patrones** → ¿Cuándo y en qué gasto? (comportamiento)
  - **Seguimiento** → ¿Voy en camino? (vs presupuestos y metas, con proyección)
  - **Laboratorio IA** → ¿Por qué y qué si? (análisis profundo)

**Lección:** definir la "pregunta que responde cada sección" antes de diseñar el contenido evita duplicación. Cada modal debe tener una razón de ser única.

### 9.5 Balance Total no es suficiente como indicador de salud financiera

**Problema:** El "Balance Total" (suma de todas las cuentas) puede ser engañoso. Un usuario con $50,000 ahorrados pero que gasta $3,000 más de lo que gana cada mes se siente bien viendo ese número.

**Solución:** Agregar el "Flujo del mes" (ingresos − gastos del mes actual) como indicador secundario en la tarjeta de Balance Total, con badge verde si es positivo y rojo si es negativo. Los dos números juntos cuentan la historia completa: tienes $50k (patrimonio) pero este mes vas -$3k (flujo).

### 9.6 Categorías: de seed forzado a elección en el registro

**Diseño original:** Al registrar, siempre se crean las 18 categorías predeterminadas.

**Problema:** Un usuario que quiere categorías completamente propias no puede evitarlo. Tendría que eliminar 18 categorías una por una.

**Solución:** Paso 2 en el registro: elegir entre "Usar categorías predeterminadas" o "Empezar en blanco". El campo `use_default_categories: bool = True` en `UserCreate` controla si se hace el seed.

---

## 10. Problemas encontrados y cómo se resolvieron

### P1 — Modelo de IA deprecado en producción

**Problema:** `gemma-3-4b-it` retornaba `404 NOT_FOUND` en todos los endpoints de IA. No fue un error de autenticación sino de deprecación del modelo por Google.

**Diagnóstico:** El error se detectó al probar los endpoints directamente con curl. El mensaje decía `models/gemma-3-4b-it is not found for API version v1beta`.

**Solución:** Crear un script de prueba que itere sobre varios modelos para encontrar cuál funciona con la API key actual. `gemini-2.5-flash` fue el primero en responder correctamente. Actualizar `GEMMA_MODEL` en `.env`.

**Prevención futura:** Nunca hardcodear el nombre del modelo en el código. Siempre sacarlo de una variable de entorno para poder cambiarlo sin redeploy.

---

### P2 — `docker restart` no recarga `env_file`

**Problema:** Después de cambiar `GEMMA_MODEL` en `.env`, `docker restart monedge_backend` no aplicó el cambio. El contenedor seguía usando el valor anterior.

**Causa:** `docker restart` reutiliza el estado del contenedor existente. Las variables de `env_file` se leen solo al crear el contenedor.

**Solución:**
```bash
docker compose up -d --force-recreate backend
```

**Prevención futura:** Cuando se cambia un `env_file`, siempre usar `--force-recreate` en vez de `restart`.

---

### P3 — TypeScript: formulario sin los campos nuevos

**Problema:** Al agregar `budget_id` y `goal_id` a la interfaz `Transaction`, TypeScript lanzó errores en todos los lugares donde se populaba el estado del formulario, porque el objeto `EMPTY_FORM` y las funciones `openEdit`/`openEditRec` no incluían los nuevos campos.

**Solución:** Actualizar `EMPTY_FORM` con `budget_id: ""` y `goal_id: ""`, y actualizar todas las funciones que setean el formulario (`openEdit`, `openEditRec`, etc.).

**Lección:** al agregar campos a un tipo TypeScript que se usa en formularios, hay que buscar todos los lugares donde se crea un objeto de ese tipo. `tsc --noEmit` es esencial para detectarlos todos de una vez.

---

### P4 — `confirm()` nativo del navegador

**Problema:** Las funciones `handleDeleteBudget` y `handleDeleteGoal` en Planificación usaban `confirm()` nativo, violando el patrón visual de la app.

**Causa:** Fue un copy-paste de código rápido que no siguió el patrón establecido en Movimientos.

**Solución:** Reemplazar por el patrón de modal propio: estado `deleteTarget: { type, id, name } | null`, función `confirmDelete()` que llama a la API, y un modal con "Cancelar / Sí, eliminar".

**Prevención futura:** Definir desde el inicio el patrón de confirmación y documentarlo en CLAUDE.md.

---

### P5 — Dos presupuestos con la misma categoría contaban las mismas transacciones

**Problema:** Con el diseño original (budget.spent = SUM por category_id + rango de fechas), si el usuario tenía "Mandado mamá" y "Mandado semanal" ambos con categoría "Alimentación", ambos mostraban el mismo `spent`.

**Causa:** El modelo asumía que cada categoría solo tendría un presupuesto activo a la vez.

**Solución:** Cambiar a etiquetado explícito con `budget_id` en transacciones. Ver sección 9.1.

---

### P6 — Análisis con métricas repetidas entre modales

**Problema:** Los modales "Resumen del período" y "Estadísticas de gasto" compartían el promedio diario de gastos, la tendencia temporal y la distribución por categoría.

**Causa:** Se diseñaron los modales sin definir primero la pregunta que cada uno responde.

**Solución:** Reestructurar basando cada modal en una pregunta única (ver sección 9.4).

---

### P7 — Seed de categorías sin posibilidad de opt-out

**Problema:** El seed de 18 categorías en el registro era automático e ineludible. Un usuario que quería categorías personalizadas no podía evitarlo.

**Solución:** Agregar `use_default_categories: bool = True` al registro. Paso 2 en el flujo de registro permite elegir.

---

### P8 — `getTransactions` sin `budget_id` y `goal_id` en el cliente API

**Problema:** Al hacer la prueba de TypeScript después de agregar los nuevos campos, se descubrió que la función `updateTransaction` en el formulario de Movimientos no pasaba `budget_id` ni `goal_id`, por lo que editar una transacción con presupuesto/meta etiquetada los borraba silenciosamente.

**Solución:** Agregar los campos al payload de `updateTransaction` en el `handleSubmit` de Movimientos.

---

### P9 — Gráficas de Recharts no respetan clases CSS dark mode

**Problema:** Recharts renderiza SVG y no lee variables CSS ni clases de Tailwind para colores de grid, ticks y líneas.

**Solución:** Detectar dark mode con `MutationObserver` sobre `document.documentElement.classList` y pasar los colores como props directamente al componente en cada render.

```typescript
const gridColor   = isDark ? "#374151" : "#f3f4f6";
const tickColor   = isDark ? "#6b7280" : "#9ca3af";
const gastosColor = isDark ? "#93c5fd" : "#165BC5";
```

---

### P10 — Gemini retorna JSON con bloques de markdown

**Problema:** El endpoint `/ai/analyze` pide a Gemini que devuelva JSON puro, pero a veces lo envuelve en \`\`\`json ... \`\`\` de todas formas.

**Solución:** Aplicar limpieza defensiva antes de parsear:
```python
raw = re.sub(r'```(?:json)?\s*', '', raw).replace("```", "").strip()
match = re.search(r'\{.*\}', raw, re.DOTALL)
data = json.loads(match.group())
```

---

## 11. Lecciones aprendidas

### Sobre arquitectura

1. **Definir la pregunta antes de la pantalla.** Cada sección de una app de datos debe tener una pregunta que responde. Si no puedes escribirla en una oración, la sección está mal definida.

2. **El modelo de datos debe reflejar la intención del usuario, no la comodidad técnica.** El modelo "budget por categoría" era fácil de implementar pero no representaba cómo los usuarios piensan ("tengo un presupuesto para el mandado de la semana", no "tengo un presupuesto para la categoría Alimentación").

3. **Los campos calculados tienen un límite.** `Budget.spent` calculado dinámicamente es correcto mientras el cálculo sea simple. Si la lógica se vuelve compleja (múltiples fuentes, condiciones), considerar desnormalizar con cuidado.

### Sobre IA

4. **La IA es tan buena como el contexto que recibe.** Los primeros prompts de recomendaciones daban consejos genéricos porque el contexto era genérico. Al pasar datos SQL reales calculados en Python, las respuestas mejoraron drásticamente.

5. **Los modelos de IA cambian sin aviso.** Nunca asumir que el modelo configurado hoy estará disponible mañana. Mantener el nombre en variable de entorno y tener un plan de cambio.

6. **Pedir JSON estructurado a Gemini funciona, pero requiere limpieza defensiva.** Siempre sanear la respuesta antes de parsear.

### Sobre frontend

7. **TypeScript TypeScript TypeScript.** Cada vez que se agrega un campo a un tipo, `tsc --noEmit` antes de commitear salva tiempo. Los errores de tipo en runtime son más difíciles de depurar que los de compilación.

8. **Definir patrones de UI desde el inicio.** El problema de `confirm()` y el de modales inconsistentes se habrían evitado documentando el patrón de confirmación en CLAUDE.md desde el día 1.

9. **Los nombres importan.** "Panorama" causó confusión real en el equipo porque nombraba dos cosas distintas. Nombrar bien una vez es más barato que renombrar después.

### Sobre desarrollo en general

10. **Docker `restart` ≠ `force-recreate`.** Al cambiar variables de entorno en un `env_file`, siempre recrear el contenedor, no solo reiniciarlo.

11. **Los datos de prueba mienten.** Probar con un usuario que tiene 2 transacciones no revela problemas de presupuestos con muchas transacciones en la misma categoría. Los tests deben cubrir los casos límite del dominio del negocio.

---

*Documento generado como parte del proyecto ATE2 — UABC. Para actualizaciones técnicas detalladas, ver `DESARROLLO.md`, `FRONTEND.md` y `BACKEND.md`.*
