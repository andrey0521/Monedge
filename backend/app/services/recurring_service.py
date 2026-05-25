from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionOut,
)
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import create_transaction
from app.models.account import Account
from app.models.goal import Goal
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional
import uuid
import calendar


def _enrich(rec: RecurringTransaction) -> RecurringTransactionOut:
    out = RecurringTransactionOut.model_validate(rec)
    if rec.category:
        out.category_name = rec.category.name
        out.category_emoji = rec.category.emoji
    if rec.account:
        out.account_name = rec.account.name
    return out


def _next_date(from_date: date, frequency: str) -> date:
    if frequency == "weekly":
        return from_date + timedelta(weeks=1)
    elif frequency == "biweekly":
        return from_date + timedelta(weeks=2)
    else:  # monthly
        month = from_date.month + 1 if from_date.month < 12 else 1
        year = from_date.year if from_date.month < 12 else from_date.year + 1
        day = min(from_date.day, calendar.monthrange(year, month)[1])
        return from_date.replace(year=year, month=month, day=day)


async def get_recurring(db: AsyncSession, user_id: uuid.UUID) -> list[RecurringTransactionOut]:
    result = await db.execute(
        select(RecurringTransaction)
        .options(joinedload(RecurringTransaction.category), joinedload(RecurringTransaction.account))
        .where(RecurringTransaction.user_id == user_id)
        .order_by(RecurringTransaction.next_date.asc().nullslast())
    )
    return [_enrich(r) for r in result.scalars().all()]


async def create_recurring(
    db: AsyncSession, user_id: uuid.UUID, data: RecurringTransactionCreate
) -> RecurringTransactionOut:
    rec = RecurringTransaction(id=uuid.uuid4(), user_id=user_id, **data.model_dump())
    db.add(rec)
    await db.commit()
    result = await db.execute(
        select(RecurringTransaction)
        .options(joinedload(RecurringTransaction.category), joinedload(RecurringTransaction.account))
        .where(RecurringTransaction.id == rec.id)
    )
    return _enrich(result.scalar_one())


async def update_recurring(
    db: AsyncSession, rec_id: uuid.UUID, user_id: uuid.UUID, data: RecurringTransactionUpdate
) -> Optional[RecurringTransactionOut]:
    result = await db.execute(
        select(RecurringTransaction)
        .options(joinedload(RecurringTransaction.category), joinedload(RecurringTransaction.account))
        .where(RecurringTransaction.id == rec_id, RecurringTransaction.user_id == user_id)
    )
    rec = result.scalar_one_or_none()
    if not rec:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rec, field, value)
    await db.commit()
    result2 = await db.execute(
        select(RecurringTransaction)
        .options(joinedload(RecurringTransaction.category), joinedload(RecurringTransaction.account))
        .where(RecurringTransaction.id == rec_id)
    )
    return _enrich(result2.scalar_one())


async def delete_recurring(
    db: AsyncSession, rec_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(RecurringTransaction).where(
            RecurringTransaction.id == rec_id, RecurringTransaction.user_id == user_id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        return False
    await db.delete(rec)
    await db.commit()
    return True


async def apply_recurring(
    db: AsyncSession, rec_id: uuid.UUID, user_id: uuid.UUID,
    payment_account_id: uuid.UUID | None = None,
):
    result = await db.execute(
        select(RecurringTransaction).where(
            RecurringTransaction.id == rec_id, RecurringTransaction.user_id == user_id
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        return None

    effective_account_id = payment_account_id or rec.account_id

    tx = await create_transaction(
        db,
        user_id,
        TransactionCreate(
            account_id=effective_account_id,
            category_id=rec.category_id,
            budget_id=rec.budget_id if rec.type == "expense" else None,
            goal_id=rec.goal_id if rec.type == "income" else None,
            amount=Decimal(str(rec.amount)),
            type=rec.type,
            description=rec.name,
            date=date.today(),
        ),
    )

    # Si se pagó desde una cuenta líquida distinta al crédito:
    # create_transaction ya descontó del líquido; solo hay que abonar al crédito.
    if payment_account_id and rec.account_id and payment_account_id != rec.account_id:
        credit_res = await db.execute(select(Account).where(Account.id == rec.account_id))
        credit_acc = credit_res.scalar_one_or_none()
        if credit_acc and credit_acc.type == "credit":
            credit_acc.balance = Decimal(str(credit_acc.balance)) + Decimal(str(rec.amount))

    # Ingreso vinculado a meta: auto-contribuir (dinero entra a cuenta y va directo a la meta)
    if rec.type == "income" and rec.goal_id and effective_account_id:
        g_res = await db.execute(select(Goal).where(Goal.id == rec.goal_id))
        goal = g_res.scalar_one_or_none()
        acc_res = await db.execute(select(Account).where(Account.id == effective_account_id))
        acc = acc_res.scalar_one_or_none()
        if goal and acc:
            goal.saved_amount = Decimal(str(goal.saved_amount)) + Decimal(str(rec.amount))
            acc.balance = Decimal(str(acc.balance)) - Decimal(str(rec.amount))

    from_date = rec.next_date or date.today()
    rec.next_date = _next_date(from_date, rec.frequency)

    if rec.end_date and rec.next_date > rec.end_date:
        rec.is_active = False

    await db.commit()
    return tx
