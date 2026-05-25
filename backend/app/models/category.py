from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    emoji = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)
    type = Column(String, nullable=False, server_default="expense")  # "income" | "expense"
    description = Column(String, nullable=True)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
