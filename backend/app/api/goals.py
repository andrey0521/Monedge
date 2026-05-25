from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut, GoalMovement
from app.services import goal_service
import uuid

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await goal_service.get_goals(db, current_user.id)


@router.post("", response_model=GoalOut, status_code=201)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await goal_service.create_goal(db, current_user.id, data)


@router.put("/{goal_id}", response_model=GoalOut)
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    g = await goal_service.update_goal(db, goal_id, current_user.id, data)
    if not g:
        raise HTTPException(status_code=404, detail="Meta no encontrada")
    return g


@router.post("/{goal_id}/contribute", response_model=GoalOut)
async def contribute_goal(
    goal_id: uuid.UUID,
    data: GoalMovement,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    g = await goal_service.contribute_goal(db, goal_id, current_user.id, data.account_id, data.amount)
    if not g:
        raise HTTPException(status_code=404, detail="Meta o cuenta no encontrada")
    return g


@router.post("/{goal_id}/withdraw", response_model=GoalOut)
async def withdraw_goal(
    goal_id: uuid.UUID,
    data: GoalMovement,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    g = await goal_service.withdraw_goal(db, goal_id, current_user.id, data.account_id, data.amount)
    if not g:
        raise HTTPException(status_code=404, detail="Meta o cuenta no encontrada")
    return g


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await goal_service.delete_goal(db, goal_id, current_user.id):
        raise HTTPException(status_code=404, detail="Meta no encontrada")
