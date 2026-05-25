# Monedge — Documentación de desarrollo

Gestor de finanzas personales con IA. Proyecto escolar ATE2 (Tecnologías Emergentes).

---

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | FastAPI + SQLAlchemy async | Python 3.12+ |
| Base de datos | PostgreSQL 15 (Docker, puerto 5433 en host) | — |
| Autenticación | JWT en cookie HttpOnly (HS256) | — |
| IA | Google AI Studio → `gemini-2.5-flash` | SDK `google-genai` |
| Frontend | Next.js + React + TypeScript | 16.2.3 / 19.2.4 |
| Estilos | Tailwind CSS v4 + lucide-react | v4 / ^1.8.0 |
| Gráficas | Recharts | ^3.8.1 |

## Puertos

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 (docs: /docs) |
| PostgreSQL | localhost:5433 — user: admin / pass: adminpassword / db: monedge_app |

---

## Estructura de archivos

```
Monedge/
├── docker-compose.yml
├── seed_data.py              ← seed vía API (crea usuario, limpia y regenera datos)
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── seed_demo.py          ← seed directo a DB (datos fijos, más detallado)
│   └── app/
│       ├── main.py           ← FastAPI app, CORS, routers, startup CREATE TABLE + ALTER
│       ├── core/
│       │   ├── config.py     ← Settings (DATABASE_URL, SECRET_KEY, GOOGLE_AI_API_KEY, ANALYZE_THINKING_BUDGET…)
│       │   ├── database.py   ← engine async + Base + get_db
│       │   ├── security.py   ← hash_password, verify_password, create_token, decode_token
│       │   └── deps.py       ← get_current_user: lee cookie → JWT → User
│       ├── models/           ← SQLAlchemy ORM
│       ├── schemas/          ← Pydantic *Create / *Update / *Out
│       ├── services/         ← lógica de negocio async
│       └── api/              ← routers FastAPI
└── frontend/app/
    ├── layout.tsx            ← root layout: ThemeProvider + font-size 115%
    ├── globals.css           ← @import tailwindcss; dark mode via .dark class
    ├── middleware.ts         ← protege /panel/*; redirige a /login sin cookie
    ├── dashboard/page.tsx    ← página legacy (solo botón logout), NO usar
    ├── lib/
    │   ├── types.ts          ← interfaces TS de todos los modelos
    │   ├── api.ts            ← funciones de fetch hacia localhost:8000
    │   └── toast.tsx         ← useToast hook + componente Toasts
    └── panel/
        ├── layout.tsx        ← Sidebar + Header + Settings panel
        ├── page.tsx          ← Inicio / Dashboard
        ├── billetera/        ← Cuentas
        ├── movimientos/      ← Transacciones + Recurrentes
        ├── planificacion/    ← Presupuestos + Metas (2 tabs)
        ├── analisis/         ← Gráficas, KPIs, Laboratorio IA
        └── categorias/       ← CRUD categorías con IA
```

---

## Modelos de base de datos

### User
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| email | String unique | |
| full_name | String | |
| hashed_password | String | bcrypt |
| is_active | Boolean | default True |

### Account
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| name | String | |
| bank | String nullable | |
| balance | Decimal(14,2) | para crédito = disponible restante |
| credit_limit | Decimal(14,2) nullable | solo type="credit" |
| type | String | `checking` \| `savings` \| `cash` \| `credit` |

### Category
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK nullable | null = categoría global |
| name | String | |
| emoji | String nullable | |
| color | String nullable | |
| is_default | Boolean | |
| type | String | `income` \| `expense` |
| description | String nullable | texto explicativo; se puede auto-generar con IA |

14 categorías default al registrarse: 9 expense + 5 income, cada una con descripción.

### Transaction
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| account_id | UUID FK nullable | al crear/eliminar → actualiza account.balance (excepto type="transfer") |
| category_id | UUID FK nullable | |
| budget_id | UUID FK nullable | ON DELETE SET NULL |
| goal_id | UUID FK nullable | ON DELETE SET NULL |
| amount | Decimal(14,2) | siempre positivo |
| type | String | `income` \| `expense` \| `transfer` |
| description | String | |
| date | Date | |
| created_at | DateTime | |

