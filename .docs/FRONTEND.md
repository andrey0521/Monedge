# Monedge — Contexto Frontend

## Stack y versiones
- **Next.js 16.2.3** (App Router, `"use client"` en cada page con estado)
- **React 19.2.4**
- **TypeScript**
- **Tailwind CSS v4** — sin archivo de config; la customización usa `@theme inline` en `globals.css`
- **lucide-react ^1.8.0** — íconos
- **Recharts ^3.8.1** — gráficas (AreaChart, BarChart, PieChart, LineChart, etc.)
- Alias: `@/*` → `./app/*` (tsconfig)

## Estructura de archivos

```
frontend/app/
├── layout.tsx                  # Layout raíz: ThemeProvider + font-size: 115%
├── globals.css                 # @import tailwindcss; dark mode via .dark class
├── middleware.ts               # Protege /panel/*; redirige a /login si no hay cookie
├── page.tsx                    # Landing (/)
├── dashboard/page.tsx          # ← página legacy/huérfana, no usar (solo botón de logout)
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx       # 3 pasos: datos + contraseña → elegir categorías → agregar primera cuenta
├── panel/
│   ├── layout.tsx              # Sidebar + Header + panel de Settings (dark mode, alto contraste)
│   ├── page.tsx                # /panel → Inicio (dashboard)
│   ├── movimientos/page.tsx    # CRUD transacciones + CRUD recurrentes + filtros + ✨ autocategorización
│   ├── billetera/page.tsx      # CRUD cuentas (líquidas + crédito) + modal Abonar
│   ├── planificacion/page.tsx  # 2 tabs: Presupuestos + Metas (con contribute/withdraw)
│   ├── analisis/page.tsx       # Resumen mes + 3 cards → modales (Estadísticas, Patrones, Laboratorio IA)
│   └── categorias/page.tsx     # CRUD categorías + ✨ sugerencia de descripción con IA
└── lib/
    ├── types.ts                # Interfaces TS: User, Account, Category, Transaction, Budget, BudgetPeriod, Goal, RecurringTransaction, DashboardData
    ├── api.ts                  # Todas las llamadas al backend; URL base http://localhost:8000
    └── toast.tsx               # useToast hook + componente Toasts
```

## Dark mode
- Se activa/desactiva añadiendo/quitando la clase `dark` en `<html>` desde el panel de Settings (header)
- `globals.css` define: `@custom-variant dark (&:where(.dark, .dark *))`
- Detección dinámica en gráficas con MutationObserver sobre `document.documentElement.classList`
- Variables de color para Recharts en modo oscuro:
  - `gridColor`: `#374151` (dark) / `#f3f4f6` (light)
  - `tickColor`: `#6b7280` (dark) / `#9ca3af` (light)
  - `gastosStroke`: `#93c5fd` (dark, azul claro) / `#165BC5` (light, azul brand)
  - `ingressoStroke`: `#34d399` (siempre verde esmeralda)
  - `dotBg`: `#1e2433` (dark) / `#fff` (light) — fondo de los dots en AreaChart

## API client (`lib/api.ts`)
- Todas las requests van a `http://localhost:8000`
- Incluyen `credentials: "include"` para enviar la cookie JWT
- Una sola función `req<T>()` que lanza Error con `err.detail` si `!res.ok`
- Status 204 → devuelve `undefined`

## Interfaces TypeScript (`lib/types.ts`)

```ts
interface RecurringTransaction {
  id, name, amount, type, frequency, next_date, end_date,
  is_active, category_id, account_id, budget_id, goal_id,
  category_name, category_emoji, account_name
}
// ← Sin remaining_installments

interface Transaction {
  id, account_id, category_id, budget_id, goal_id,
  amount, type ("income"|"expense"|"transfer"), description,
  date, created_at, category_name, category_emoji, account_name
}
// ← Sin installment_months ni monthly_amount

interface BudgetPeriod {
  label, start_date, end_date, spent, amount, is_current
}

interface Budget {
  id, category_id, name,
  amount,        // monto por período
  spent,         // gasto total de todos los períodos
  total_budget,  // amount × número de períodos
  start_date, end_date, is_recurring, frequency,
  category_name, category_emoji, periods: BudgetPeriod[]
}

interface Category {
  id, name, emoji, color, is_default, type, description?
}
```

## Patrones de componentes

### Páginas con formulario + tabla (movimientos, billetera, planificacion, categorias)
```
Estado: items[], showForm, form, editing, saving
Modal: fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4
  └── div.bg-white.dark:bg-[#1e2433].rounded-2xl.shadow-2xl.w-full.max-w-md
```

