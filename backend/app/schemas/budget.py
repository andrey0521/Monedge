from pydantic import BaseModel
from datetime import date as Date
from decimal import Decimal
from typing import Optional
import uuid


class BudgetCreate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    name: str
    amount: Decimal                       # monto por período
    start_date: Date
    end_date: Date
    is_recurring: bool = False
    frequency: Optional[str] = None       # "weekly" | "biweekly" | "monthly"


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    start_date: Optional[Date] = None
    end_date: Optional[Date] = None
    is_recurring: Optional[bool] = None
    frequency: Optional[str] = None
    category_id: Optional[uuid.UUID] = None


class BudgetPeriod(BaseModel):
    label: str
    start_date: Date
    end_date: Date
    spent: Decimal
    amount: Decimal
    is_current: bool


class BudgetOut(BaseModel):
    id: uuid.UUID
    category_id: Optional[uuid.UUID]
    name: str
    amount: Decimal                       # monto por período
    spent: Decimal = Decimal("0")         # gasto total (todos los períodos)
    total_budget: Decimal = Decimal("0")  # amount × número de períodos
    start_date: Date
    end_date: Date
    is_recurring: bool = False
    frequency: Optional[str] = None
    category_name: Optional[str] = None
    category_emoji: Optional[str] = None
    periods: list[BudgetPeriod] = []

    class Config:
        from_attributes = True
