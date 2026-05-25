from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.accounts import router as accounts_router
from app.api.categories import router as categories_router
from app.api.transactions import router as transactions_router
from app.api.budgets import router as budgets_router
from app.api.goals import router as goals_router
from app.api.ai import router as ai_router
from app.api.dashboard import router as dashboard_router
from app.api.recurring import router as recurring_router
from app.core.config import settings
from app.core.database import Base, engine
from sqlalchemy import text
import app.models

app = FastAPI(title="Monedge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(ai_router)
app.include_router(dashboard_router)
app.include_router(recurring_router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'expense'"
        ))
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL"
        ))
        await conn.execute(text(
            "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL"
        ))
        await conn.execute(text(
            "ALTER TABLE budgets ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await conn.execute(text(
            "ALTER TABLE budgets ADD COLUMN IF NOT EXISTS frequency VARCHAR"
        ))