### Modal de eliminación
- Estado: `deleteTarget: { id, label } | null`
- `handleDelete(id)` → setea `deleteTarget` (no llama `confirm()`)
- `confirmDelete()` → llama a la API, luego `setDeleteTarget(null)`
- Modal propio: `fixed inset-0 bg-black/50 z-50` con botones Cancelar / Sí, eliminar

### Toast notifications (`lib/toast.tsx`)
```tsx
const { toast, toasts } = useToast();
toast("Mensaje de éxito");
toast("Error", "error");
<Toasts items={toasts} />
```

### Clases CSS reutilizables
```
INPUT_CLS = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30"
SELECT_CLS = INPUT_CLS (mismo)
```

### Colores de marca
- Azul principal: `#165BC5` / hover: `#0B3EA1`
- Verde ingresos/positivo: `#34d399` (emerald-400)
- Rojo gastos/negativo: `#ef4444`
- Fondo cards: `bg-white dark:bg-[#1e2433]`
- Fondo formularios/inputs: `dark:bg-[#252d3d]`

## Panel Layout (`panel/layout.tsx`)
- Sidebar colapsable (localStorage `sidebarCollapsed`), `--sb-w` CSS var controla el margen del contenido
- Dark mode toggle + alto contraste toggle → clases `dark`/`contrast` en `<html>` + localStorage
- Header con fecha actual y botón de Settings (dropdown)
- Settings dropdown: perfil del usuario, dark mode toggle, alto contraste toggle, link a Categorías, botón Cerrar sesión
- **No tiene banner de cuotas próximas** (fue eliminado)
- 5 ítems de navegación: Inicio, Movimientos, Billetera, Planificación, Análisis

### Flujo de cierre de sesión
1. Usuario hace clic en "Cerrar sesión" en el Settings dropdown del header
2. `handleLogout()` llama a `logout()` → `POST /auth/logout`
3. El backend ejecuta `response.delete_cookie("access_token")` → elimina la cookie HttpOnly
4. El frontend hace `router.push("/login")`
5. `middleware.ts` bloquea cualquier acceso futuro a `/panel/*` al no encontrar la cookie

> **Nota:** El localStorage (preferencias de dark mode, sidebar, sesiones del Laboratorio IA) **no se limpia** al cerrar sesión — persiste para la próxima vez que el mismo usuario inicie sesión en ese navegador.

## Página de Inicio (`panel/page.tsx`)
- Carga `getDashboard()` → muestra datos; si hay actividad también carga `aiSummary()`
- **4 KPIs**: "Ingresos del Mes", "Gastos del Mes", "Balance del Mes" (ingresos − gastos del mes, con badge Ahorrando/Déficit), "Puedes gastar hoy" (safe_daily_budget con badge ▲/▼ vs promedio histórico)
- El balance total aparece como "Total en cuentas" en el footer de la tarjeta de Cuentas, no como KPI propio
- **Alertas contextuales** (condicionales, debajo de los KPIs): tarjeta de presupuesto en riesgo si `usedPct >= 70%` + tarjeta de meta más cercana a completarse
- Layout de 3 columnas: Últimos movimientos | Cuentas (top 5 por ingreso) | Presupuestos + Metas (stack vertical)
- Últimas 30 transacciones con scroll

## Página de Billetera (`panel/billetera/page.tsx`)
- CRUD de cuentas (checking, savings, cash, credit)
- Cuentas de crédito: muestra crédito disponible + límite + barra de deuda (`debt = credit_limit - balance`)
- Cuentas líquidas: balance con signo — `fmtSigned(n)` muestra negativo en rojo
- Resumen: "Balance líquido" (suma de cuentas no-crédito) + "Deuda pendiente en crédito"
- Botón **Abonar** en tarjetas de crédito → modal con preview de deuda post-abono
  - Llama a `payCredit(creditId, fromAccountId, amount)` → `POST /accounts/{id}/pay`
- Formulario: campo `credit_limit` aparece solo cuando `type === "credit"`
- **Excepción**: el botón Eliminar cuenta usa `confirm()` nativo (no sigue el patrón de modal propio)

