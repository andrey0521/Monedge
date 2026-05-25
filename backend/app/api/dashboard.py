from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.dashboard import DashboardOut
from app.services import account_service, budget_service, goal_service, transaction_service
from app.services.transaction_service import get_monthly_totals
from decimal import Decimal
from datetime import date
import calendar

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    income, expenses = await get_monthly_totals(db, current_user.id, today.year, today.month)
    accounts = await account_service.get_accounts(db, current_user.id)
    liquid_balance = sum(Decimal(str(a.balance)) for a in accounts if a.type != "credit")
    credit_debt    = sum(
        Decimal(str(a.credit_limit or 0)) - Decimal(str(a.balance))
        for a in accounts if a.type == "credit" and a.credit_limit is not None
    )
    total_balance = liquid_balance

    budgets = await budget_service.get_budgets(db, current_user.id)
    active_budgets = [b for b in budgets if b.start_date <= today <= b.end_date]

    last_day = calendar.monthrange(today.year, today.month)[1]
    remaining_days = max(last_day - today.day + 1, 1)

    # Promedio diario histórico (últimos 3 meses, excluyendo el actual)
    # Fecha de inicio: hace 3 meses
    m3 = today.month - 3
    y3 = today.year if m3 > 0 else today.year - 1
    m3 = m3 if m3 > 0 else m3 + 12
    hist_start = date(y3, m3, 1)
    hist_end = today.replace(day=1)  # excluye el mes actual

    hist_expense = await db.execute(
        select(func.sum(Transaction.amount))
        .where(Transaction.user_id == current_user.id, Transaction.type == "expense",
               Transaction.date >= hist_start, Transaction.date < hist_end)
    )
    hist_income = await db.execute(
        select(func.sum(Transaction.amount))
        .where(Transaction.user_id == current_user.id, Transaction.type == "income",
               Transaction.date >= hist_start, Transaction.date < hist_end)
    )
    hist_exp_total = Decimal(str(hist_expense.scalar() or 0))
    hist_inc_total = Decimal(str(hist_income.scalar() or 0))

    avg_daily_expense = hist_exp_total / Decimal("90") if hist_exp_total else Decimal("0")
    avg_monthly_income = hist_inc_total / Decimal("3") if hist_inc_total else income

    # Proyectar ingresos del mes: usar el mayor entre lo recibido y el promedio histórico
    # Esto evita que a mitad de mes (sin segunda quincena) el número sea irrisorio
    projected_income = max(income, avg_monthly_income)

    # Fórmula: (ingreso proyectado − gastos actuales − 20% ahorro) / días restantes
    savings_target = projected_income * Decimal("0.20")
    available = max(projected_income - expenses - savings_target, Decimal("0"))
    safe_daily = available / remaining_days

    recent_txs = await transaction_service.get_transactions(db, current_user.id, limit=30)
    goals = await goal_service.get_goals(db, current_user.id)

    # Top 5 cuentas por ingreso total recibido
    income_rows = await db.execute(
        select(Transaction.account_id, func.sum(Transaction.amount).label("total"))
        .where(Transaction.user_id == current_user.id, Transaction.type == "income",
               Transaction.account_id.isnot(None))
        .group_by(Transaction.account_id)
    )
    income_map = {row.account_id: Decimal(str(row.total)) for row in income_rows}
    top_accounts = sorted(accounts, key=lambda a: income_map.get(a.id, Decimal("0")), reverse=True)[:5]

    # Top 5 presupuestos más cercanos a completarse
    def budget_sort_key(b):
        pct = b.spent / b.amount if b.amount > 0 else Decimal("0")
        remaining = max(b.amount - b.spent, Decimal("0"))
        return (-pct, remaining)

    top_budgets = sorted(active_budgets if active_budgets else budgets, key=budget_sort_key)[:5]

    # Top 5 metas más cercanas a completarse (sin las ya completadas)
    def goal_sort_key(g):
        pct = Decimal(str(g.saved_amount)) / Decimal(str(g.target_amount)) if g.target_amount > 0 else Decimal("0")
        remaining = max(Decimal(str(g.target_amount)) - Decimal(str(g.saved_amount)), Decimal("0"))
        return (-pct, remaining)

    incomplete_goals = [g for g in goals if Decimal(str(g.saved_amount)) < Decimal(str(g.target_amount))]
    top_goals = sorted(incomplete_goals, key=goal_sort_key)[:5]

    return DashboardOut(
        total_balance=total_balance,
        credit_debt=credit_debt,
        monthly_income=income,
        monthly_expenses=expenses,
        safe_daily_budget=safe_daily,
        avg_daily_expense=avg_daily_expense,
        recent_transactions=recent_txs,
        accounts=top_accounts,
        budgets=top_budgets,
        goals=top_goals,
    )
