from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.account import Account
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid


async def _enrich(tx: Transaction) -> TransactionOut:
    out = TransactionOut.model_validate(tx)
    if tx.category:
        out.category_name = tx.category.name
        out.category_emoji = tx.category.emoji
    if tx.account:
        out.account_name = tx.account.name
    return out


async def get_transactions(
    db: AsyncSession,
    user_id: uuid.UUID,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
) -> list[TransactionOut]:
    q = (
        select(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.account))
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.date.desc(), Transaction.created_at.desc())
        .limit(limit)
    )
    if start_date:
        q = q.where(Transaction.date >= start_date)
    if end_date:
        q = q.where(Transaction.date <= end_date)
    result = await db.execute(q)
    txs = result.scalars().all()
    return [await _enrich(tx) for tx in txs]


async def create_transaction(
    db: AsyncSession, user_id: uuid.UUID, data: TransactionCreate
) -> TransactionOut:
    tx = Transaction(id=uuid.uuid4(), user_id=user_id, **data.model_dump())
    db.add(tx)

    # update account balance (transfers ya vienen con balance ajustado desde goal_service)
    if data.account_id and data.type != "transfer":
        res = await db.execute(select(Account).where(Account.id == data.account_id))
        acc = res.scalar_one_or_none()
        if acc:
            delta = data.amount if data.type == "income" else -data.amount
            acc.balance = Decimal(str(acc.balance)) + delta

    await db.commit()
    await db.refresh(tx)

    # reload with relationships
    result = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.account))
        .where(Transaction.id == tx.id)
    )
    return await _enrich(result.scalar_one())


async def update_transaction(
    db: AsyncSession, tx_id: uuid.UUID, user_id: uuid.UUID, data: TransactionUpdate
) -> TransactionOut | None:
    result = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.account))
        .where(Transaction.id == tx_id, Transaction.user_id == user_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        return None

    old_account_id = tx.account_id
    old_amount = Decimal(str(tx.amount))
    old_type = tx.type

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tx, field, value)

    new_account_id = tx.account_id
    new_amount = Decimal(str(tx.amount))
    new_type = tx.type

    # Revert old effect on old account
    if old_account_id:
        res = await db.execute(select(Account).where(Account.id == old_account_id))
        old_acc = res.scalar_one_or_none()
        if old_acc:
            revert = -old_amount if old_type == "income" else old_amount
            old_acc.balance = Decimal(str(old_acc.balance)) + revert

    # Apply new effect on new account (may be a different account)
    if new_account_id:
        if new_account_id == old_account_id:
            new_acc = old_acc
        else:
            res = await db.execute(select(Account).where(Account.id == new_account_id))
            new_acc = res.scalar_one_or_none()
        if new_acc:
            delta = new_amount if new_type == "income" else -new_amount
            new_acc.balance = Decimal(str(new_acc.balance)) + delta

    await db.commit()
    await db.refresh(tx)
    result2 = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.category), joinedload(Transaction.account))
        .where(Transaction.id == tx_id)
    )
    return await _enrich(result2.scalar_one())


async def delete_transaction(
    db: AsyncSession, tx_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.account))
        .where(Transaction.id == tx_id, Transaction.user_id == user_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        return False

    # Reverse account balance (no revertir transfers — el balance ya fue ajustado por goal_service)
    if tx.account_id and tx.account and tx.type != "transfer":
        acc = tx.account
        delta = -tx.amount if tx.type == "income" else tx.amount
        acc.balance = Decimal(str(acc.balance)) + delta

    await db.delete(tx)
    await db.commit()
    return True


async def get_monthly_totals(
    db: AsyncSession, user_id: uuid.UUID, year: int, month: int
) -> tuple[Decimal, Decimal]:
    start = date(year, month, 1)
    import calendar
    last_day = calendar.monthrange(year, month)[1]
    end = date(year, month, last_day)

    income_q = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == "income",
            Transaction.date >= start,
            Transaction.date <= end,
        )
    )
    expense_q = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= start,
            Transaction.date <= end,
        )
    )
    income = income_q.scalar() or Decimal("0")
    expenses = expense_q.scalar() or Decimal("0")
    return Decimal(str(income)), Decimal(str(expenses))