## Página de Movimientos (`movimientos/page.tsx`)
- Carga inicial: últimos 30 días; botón "Cargar más" (+31 días hacia atrás por llamada)
- **Tabla unificada**: transacciones regulares + recurrentes activos (badge Semanal/Quincenal/Mensual)
- KPIs de los movimientos filtrados: ingresos, gastos, balance (calculados en cliente)
- **Filtros** (panel lateral colapsable, `w-56`, sticky):
  - Búsqueda por descripción o categoría (input de texto global)
  - Tipo: Todos / Gastos / Ingresos
  - Categoría: select
  - Rango de fechas: desde / hasta; atajos "Este mes", "Mes ant.", "Hace 2 meses"
  - Rango de monto: mín / máx
  - Badge con contador de filtros activos; botón "Limpiar" cuando hay filtros
- **Formulario (modal)** incluye:
  - Toggle "Recurrente" → muestra selector de frecuencia y tipo de fin (`open` sin límite o `date` con `end_date`)
  - Selectores de Cuenta, Categoría (filtrada por tipo), Presupuesto, Meta
  - Botón ✨ → `aiCategorize(description, amount)` → selecciona categoría automáticamente
- **Modal `payTarget`** existe en el código pero **nunca se dispara** desde la UI actual; `handleApply` llama `doApply(rec.id, undefined)` directamente sin modal (código muerto del banner que fue eliminado)
- Eliminación usa modal propio (NO `confirm()`)
- `goal_id` en formulario de transacción regular siempre se envía como `null`; no afecta `goal.saved_amount`. Solo `contributeGoal` y recurrentes con `goal_id` lo actualizan
- **No tiene** sección de IA en lenguaje natural (eso está en Análisis → Laboratorio IA)

## Página de Planificación (`planificacion/page.tsx`)
- **2 tabs**: Presupuestos | Metas (los recurrentes viven en Movimientos)
- **Presupuestos**:
  - Barra total: azul (<70%), amber (70-99%), rojo (≥100%) según `pct(spent, total_budget)`
  - Si tiene `periods` y `frequency`, muestra también el progreso del período actual (`currentPeriod`)
  - Botón "Historial" aparece cuando hay presupuestos vencidos
  - Card de detalle (`detailBudget`) muestra todos los períodos con sus gastos individuales
  - Botón "Renovar" → `renewBudget(id)` → crea nuevo presupuesto con fecha corrida
- **Metas**:
  - Barra azul de progreso
  - Botón "Mover fondos" → modal con toggle Aportar / Retirar + selector de cuenta
  - Llama a `contributeGoal(id, accountId, amount)` o `withdrawGoal(id, accountId, amount)`
  - Botón "Historial" para metas completadas

## Página de Análisis (`analisis/page.tsx`)
- Carga: `getTransactions({ limit: 500 })` + `getDashboard()` + `getBudgets()` + `getGoals()` + `getRecurring()` + `getCategories()`
- Selector de período temporal (chips: 15d, 1m, 3m, 6m, 1y, personalizado) — mínimo 15 días para "personalizado"
- **Resumen del mes actual** (siempre visible): balance neto, tasa de ahorro, día pico de gasto, categoría top, peor presupuesto, distribución top-3 por % de gasto
- **3 cards visibles** que abren modales:
  - **Estadísticas** → KPIs del período, promedios, comparativa vs período anterior, tasa de ahorro, volatilidad, desglose mensual (BarChart agrupado), donut de categorías
  - **Patrones** → distribución por categoría (barras), distribución semanal (heatmap por día), comparativa ingresos vs gastos (BarChart)
  - **Laboratorio IA** → chat con múltiples sesiones guardadas en `localStorage` por día (se reinician a medianoche); botón "✨ Recomendaciones" llama a `aiRecommendations()` y puede crear presupuestos/metas directo desde la respuesta; `aiAnalyze(query, history)` → texto + chart Recharts + métricas; pills de sugerencias rápidas
- **2 modales ocultos** con `{false && ...}` (código intacto):
  - **Calendario financiero** — gastos por día del mes + eventos de recurrentes/presupuestos
  - **Seguimiento** — presupuestos vs real + proyección de metas

## Página de Categorías (`panel/categorias/page.tsx`)
- CRUD de categorías (nombre, emoji, color, tipo income/expense, descripción)
- Botón ✨ en el formulario → `aiSuggestCategoryDescription(name, emoji, type)` → rellena el campo descripción
- Accesible desde el panel de Settings en el header

## Formateo de dinero
```ts
fmt(n)       = "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
               // $10,000 (en-US con coma como separador de miles)
fmtSigned(n) = "-$10,000" o "$10,000" según signo de n
fmtK(n)      = abrevia: "$10k" para miles, "$1.2M" para millones
```
