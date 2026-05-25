from pydantic import BaseModel
from datetime import date as Date, datetime
from decimal import Decimal
from typing import Optional
import uuid


class TransactionCreate(BaseModel):
    account_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    budget_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    amount: Decimal
    type: str
    description: str
    date: Date


class TransactionUpdate(BaseModel):
    account_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    budget_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    amount: Optional[Decimal] = None
    type: Optional[str] = None
    description: Optional[str] = None
    date: Optional[Date] = None


class TransactionOut(BaseModel):
    id: uuid.UUID
    account_id: Optional[uuid.UUID]
    category_id: Optional[uuid.UUID]
    budget_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    amount: Decimal
    type: str
    description: str
    date: Date
    created_at: datetime
    category_name: Optional[str] = None
    category_emoji: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True
