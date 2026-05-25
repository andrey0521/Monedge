from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    transactions = relationship("Transaction", back_populates="user")
    categories = relationship("Category", back_populates="user")
    accounts = relationship("Account", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    recurring_transactions = relationship("RecurringTransaction", back_populates="user")