from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.services import category_service
import uuid

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await category_service.get_categories(db, current_user.id, type_filter=type)


@router.post("", response_model=CategoryOut, status_code=201)
async def create_category(
    data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await category_service.create_category(db, current_user.id, data)


@router.post("/seed", status_code=204)
async def seed_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await category_service.seed_default_categories(db, current_user.id)


@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await category_service.update_category(db, category_id, current_user.id, data)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return cat


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await category_service.delete_category(db, category_id, current_user.id):
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