> **No existen** campos `installment_months`, `monthly_amount` ni `remaining_installments`.

### Budget
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| category_id | UUID FK nullable | solo decorativo (emoji/nombre en UI) |
| name | String | |
| amount | Decimal(14,2) | monto por período (NO total) |
| start_date / end_date | Date | rango del presupuesto completo |
| is_recurring | Boolean | default False |
| frequency | String nullable | `weekly` \| `biweekly` \| `monthly` |

**`spent` no se almacena** — se calcula en `budget_service` sumando transacciones que tienen `budget_id = este_budget`. El `category_id` del presupuesto no influye en el cálculo.

**`BudgetOut`** incluye campos adicionales calculados:
- `spent`: suma total de gastos de todos los períodos
- `total_budget`: `amount × número_de_períodos`
- `periods`: lista de `BudgetPeriod` (label, start/end_date, spent, amount, is_current)

### Goal
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| name | String | |
| emoji | String default "🎯" | |
| target_amount | Decimal(14,2) | |
| saved_amount | Decimal(14,2) | default 0 |
| deadline | Date nullable | |

**Flujo de aporte/retiro**: se usa `POST /goals/{id}/contribute` y `POST /goals/{id}/withdraw` (no `PUT /goals/{id}`). Ambos crean una Transaction de tipo `"transfer"` y ajustan el balance de la cuenta.

### RecurringTransaction
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| account_id | UUID FK nullable | cuenta por defecto al aplicar |
| category_id | UUID FK nullable | |
| budget_id | UUID FK nullable | ON DELETE SET NULL |
| goal_id | UUID FK nullable | ON DELETE SET NULL |
| name | String | |
| amount | Decimal(14,2) | |
| type | String | `income` \| `expense` |
| frequency | String | `weekly` \| `biweekly` \| `monthly` |
| next_date | Date nullable | |
| end_date | Date nullable | si se define, al superarlo `is_active = False` |
| is_active | Boolean | False cuando next_date supera end_date |

> **No existe** campo `remaining_installments`.

---

## API — todos los endpoints

### Auth `/auth`
| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | `/auth/register` | `{email, full_name, password, use_default_categories?}` | UserOut |
| POST | `/auth/login` | `{email, password}` | `{message}` + cookie JWT |
| POST | `/auth/logout` | — | `{message}` |
| GET | `/auth/me` | — | UserOut |
| GET | `/auth/google` | — | `{url}` — URL de inicio OAuth Google |
| GET | `/auth/google/callback` | `?code=` | `{message}` + cookie — flujo OAuth, no usado en frontend |

### Accounts `/accounts`
| Método | Ruta | Body/Params | Respuesta |
|--------|------|-------------|-----------|
| GET | `/accounts` | — | Account[] |
| POST | `/accounts` | `{name, bank?, balance, type, credit_limit?}` | Account |
| PUT | `/accounts/{id}` | campos parciales | Account |
| DELETE | `/accounts/{id}` | — | 204 |
| POST | `/accounts/{id}/pay` | `{from_account_id, amount}` | Account[] (liquid + credit) |

El endpoint `/pay` deduce `amount` de la cuenta líquida y lo suma a la disponible del crédito.

### Categories `/categories`
| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/categories?type=income\|expense` | Category[] |
| POST | `/categories` — `{name, emoji?, color?, type, description?}` | Category |
| PUT | `/categories/{id}` — `{name?, emoji?, color?, description?}` | Category |
| DELETE | `/categories/{id}` | 204 |
| POST | `/categories/seed` | 204 (solo si no hay categorías) |

### Transactions `/transactions`
| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/transactions?start_date&end_date&limit` | Transaction[] |
| POST | `/transactions` | Transaction |
| PUT | `/transactions/{id}` | Transaction |
| DELETE | `/transactions/{id}` | 204 |

