from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.goal import Goal
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.goal import GoalCreate, GoalUpdate
from decimal import Decimal
from datetime import date
import uuid


async def get_goals(db: AsyncSession, user_id: uuid.UUID) -> list[Goal]:
    result = await db.execute(select(Goal).where(Goal.user_id == user_id))
    return result.scalars().all()


async def create_goal(db: AsyncSession, user_id: uuid.UUID, data: GoalCreate) -> Goal:
    g = Goal(id=uuid.uuid4(), user_id=user_id, **data.model_dump())
    db.add(g)
    await db.commit()
    await db.refresh(g)
    return g


async def update_goal(
    db: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID, data: GoalUpdate
) -> Goal | None:
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
    )
    g = result.scalar_one_or_none()
    if not g:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(g, field, value)
    await db.commit()
    await db.refresh(g)
    return g


async def contribute_goal(
    db: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID,
    account_id: uuid.UUID, amount: Decimal,
) -> Goal | None:
    from fastapi import HTTPException
    g_res = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    g = g_res.scalar_one_or_none()
    if not g:
        return None
    a_res = await db.execute(select(Account).where(Account.id == account_id, Account.user_id == user_id))
    acc = a_res.scalar_one_or_none()
    if not acc:
        return None
    if acc.type != "credit" and Decimal(str(acc.balance)) - amount < 0:
        raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta seleccionada")
    g.saved_amount = Decimal(str(g.saved_amount)) + amount
    acc.balance = Decimal(str(acc.balance)) - amount
    tx = Transaction(
        id=uuid.uuid4(), user_id=user_id, account_id=account_id, goal_id=goal_id,
        amount=amount, type="transfer", date=date.today(),
        description=f"Aporte → {g.name}",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(g)
    return g


async def withdraw_goal(
    db: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID,
    account_id: uuid.UUID, amount: Decimal,
) -> Goal | None:
    g_res = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    g = g_res.scalar_one_or_none()
    if not g:
        return None
    a_res = await db.execute(select(Account).where(Account.id == account_id, Account.user_id == user_id))
    acc = a_res.scalar_one_or_none()
    if not acc:
        return None
    if amount > Decimal(str(g.saved_amount)):
        raise HTTPException(status_code=400, detail="El monto supera lo ahorrado en la meta")
    g.saved_amount = Decimal(str(g.saved_amount)) - amount
    acc.balance = Decimal(str(acc.balance)) + amount
    tx = Transaction(
        id=uuid.uuid4(), user_id=user_id, account_id=account_id, goal_id=goal_id,
        amount=amount, type="transfer", date=date.today(),
        description=f"Retiro ← {g.name}",
    )
    db.add(tx)
    await db.commit()
    await db.refresh(g)
    return g


async def delete_goal(db: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
    )
    g = result.scalar_one_or_none()
    if not g:
        return False
    await db.delete(g)
    await db.commit()
    return True
