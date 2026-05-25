from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut, BudgetPeriod
from decimal import Decimal
from datetime import date, timedelta
import uuid

PERIOD_DAYS = {"weekly": 7, "biweekly": 14, "monthly": 28}
PERIOD_LABELS = {"weekly": "Semana", "biweekly": "Quincena", "monthly": "Mes"}


def _build_periods(budget: Budget) -> list[tuple[date, date, str]]:
    if not budget.frequency or budget.frequency not in PERIOD_DAYS:
        return [(budget.start_date, budget.end_date, "Total")]
    days = PERIOD_DAYS[budget.frequency]
    label = PERIOD_LABELS[budget.frequency]
    periods, current, i = [], budget.start_date, 1
    while current <= budget.end_date:
        end = min(current + timedelta(days=days - 1), budget.end_date)
        periods.append((current, end, f"{label} {i}"))
        current = end + timedelta(days=1)
        i += 1
    return periods


async def _with_spent(db: AsyncSession, budget: Budget, user_id: uuid.UUID) -> BudgetOut:
    today = date.today()
    raw_periods = _build_periods(budget)

    # Consulta de gastos por período en una sola query
    res = await db.execute(
        select(Transaction.date, Transaction.amount).where(
            Transaction.user_id == user_id,
            Transaction.budget_id == budget.id,
            Transaction.type == "expense",
        )
    )
    tx_rows = res.all()

    def spent_in(start: date, end: date) -> Decimal:
        return sum(
            (Decimal(str(row.amount)) for row in tx_rows if start <= row.date <= end),
            Decimal("0"),
        )

    periods: list[BudgetPeriod] = []
    for start, end, lbl in raw_periods:
        s = spent_in(start, end)
        periods.append(BudgetPeriod(
            label=lbl,
            start_date=start,
            end_date=end,
            spent=s,
            amount=Decimal(str(budget.amount)),
            is_current=start <= today <= end,
        ))

    total_spent = sum((p.spent for p in periods), Decimal("0"))
    total_budget = Decimal(str(budget.amount)) * len(periods)

    out = BudgetOut.model_validate(budget)
    out.spent = total_spent
    out.total_budget = total_budget
    out.periods = periods
    if budget.category:
        out.category_name = budget.category.name
        out.category_emoji = budget.category.emoji
    return out


async def get_budgets(db: AsyncSession, user_id: uuid.UUID) -> list[BudgetOut]:
    result = await db.execute(
        select(Budget)
        .options(joinedload(Budget.category))
        .where(Budget.user_id == user_id)
        .order_by(Budget.end_date.desc())
    )
    return [await _with_spent(db, b, user_id) for b in result.scalars().all()]


async def create_budget(db: AsyncSession, user_id: uuid.UUID, data: BudgetCreate) -> BudgetOut:
    b = Budget(id=uuid.uuid4(), user_id=user_id, **data.model_dump())
    db.add(b)
    await db.commit()
    result = await db.execute(
        select(Budget).options(joinedload(Budget.category)).where(Budget.id == b.id)
    )
    return await _with_spent(db, result.scalar_one(), user_id)


async def update_budget(
    db: AsyncSession, budget_id: uuid.UUID, user_id: uuid.UUID, data: BudgetUpdate
) -> BudgetOut | None:
    result = await db.execute(
        select(Budget)
        .options(joinedload(Budget.category))
        .where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    b = result.scalar_one_or_none()
    if not b:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(b, field, value)
    await db.commit()
    result2 = await db.execute(
        select(Budget).options(joinedload(Budget.category)).where(Budget.id == budget_id)
    )
    return await _with_spent(db, result2.scalar_one(), user_id)


async def delete_budget(db: AsyncSession, budget_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    b = result.scalar_one_or_none()
    if not b:
        return False
    await db.delete(b)
    await db.commit()
    return True


async def renew_budget(db: AsyncSession, budget_id: uuid.UUID, user_id: uuid.UUID) -> BudgetOut | None:
    result = await db.execute(
        select(Budget).options(joinedload(Budget.category))
        .where(Budget.id == budget_id, Budget.user_id == user_id)
    )
    b = result.scalar_one_or_none()
    if not b or not b.is_recurring or not b.frequency:
        return None

    days = PERIOD_DAYS.get(b.frequency)
    if not days:
        return None

    # Duración total del presupuesto original en días
    total_days = (b.end_date - b.start_date).days + 1
    new_start = b.end_date + timedelta(days=1)
    new_end = new_start + timedelta(days=total_days - 1)

    new_b = Budget(
        id=uuid.uuid4(),
        user_id=user_id,
        category_id=b.category_id,
        name=b.name,
        amount=b.amount,
        start_date=new_start,
        end_date=new_end,
        is_recurring=True,
        frequency=b.frequency,
    )
    db.add(new_b)
    await db.commit()
    result2 = await db.execute(
        select(Budget).options(joinedload(Budget.category)).where(Budget.id == new_b.id)
    )
    return await _with_spent(db, result2.scalar_one(), user_id)
