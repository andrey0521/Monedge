from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut
from app.services import budget_service
import uuid

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetOut])
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await budget_service.get_budgets(db, current_user.id)


@router.post("", response_model=BudgetOut, status_code=201)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await budget_service.create_budget(db, current_user.id, data)


@router.put("/{budget_id}", response_model=BudgetOut)
async def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    b = await budget_service.update_budget(db, budget_id, current_user.id, data)
    if not b:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return b


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await budget_service.delete_budget(db, budget_id, current_user.id):
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")


@router.post("/{budget_id}/renew", response_model=BudgetOut, status_code=201)
async def renew_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    b = await budget_service.renew_budget(db, budget_id, current_user.id)
    if not b:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado o no es recurrente")
    return b
