# Monedge — Contexto Backend

## Stack y versiones
- **FastAPI** con **SQLAlchemy async** (AsyncSession)
- **PostgreSQL 17** (Docker, puerto 5433 en host, 5432 en container)
- **Pydantic v2** (`pydantic-settings` para config)
- **JWT** en cookie HttpOnly (`access_token`), algoritmo HS256
- **Google AI Studio** SDK `google-genai`, modelo `gemini-2.5-flash` (configurable)
- Python **3.12+**

## Estructura de archivos

```
backend/app/
├── main.py                  # FastAPI app, CORS, routers, startup (CREATE TABLE + ALTER)
├── core/
│   ├── config.py            # Settings: DATABASE_URL, SECRET_KEY, FRONTEND_URL, GOOGLE_AI_API_KEY, GEMMA_MODEL, ANALYZE_THINKING_BUDGET
│   ├── database.py          # engine async + Base + get_db (AsyncSession)
│   ├── security.py          # hash_password, verify_password, create_token, decode_token
│   └── deps.py              # get_current_user: lee cookie → JWT → User
├── models/                  # SQLAlchemy ORM (uno por tabla)
│   ├── user.py
│   ├── account.py
│   ├── category.py
│   ├── transaction.py       # balance de cuenta se actualiza en transaction_service
│   ├── budget.py            # spent NO se almacena, se calcula en budget_service
│   ├── goal.py
│   └── recurring_transaction.py
├── schemas/                 # Pydantic: *Create, *Update, *Out
│   ├── user.py, account.py, category.py, transaction.py
│   ├── budget.py, goal.py, dashboard.py, recurring_transaction.py
├── services/               # Lógica de negocio (async)
│   ├── user_service.py
│   ├── account_service.py  # CRUD + pay_credit
│   ├── category_service.py # seed de 14 categorías por defecto (con descriptions)
│   ├── transaction_service.py  # get_monthly_totals(db, user_id, year, month)
│   ├── budget_service.py   # spent = SUM(tx.amount WHERE budget_id=este_budget AND type='expense')
│   ├── goal_service.py     # CRUD + contribute_goal + withdraw_goal
│   ├── recurring_service.py  # CRUD + apply: crea tx + avanza next_date; se desactiva por end_date
│   └── ai_service.py       # Gemini: categorize, summary, recommendations, query_finances, analyze_query, suggest_category_description
└── api/                    # Routers (prefijos y tags)
    ├── auth.py             # /auth
    ├── accounts.py         # /accounts + POST /{id}/pay
    ├── categories.py       # /categories (filtro ?type=income|expense)
    ├── transactions.py     # /transactions (filtros: start_date, end_date, limit)
    ├── budgets.py          # /budgets + POST /{id}/renew
    ├── goals.py            # /goals + POST /{id}/contribute + POST /{id}/withdraw
    ├── recurring.py        # /recurring + POST /{id}/apply
    ├── dashboard.py        # /dashboard
    └── ai.py              # /ai/categorize, /ai/summary, /ai/recommendations, /ai/query, /ai/analyze, /ai/suggest-category-description
```

## Patrones de endpoint

```python
@router.get("", response_model=list[ModelOut])
async def list_items(
    current_user: User = Depends(get_current_user),  # ← auth siempre
    db: AsyncSession = Depends(get_db),
):
    return await model_service.get_items(db, current_user.id)
```

- Todos los endpoints protegidos usan `Depends(get_current_user)`
- Los servicios reciben `db` y `user_id` como primeros argumentos
- DELETE → status_code=204, devuelve None
- Si no encontrado → `raise HTTPException(404, "...")`

## Modelos (campos clave)

| Modelo | Campos importantes |
|--------|-------------------|
| User | id, email, full_name, hashed_password, is_active |
| Account | id, user_id, name, bank, balance (Numeric), type (`checking\|savings\|cash\|credit`), credit_limit (Numeric nullable — solo crédito) |
| Category | id, user_id (nullable=global), name, emoji, color, is_default, type (`income\|expense`), **description** (nullable) |
| Transaction | id, user_id, account_id, category_id, **budget_id** (nullable), **goal_id** (nullable), amount (Numeric), type (`income\|expense\|transfer`), description, date, created_at |
| Budget | id, user_id, category_id, name, amount (monto por período), start_date, end_date, **is_recurring** (bool), **frequency** (nullable) — **SIN campo spent** |
| Goal | id, user_id, name, emoji, target_amount, saved_amount, deadline (nullable) |
| RecurringTransaction | id, user_id, account_id, category_id, **budget_id** (nullable), **goal_id** (nullable), name, amount, type, frequency (`weekly\|biweekly\|monthly`), next_date, **end_date** (nullable), is_active |

> **Nota:** No existen campos `remaining_installments`, `installment_months` ni `monthly_amount` en ningún modelo.

## Lógica de negocio clave