Al crear: actualiza `account.balance` (income += amount, expense -= amount, transfer = sin cambio).
Al eliminar: operación inversa (excepto transfers).
Al actualizar: revierte efecto anterior, aplica nuevo.

### Budgets `/budgets`
| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/budgets` | BudgetOut[] (con `spent`, `total_budget`, `periods` calculados) |
| POST | `/budgets` | BudgetOut |
| PUT | `/budgets/{id}` | BudgetOut |
| DELETE | `/budgets/{id}` | 204 |
| POST | `/budgets/{id}/renew` | BudgetOut (nuevo período calculado según frequency) |

### Goals `/goals`
| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/goals` | Goal[] |
| POST | `/goals` | Goal |
| PUT | `/goals/{id}` | Goal (edita campos, no mueve fondos) |
| DELETE | `/goals/{id}` | 204 |
| POST | `/goals/{id}/contribute` — `{account_id, amount}` | Goal actualizado |
| POST | `/goals/{id}/withdraw` — `{account_id, amount}` | Goal actualizado |

### Recurring `/recurring`
| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/recurring` | RecurringTransactionOut[] |
| POST | `/recurring` | RecurringTransactionOut |
| PUT | `/recurring/{id}` | RecurringTransactionOut |
| DELETE | `/recurring/{id}` | 204 |
| POST | `/recurring/{id}/apply` — `{payment_account_id?}` | Transaction creada |

`apply`: crea la transacción, avanza `next_date` y si `next_date > end_date` → `is_active = False`.
`payment_account_id`: cuenta desde donde se paga (distinta a `rec.account_id`); útil para pagar cuotas de crédito desde una cuenta líquida.

### AI `/ai`
| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | `/ai/categorize` | `{description, amount}` | `{category_name, emoji, category_id}` |
| GET | `/ai/summary` | — | `{text}` |
| GET | `/ai/recommendations` | — | `{text, actions}` |
| POST | `/ai/query` | `{query}` | `{text}` — responde sobre últimos 30 días |
| POST | `/ai/analyze` | `{query, history?}` | `{text, chart, metrics}` — SQL real + Gemini |
| POST | `/ai/suggest-category-description` | `{name, emoji?, type}` | `{description}` |

### Dashboard `/dashboard`
GET `/dashboard` — devuelve:
```
total_balance, credit_debt, monthly_income, monthly_expenses,
safe_daily_budget, avg_daily_expense,
recent_transactions (30),
accounts (top 5 por ingreso histórico),
budgets (top 5 activos más cerca de agotarse),
goals (top 5 más cerca de completarse, sin las ya completadas)
```

**Cálculo de `safe_daily_budget`:**
```
projected_income = max(ingresos_mes_actual, promedio_mensual_3_meses_anteriores)
savings_target   = projected_income × 0.20
available        = max(projected_income − gastos_mes − savings_target, 0)
safe_daily       = available / días_restantes_del_mes
```

---

## Lógica de negocio clave

### Balance de cuentas
No hay triggers SQL. `transaction_service` actualiza `account.balance` al crear/eliminar/editar transacciones.
- income → `balance += amount`
- expense → `balance -= amount`
- transfer → sin cambio automático (ajuste ya hecho por el servicio que la genera)

### Budget.spent (calculado)
```python
spent = SUM(Transaction.amount
            WHERE budget_id = este_budget
            AND type = 'expense')
