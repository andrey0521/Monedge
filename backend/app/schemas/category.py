from pydantic import BaseModel
from typing import Optional
import uuid


class CategoryCreate(BaseModel):
    name: str
    emoji: Optional[str] = None
    color: Optional[str] = None
    type: str = "expense"
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    emoji: Optional[str]
    color: Optional[str]
    is_default: bool
    type: str = "expense"
    description: Optional[str] = None

    class Config:
        from_attributes = True
