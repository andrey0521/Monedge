from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.recurring_transaction import (
    RecurringTransactionCreate,
    RecurringTransactionUpdate,
    RecurringTransactionOut,
)
from app.schemas.transaction import TransactionOut
from app.services import recurring_service
from pydantic import BaseModel
from typing import Optional
import uuid

class ApplyBody(BaseModel):
    payment_account_id: Optional[uuid.UUID] = None

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.get("", response_model=list[RecurringTransactionOut])
async def list_recurring(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await recurring_service.get_recurring(db, current_user.id)


@router.post("", response_model=RecurringTransactionOut, status_code=201)
async def create_recurring(
    data: RecurringTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await recurring_service.create_recurring(db, current_user.id, data)


@router.put("/{rec_id}", response_model=RecurringTransactionOut)
async def update_recurring(
    rec_id: uuid.UUID,
    data: RecurringTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await recurring_service.update_recurring(db, rec_id, current_user.id, data)
    if not result:
        raise HTTPException(status_code=404, detail="No encontrado")
    return result


@router.delete("/{rec_id}", status_code=204)
async def delete_recurring(
    rec_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await recurring_service.delete_recurring(db, rec_id, current_user.id):
        raise HTTPException(status_code=404, detail="No encontrado")


@router.post("/{rec_id}/apply", response_model=TransactionOut)
async def apply_recurring(
    rec_id: uuid.UUID,
    body: ApplyBody = Body(default_factory=ApplyBody),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await recurring_service.apply_recurring(
        db, rec_id, current_user.id, body.payment_account_id
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Recurrencia no encontrada")
    return result
