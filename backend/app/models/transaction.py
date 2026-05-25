from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id", ondelete="SET NULL"), nullable=True)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(String, nullable=False)  # "income" | "expense"
    description = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    budget = relationship("Budget", back_populates="transactions")
    goal = relationship("Goal", back_populates="transactions")
