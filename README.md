# Monedge

Gestor de finanzas personales con inteligencia artificial. Proyecto escolar ATE2 — Tecnologías Emergentes, UABC.

---

## ¿Qué es?

Monedge permite registrar ingresos y gastos, organizar cuentas, definir presupuestos por categoría y establecer metas de ahorro. Un asistente de IA (Gemini 2.5 Flash) analiza los datos del usuario y genera resúmenes, recomendaciones y responde preguntas en lenguaje natural sobre sus finanzas.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + lucide-react + Recharts |
| Backend | FastAPI + SQLAlchemy async (Python 3.12+) |
| Base de datos | PostgreSQL 17 |
| Autenticación | JWT en cookie HttpOnly (HS256) |
| IA | Google AI Studio — `gemini-2.5-flash` |
| Infraestructura | Docker + Docker Compose |

---

## Funcionalidades

- **Movimientos** — CRUD de transacciones con filtros por tipo, categoría, fecha y monto. Autocategorización con IA.
- **Transacciones recurrentes** — gastos/ingresos periódicos (semanal, quincenal, mensual) con fecha de fin opcional.
- **Billetera** — cuentas líquidas y de crédito. Modal de abono a tarjeta de crédito.
- **Presupuestos** — por categoría con períodos y frecuencia. Renovación automática.
- **Metas de ahorro** — aportar y retirar fondos desde cualquier cuenta.
- **Análisis** — estadísticas del período, patrones de gasto (por categoría, día de semana, histograma), comparativa vs período anterior.
- **Laboratorio IA** — chat multi-sesión con Gemini, corre SQL real sobre los datos del usuario, genera gráficas Recharts dinámicas y puede crear presupuestos/metas directamente desde la respuesta.
- **Categorías** — CRUD con sugerencia de descripción por IA.
- **Dark mode** + alto contraste.

---

## Requisitos

- Docker y Docker Compose
- API key de [Google AI Studio](https://aistudio.google.com/) para las funciones de IA

---

## Instalación y uso

### 1. Clonar el repositorio

```bash
git clone git@github.com:andrey0521/Monedge.git
cd Monedge
```

### 2. Configurar variables de entorno del backend

```bash
cp backend/.env.example backend/.env
# Edita backend/.env y agrega tu GOOGLE_AI_API_KEY
```

### 3. Levantar con Docker Compose

```bash
docker compose up --build
```

Esto levanta tres servicios:

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend + docs Swagger | http://localhost:8000 / http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

### 4. (Opcional) Cargar datos de prueba

```bash
# Desde la raíz del proyecto, con los contenedores corriendo:
python seed_data.py
```

---

## Estructura del proyecto

```
Monedge/
├── docker-compose.yml
├── seed_data.py               # seed vía API REST
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── seed_demo.py           # seed directo a DB
│   └── app/
│       ├── main.py            # FastAPI app, CORS, routers, startup
│       ├── core/              # config, database, security, deps
│       ├── models/            # SQLAlchemy ORM
│       ├── schemas/           # Pydantic (Create / Update / Out)
│       ├── services/          # lógica de negocio async
│       └── api/               # routers (auth, accounts, transactions, budgets, goals, ai…)
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── app/
        ├── globals.css        # Tailwind v4, dark mode, animaciones
        ├── middleware.ts      # protege /panel/* sin cookie
        ├── lib/               # types.ts, api.ts, toast.tsx
        └── panel/
            ├── layout.tsx     # sidebar + header
            ├── page.tsx       # dashboard/inicio
            ├── movimientos/
            ├── billetera/
            ├── planificacion/
            ├── analisis/
            └── categorias/
```

---

## Variables de entorno (backend/.env)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión asyncpg a PostgreSQL |
| `SECRET_KEY` | Clave para firmar los JWT |
| `FRONTEND_URL` | URL del frontend (CORS) |
| `GOOGLE_AI_API_KEY` | API key de Google AI Studio |
| `GEMMA_MODEL` | Modelo a usar (por defecto `gemini-2.5-flash`) |
| `ANALYZE_THINKING_BUDGET` | Tokens de pensamiento para `/ai/analyze` (0 = desactivado) |
| `GOOGLE_CLIENT_ID` | (Opcional) Para OAuth con Google |
| `GOOGLE_CLIENT_SECRET` | (Opcional) Para OAuth con Google |

---

## Documentación adicional

- [`.docs/DESARROLLO.md`](.docs/DESARROLLO.md) — modelos de DB, lógica de negocio, todos los endpoints
- [`.docs/FRONTEND.md`](.docs/FRONTEND.md) — patrones de componentes, dark mode, API client
- [`.docs/BACKEND.md`](.docs/BACKEND.md) — stack, estructura, servicios, patrones de endpoint
- [`.docs/DOCUMENTACION.md`](.docs/DOCUMENTACION.md) — documentación completa del proyecto (investigación, UX, decisiones)

---

## Equipo

Proyecto escolar — ATE2, UABC 2025.