### Balance de cuenta
Al crear una tx: si `account_id` y `type != "transfer"` → sumar (income) o restar (expense) del `Account.balance`.
Al eliminar una tx: operación inversa. Al editar: revierte efecto anterior, aplica nuevo.
No hay trigger SQL; está en `transaction_service`. Las transferencias internas (tipo `"transfer"`) no modifican balance automáticamente porque el ajuste ya se hizo en el servicio que las genera.

### Budget.spent (calculado, no guardado)
```python
spent = SUM(Transaction.amount WHERE budget_id = este_budget AND type = 'expense')
```
Se calcula en cada `GET /budgets`. Al crear una transacción con `budget_id`, ese gasto queda vinculado directamente al presupuesto sin depender de categoría o rango de fechas.

### BudgetOut — campos calculados
`BudgetOut` incluye campos adicionales calculados en `budget_service`:
- `spent`: suma total de gastos en todos los períodos
- `total_budget`: `amount × número_de_períodos`
- `periods`: lista de `BudgetPeriod` (label, start_date, end_date, spent, amount, is_current)

Si el presupuesto tiene `frequency`, se divide en sub-períodos (weekly=7d, biweekly=14d, monthly=28d) y cada uno muestra su gasto independiente.

### Goal — aporte y retiro
`POST /goals/{id}/contribute` con `{account_id, amount}`:
- Valida saldo suficiente (excepto cuentas de crédito)
- `goal.saved_amount += amount`
- `account.balance -= amount`
- Crea Transaction tipo `"transfer"` con description `"Aporte → {nombre}"`

`POST /goals/{id}/withdraw` con `{account_id, amount}`:
- Valida que no supere `goal.saved_amount`
- `goal.saved_amount -= amount`
- `account.balance += amount`
- Crea Transaction tipo `"transfer"` con description `"Retiro ← {nombre}"`

### Recurring apply
`POST /recurring/{id}/apply` con body opcional `{payment_account_id}`:
1. Crea Transaction con name, amount, type, category_id del recurrente; `account_id = payment_account_id ?? rec.account_id`
2. Si `payment_account_id` es distinto a `rec.account_id` y la cuenta original es crédito → abona al crédito (`credit.balance += amount`)
3. Si tipo income y tiene `goal_id` → `goal.saved_amount += amount` y `account.balance -= amount` (auto-contribución)
4. Avanza `next_date`: +7d (weekly), +14d (biweekly), mismo día mes siguiente (monthly)
5. Si `end_date` definida y el nuevo `next_date > end_date` → `is_active = False`

### Pago de crédito (`/accounts/{id}/pay`)
`POST /accounts/{credit_id}/pay` con `{from_account_id, amount}`:
- `liquid.balance -= amount`
- `credit.balance += amount` (más disponible = menos deuda)

### AI service
- `categorize_transaction(description, amount, categories_list)` → `{category_id, category_name, emoji}`
- `generate_summary(context_dict)` → texto 1-2 oraciones
- `generate_recommendations(context_dict)` → `{text, actions}` (actions puede incluir presupuesto/meta a crear)
- `query_finances(context_dict)` → texto 2-3 oraciones (consulta sobre últimos 30 días)
- `analyze_query(db, user_id, query, history)` → `{text, chart: {type, title, data[]}, metrics[]}` — corre SQL real antes de llamar a Gemini; acepta historial de chat previo (últimos 4 mensajes)
- `suggest_category_description(name, emoji, type_str)` → texto corto descriptivo para una categoría

## Todos los endpoints

