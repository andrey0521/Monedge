from sqlalchemy import Column, String, Numeric, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    name = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    frequency = Column(String, nullable=True)  # "weekly" | "biweekly" | "monthly"

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
    transactions = relationship("Transaction", back_populates="budget")