```
El `category_id` del Budget NO afecta el cálculo; solo sirve para mostrar emoji/nombre.

### Recurring apply
1. Crea Transaction con los datos del recurrente, date=hoy; `account_id = payment_account_id ?? rec.account_id`
2. Si se paga desde cuenta distinta a crédito: la tx descuenta del líquido y se abona al crédito
3. Si tipo income con `goal_id`: auto-contribuye a la meta (`goal.saved_amount += amount`, `account.balance -= amount`)
4. Avanza `next_date`: +7d (weekly), +14d (biweekly), mismo día mes siguiente (monthly)
5. Si `end_date` definida y nuevo `next_date > end_date` → `is_active = False`

### Goal contribute/withdraw
- Ambos crean una Transaction tipo `"transfer"` (no afecta el balance de forma duplicada)
- `contribute`: valida saldo suficiente (excepto crédito), descuenta de cuenta y suma a meta
- `withdraw`: valida que amount ≤ saved_amount, suma a cuenta y descuenta de meta

### Pago de crédito (`/accounts/{id}/pay`)
- `liquid.balance -= amount`
- `credit.balance += amount` (más disponible = menos deuda)

---

## Servicios

| Archivo | Funciones |
|---------|-----------|
| `user_service.py` | `get_user_by_email`, `create_user` |
| `account_service.py` | CRUD + `pay_credit` |
| `category_service.py` | CRUD + `seed_default_categories` (14 categorías con descriptions) |
| `transaction_service.py` | CRUD + `get_monthly_totals` |
| `budget_service.py` | CRUD + `renew_budget` (con `spent`, `total_budget`, `periods` calculados en GET) |
| `goal_service.py` | CRUD + `contribute_goal` + `withdraw_goal` |
| `recurring_service.py` | CRUD + `apply_recurring(db, rec_id, user_id, payment_account_id?)` |
| `ai_service.py` | `categorize_transaction`, `generate_summary`, `generate_recommendations`, `query_finances`, `analyze_query`, `suggest_category_description` |

---

## Frontend — páginas

### Panel Layout (`panel/layout.tsx`)
- Sidebar colapsable (localStorage `sidebarCollapsed`); CSS var `--sb-w` controla el margen del contenido
- Dark mode + alto contraste (clase `contrast`) → localStorage + clase en `<html>`
- Settings dropdown en el header: perfil, toggles, link a Categorías, logout
- **Sin banner de cuotas próximas**

### Inicio (`panel/page.tsx`)
- Carga `getDashboard()` + `aiSummary()` (solo si hay actividad)
- 4 KPIs: Ingresos del Mes, Gastos del Mes, Balance del Mes (ingresos − gastos con badge Ahorrando/Déficit), Puedes gastar hoy (con ▲/▼ vs promedio histórico)
- Alertas contextuales debajo de KPIs: presupuesto en riesgo (≥70%) y/o meta más cercana
- Layout 3 columnas: Últimos movimientos | Cuentas (top 5 + total en footer) | Presupuestos + Metas (stack)

### Billetera (`panel/billetera/page.tsx`)
- CRUD de cuentas; eliminar usa `confirm()` nativo (excepción al patrón general)
- Tarjetas de crédito: disponible + límite + barra de deuda
- Modal **Abonar** → `payCredit`
- Resumen: balance líquido + deuda pendiente en crédito

### Movimientos (`panel/movimientos/page.tsx`)
- Carga inicial últimos 30 días; paginación hacia atrás (+30d por clic) con contador de movimientos
- Tabla unificada: transacciones + recurrentes activos; transfers se muestran en morado
- KPIs de la vista filtrada (calculados en cliente): ingresos, gastos, balance
- Filtros en sidebar lateral colapsable `w-56` sticky; búsqueda global siempre visible en header
- Formulario con toggle Recurrente → selector `recFrequency` + `recEndType` (open sin límite / date + campo end_date)
- Al seleccionar categoría expense → auto-preselecciona presupuesto activo con esa categoría (badge "Sugerido")
- Botón ✨ → `aiCategorize` → auto-selecciona categoría
- `goal_id` del formulario se envía siempre como `null`; no afecta `goal.saved_amount`
- Modal `payTarget` existe pero nunca se dispara desde la UI (código muerto)
- **Sin IA en lenguaje natural** (esa funcionalidad está en Análisis → Laboratorio IA)

### Planificación (`panel/planificacion/page.tsx`)
- **2 tabs**: Presupuestos | Metas
- Presupuestos: muestra progreso total y del período actual; historial de períodos vencidos; botón Renovar
- Metas: modal "Mover fondos" con toggle Aportar/Retirar → `contributeGoal` / `withdrawGoal`

### Análisis (`panel/analisis/page.tsx`)
- Selector de período temporal (chips: 15d, 1m, 3m, 6m, 1y, personalizado)
- **Resumen del mes actual** siempre visible (balance neto, tasa de ahorro, día pico, categoría top, peor presupuesto)
- 3 cards de entrada: **Estadísticas** | **Patrones** | **Laboratorio IA**
- Laboratorio IA: múltiples sesiones guardadas en localStorage por día (se reinician a medianoche); botón "Recomendaciones" llama a `aiRecommendations()` con acciones inline para crear presupuestos/metas; `aiAnalyze(query, history)` → texto + chart + métricas
- 2 modales ocultos (`{false && ...}`): Calendario financiero + Seguimiento

### Categorías (`panel/categorias/page.tsx`)
- CRUD: nombre, emoji, tipo, descripción
- Botón ✨ → `aiSuggestCategoryDescription` → rellena campo descripción

---

## Patrones de código

### Endpoint protegido (backend)
```python
@router.get("", response_model=list[ModelOut])
async def list_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await model_service.get_items(db, current_user.id)
```

### Modal de eliminación (frontend)
```tsx
// Estado
const [deleteTarget, setDeleteTarget] = useState<{id:string;label:string}|null>(null);
// Trigger
<button onClick={() => setDeleteTarget({id, label})}>Eliminar</button>
// Modal con botones Cancelar / Confirmar
```

### Clases reutilizables (frontend)
```
INPUT_CLS  = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 ..."
SELECT_CLS = INPUT_CLS
```

### Formateo de dinero
```ts
fmt(n)       → "$10,000"   (Math.abs, separador en-US)
fmtSigned(n) → "-$10,000" o "$10,000" (con signo)
fmtK(n)      → "$10k" o "$1.2M"
```

---

## Variables de entorno

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://admin:adminpassword@db:5432/monedge_app
SECRET_KEY=clave_secreta_larga
FRONTEND_URL=http://localhost:3000
GOOGLE_AI_API_KEY=          # aistudio.google.com → Get API key
GEMMA_MODEL=gemini-2.5-flash
ANALYZE_THINKING_BUDGET=8000  # 0 desactiva thinking en /ai/analyze
```

