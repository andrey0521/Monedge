from sqlalchemy import Column, String, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    emoji = Column(String, nullable=True, default="🎯")
    target_amount = Column(Numeric(14, 2), nullable=False)
    saved_amount = Column(Numeric(14, 2), default=0)
    deadline = Column(Date, nullable=True)

    user = relationship("User", back_populates="goals")
    transactions = relationship("Transaction", back_populates="goal")
