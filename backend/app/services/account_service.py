from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate
from decimal import Decimal
import uuid


async def get_accounts(db: AsyncSession, user_id: uuid.UUID) -> list[Account]:
    result = await db.execute(select(Account).where(Account.user_id == user_id))
    return result.scalars().all()


async def create_account(db: AsyncSession, user_id: uuid.UUID, data: AccountCreate) -> Account:
    acc = Account(id=uuid.uuid4(), user_id=user_id, **data.model_dump())
    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc


async def update_account(
    db: AsyncSession, account_id: uuid.UUID, user_id: uuid.UUID, data: AccountUpdate
) -> Account | None:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(acc, field, value)
    await db.commit()
    await db.refresh(acc)
    return acc


async def pay_credit(
    db: AsyncSession, user_id: uuid.UUID,
    credit_id: uuid.UUID, from_id: uuid.UUID, amount: Decimal
) -> tuple[Account, Account] | None:
    res = await db.execute(select(Account).where(Account.id == from_id, Account.user_id == user_id))
    liquid = res.scalar_one_or_none()
    res2 = await db.execute(select(Account).where(Account.id == credit_id, Account.user_id == user_id))
    credit = res2.scalar_one_or_none()
    if not liquid or not credit or credit.type != "credit":
        return None
    liquid.balance = Decimal(str(liquid.balance)) - amount
    credit.balance = Decimal(str(credit.balance)) + amount
    await db.commit()
    await db.refresh(liquid)
    await db.refresh(credit)
    return liquid, credit


async def delete_account(db: AsyncSession, account_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user_id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        return False
    await db.delete(acc)
    await db.commit()
    return True