| Método | Ruta | Body/Params | Respuesta |
|--------|------|-------------|-----------|
| POST | `/auth/register` | `{email, full_name, password, use_default_categories?}` | UserOut |
| POST | `/auth/login` | `{email, password}` | `{message}` + cookie |
| POST | `/auth/logout` | — | `{message}` — ejecuta `response.delete_cookie("access_token")` |
| GET | `/auth/me` | — | UserOut |
| GET | `/auth/google` | — | `{url}` — URL de OAuth de Google |
| GET | `/auth/google/callback` | `?code=` | `{message}` + cookie — solo backend, el frontend redirige |
| GET | `/dashboard` | — | DashboardOut |
| GET | `/accounts` | — | Account[] |
| POST | `/accounts` | `{name, bank?, balance, type, credit_limit?}` | Account |
| PUT | `/accounts/{id}` | campos parciales | Account |
| DELETE | `/accounts/{id}` | — | 204 |
| POST | `/accounts/{id}/pay` | `{from_account_id, amount}` | Account[] (liquid + credit actualizados) |
| GET | `/categories` | `?type=income\|expense` | Category[] |
| POST | `/categories` | `{name, emoji, color, type, description?}` | Category |
| PUT | `/categories/{id}` | `{name?, emoji?, color?, description?}` | Category |
| POST | `/categories/seed` | — | 204 (solo si no hay categorías) |
| DELETE | `/categories/{id}` | — | 204 |
| GET | `/transactions` | `?start_date&end_date&limit` | Transaction[] |
| POST | `/transactions` | `{description, amount, type, date, category_id?, account_id?, budget_id?, goal_id?}` | Transaction |
| PUT | `/transactions/{id}` | campos parciales | Transaction |
| DELETE | `/transactions/{id}` | — | 204 |
| GET | `/budgets` | — | BudgetOut[] (con spent, total_budget, periods calculados) |
| POST | `/budgets` | `{name, amount, start_date, end_date, category_id?, is_recurring?, frequency?}` | BudgetOut |
| PUT | `/budgets/{id}` | campos parciales | BudgetOut |
| DELETE | `/budgets/{id}` | — | 204 |
| POST | `/budgets/{id}/renew` | — | BudgetOut (nuevo período calculado según frequency) |
| GET | `/goals` | — | Goal[] |
| POST | `/goals` | `{name, emoji?, target_amount, saved_amount?, deadline?}` | Goal |
| PUT | `/goals/{id}` | campos parciales | Goal |
| DELETE | `/goals/{id}` | — | 204 |
| POST | `/goals/{id}/contribute` | `{account_id, amount}` | Goal (con saved_amount actualizado) |
| POST | `/goals/{id}/withdraw` | `{account_id, amount}` | Goal (con saved_amount actualizado) |
| GET | `/recurring` | — | RecurringTransactionOut[] |
| POST | `/recurring` | `{name, amount, type, frequency, next_date?, end_date?, category_id?, account_id?, budget_id?, goal_id?, is_active}` | RecurringTransactionOut |
| PUT | `/recurring/{id}` | campos parciales | RecurringTransactionOut |
| DELETE | `/recurring/{id}` | — | 204 |
| POST | `/recurring/{id}/apply` | `{payment_account_id?}` | Transaction (la creada) |
| POST | `/ai/categorize` | `{description, amount}` | `{category_name, emoji, category_id}` |
| GET | `/ai/summary` | — | `{text}` |
| GET | `/ai/recommendations` | — | `{text, actions}` |
| POST | `/ai/query` | `{query}` | `{text}` — consulta rápida sobre últimos 30 días |
| POST | `/ai/analyze` | `{query, history?}` | `{text, chart, metrics}` — análisis profundo con SQL real |
| POST | `/ai/suggest-category-description` | `{name, emoji?, type}` | `{description}` — texto corto para categoría |

## DashboardOut shape
```python
total_balance: Decimal      # solo balance de cuentas líquidas (no crédito)
credit_debt: Decimal        # suma de (credit_limit - balance) por tarjeta
monthly_income: Decimal
monthly_expenses: Decimal
safe_daily_budget: Decimal  # (projected_income - gastos - 20% ahorro) / días_restantes
avg_daily_expense: Decimal  # promedio diario de gastos de los últimos 3 meses (excluyendo mes actual)
recent_transactions: list[TransactionOut]  # últimas 30
accounts: list[AccountOut]  # top 5 por ingreso histórico total
budgets: list[BudgetOut]    # top 5 más cerca de agotarse (activos o todos si no hay activos)
goals: list[GoalOut]        # top 5 más cerca de completarse (excluye ya completadas)
```

**Cálculo de `safe_daily_budget`:**
```python
projected_income = max(income_mes_actual, avg_monthly_income_3_meses)
savings_target   = projected_income × 0.20
available        = max(projected_income − gastos_mes − savings_target, 0)
safe_daily       = available / días_restantes_del_mes
```

## Variables de entorno (backend/.env)
```env
DATABASE_URL=postgresql+asyncpg://admin:adminpassword@db:5432/monedge_app
SECRET_KEY=clave_secreta_larga
FRONTEND_URL=http://localhost:3000
GOOGLE_AI_API_KEY=          # aistudio.google.com → Get API key
GEMMA_MODEL=gemini-2.5-flash
ANALYZE_THINKING_BUDGET=8000  # tokens de pensamiento para /ai/analyze (0 = desactivado)
```

## Agregar un endpoint nuevo (patrón a seguir)
1. Si es una entidad nueva: crear modelo en `models/`, schema en `schemas/`, servicio en `services/`
2. Crear router en `api/nuevo.py` con prefijo `/nuevo`
3. Registrar en `main.py`: `app.include_router(nuevo_router)`
4. El modelo hereda de `Base`; las relaciones usan `relationship()` y `back_populates`
5. El startup en `main.py` ya hace `Base.metadata.create_all` → crea la tabla automáticamente

## Categorías por defecto (seed)
14 categorías creadas al registrarse si `use_default_categories=True` (default). Cada categoría tiene `description` con una explicación concisa de qué transacciones incluye.
- **Gastos (9):** Alimentación🍽️, Transporte🚗, Vivienda🏠, Salud🏥, Entretenimiento🎬, Educación📚, Ropa👗, Servicios💡, Otros gastos📦
- **Ingresos (5):** Salario💼, Freelance💻, Inversiones📈, Negocio🏪, Otros ingresos💰
