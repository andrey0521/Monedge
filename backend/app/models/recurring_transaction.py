from sqlalchemy import Column, String, Numeric, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id", ondelete="SET NULL"), nullable=True)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(String, nullable=False)          # "income" | "expense"
    frequency = Column(String, nullable=False)     # "weekly" | "biweekly" | "monthly"
    next_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="recurring_transactions")
    account = relationship("Account")
    category = relationship("Category")
