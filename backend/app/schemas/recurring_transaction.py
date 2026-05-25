from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid


class RecurringTransactionCreate(BaseModel):
    name: str
    amount: Decimal
    type: str
    frequency: str
    next_date: Optional[date] = None
    end_date: Optional[date] = None
    category_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    budget_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    is_active: bool = True


class RecurringTransactionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    frequency: Optional[str] = None
    next_date: Optional[date] = None
    end_date: Optional[date] = None
    category_id: Optional[uuid.UUID] = None
    account_id: Optional[uuid.UUID] = None
    budget_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class RecurringTransactionOut(BaseModel):
    id: uuid.UUID
    name: str
    amount: Decimal
    type: str
    frequency: str
    next_date: Optional[date]
    end_date: Optional[date] = None
    is_active: bool
    category_id: Optional[uuid.UUID]
    account_id: Optional[uuid.UUID]
    budget_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    category_emoji: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True
