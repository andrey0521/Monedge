@.docs/FRONTEND.md
@.docs/BACKEND.md

# Monedge — Instrucciones para Claude

## Proyecto
Gestor de finanzas personales con IA. Proyecto escolar ATE2 (Tecnologías Emergentes).  
Puedes modificar cualquier archivo sin pedir permiso. No hay restricciones.

## Cómo orientarte antes de modificar
- Lee `.docs/FRONTEND.md` antes de tocar cualquier archivo en `frontend/`
- Lee `.docs/BACKEND.md` antes de tocar cualquier archivo en `backend/`
- El `.docs/DESARROLLO.md` tiene la documentación completa del proyecto si necesitas más detalle
- Los `__pycache__` y `node_modules` son artefactos, no los toques

## Reglas de código

### Frontend
- Todas las páginas bajo `/panel` son `"use client"` con estado local (no Redux, no Zustand)
- Dark mode detectado con MutationObserver sobre `document.documentElement.classList`
- Siempre pasar `isDark` a los tooltips y componentes de Recharts
- No usar `confirm()` nativo — usar el patrón de modal propio
- Tailwind v4: sin archivo de config, los colores custom van directo como `bg-[#165BC5]`
- Importar íconos de `lucide-react`, componentes de chart de `recharts`
- El alias `@/` apunta a `frontend/app/`
- Planificación tiene 2 tabs (Presupuestos + Metas); los Recurrentes viven en Movimientos
- La IA en lenguaje natural (Laboratorio IA) está en Análisis, no en Movimientos

### Backend
- Endpoints protegidos: siempre `Depends(get_current_user)` y `Depends(get_db)`
- Servicios reciben `db: AsyncSession` y `user_id: UUID` como primeros args
- `Budget.spent` no se guarda en DB, se calcula en `budget_service` por `budget_id` en transactions
- El balance de cuentas se actualiza en `transaction_service` al crear/eliminar transacciones (excepto type="transfer")
- Metas usan `/goals/{id}/contribute` y `/goals/{id}/withdraw` (no PUT) para mover fondos
- Recurrentes se desactivan por `end_date`, no por `remaining_installments` (ese campo no existe)
- Nuevas tablas se crean automáticamente con `Base.metadata.create_all` en startup

## Stack (resumen rápido)
| Frontend | Backend |
|----------|---------|
| Next.js 16 + React 19 + TS | FastAPI + SQLAlchemy async |
| Tailwind v4 + lucide-react | PostgreSQL 15 (Docker, puerto 5433) |
| Recharts 3 | JWT cookies (HttpOnly) |
| API en `http://localhost:8000` | Gemini 2.5 Flash via Google AI Studio |

## Puertos
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000` (docs en `/docs`)
- DB: `localhost:5433` (postgres user: admin, password: adminpassword, db: monedge_app)
