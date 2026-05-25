from pydantic import BaseModel, EmailStr
import uuid

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = ""
    password: str = ""
    use_default_categories: bool = True

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool

    class Config:
        from_attributes = True