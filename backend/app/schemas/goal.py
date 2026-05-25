from pydantic import BaseModel
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid


class GoalCreate(BaseModel):
    name: str
    emoji: Optional[str] = "🎯"
    target_amount: Decimal
    saved_amount: Decimal = Decimal("0")
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    target_amount: Optional[Decimal] = None
    saved_amount: Optional[Decimal] = None
    deadline: Optional[date] = None


class GoalMovement(BaseModel):
    account_id: uuid.UUID
    amount: Decimal


class GoalOut(BaseModel):
    id: uuid.UUID
    name: str
    emoji: Optional[str]
    target_amount: Decimal
    saved_amount: Decimal
    deadline: Optional[date]

    class Config:
        from_attributes = True