---

## Scripts de seed

### `seed_data.py` (raíz del proyecto) — recomendado para testing
```bash
python seed_data.py                                      # demo@monedge.dev / demo1234
python seed_data.py --email tu@email.com --password pw  # credenciales custom
python seed_data.py --months 3                          # menos meses de historia
```
- Crea el usuario si no existe; limpia datos anteriores antes de generar
- Solo cuentas líquidas (BBVA Débito + Nu Ahorro), sin crédito
- Ingresos quincenales > gastos (cap 60% del ingreso mensual); balance siempre positivo

### `backend/seed_demo.py` — datos fijos detallados
```bash
cd backend && python seed_demo.py [email] [password]
```
- BBVA, Efectivo, CETES, Amex Oro con crédito
- 4 meses de transacciones reales; recurrentes activos de ejemplo
- Limpia datos anteriores antes de insertar

---

## Agregar funcionalidad nueva

### Nuevo endpoint backend
1. Si es entidad nueva: modelo en `models/`, schema en `schemas/`, servicio en `services/`
2. Router en `api/nuevo.py` con prefijo `/nuevo`
3. Registrar en `main.py`: `app.include_router(nuevo_router)`
4. El modelo hereda de `Base`; startup ya hace `metadata.create_all`

### Nueva página frontend
1. Crear `frontend/app/panel/nueva/page.tsx` con `"use client"`
2. Estado local con `useState`, dark mode con MutationObserver
3. Agregar link en `panel/layout.tsx` → `menuItems`
4. Ruta ya protegida por `middleware.ts` (cubre `/panel/*`)
