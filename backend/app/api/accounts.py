from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate, AccountOut
from app.services import account_service
from pydantic import BaseModel
from decimal import Decimal
import uuid


class PayCreditBody(BaseModel):
    from_account_id: uuid.UUID
    amount: Decimal

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountOut])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.get_accounts(db, current_user.id)


@router.post("", response_model=AccountOut, status_code=201)
async def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await account_service.create_account(db, current_user.id, data)


@router.put("/{account_id}", response_model=AccountOut)
async def update_account(
    account_id: uuid.UUID,
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    acc = await account_service.update_account(db, account_id, current_user.id, data)
    if not acc:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return acc


@router.post("/{account_id}/pay", response_model=list[AccountOut])
async def pay_credit_account(
    account_id: uuid.UUID,
    body: PayCreditBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await account_service.pay_credit(db, current_user.id, account_id, body.from_account_id, body.amount)
    if not result:
        raise HTTPException(status_code=400, detail="Cuentas no válidas para el abono")
    return list(result)


@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await account_service.delete_account(db, account_id, current_user.id):
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
