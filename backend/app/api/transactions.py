from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut
from app.services import transaction_service
from datetime import date
from typing import Optional
import uuid

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
async def list_transactions(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    limit: int = Query(default=100, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await transaction_service.get_transactions(
        db, current_user.id, start_date, end_date, limit
    )


@router.post("", response_model=TransactionOut, status_code=201)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await transaction_service.create_transaction(db, current_user.id, data)


@router.put("/{tx_id}", response_model=TransactionOut)
async def update_transaction(
    tx_id: uuid.UUID,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tx = await transaction_service.update_transaction(db, tx_id, current_user.id, data)
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return tx


@router.delete("/{tx_id}", status_code=204)
async def delete_transaction(
    tx_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await transaction_service.delete_transaction(db, tx_id, current_user.id):
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
