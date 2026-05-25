from pydantic import BaseModel
from decimal import Decimal
from typing import Optional
import uuid


class AccountCreate(BaseModel):
    name: str
    bank: Optional[str] = None
    balance: Decimal = Decimal("0")
    type: str = "checking"
    credit_limit: Optional[Decimal] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    bank: Optional[str] = None
    balance: Optional[Decimal] = None
    type: Optional[str] = None
    credit_limit: Optional[Decimal] = None


class AccountOut(BaseModel):
    id: uuid.UUID
    name: str
    bank: Optional[str]
    balance: Decimal
    type: str
    credit_limit: Optional[Decimal] = None

    class Config:
        from_attributes = True
