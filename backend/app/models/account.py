from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    bank = Column(String, nullable=True)
    balance = Column(Numeric(14, 2), default=0)        # disponible (crédito: crédito restante)
    credit_limit = Column(Numeric(14, 2), nullable=True)  # solo para cuentas de crédito
    type = Column(String, default="checking")  # savings | checking | cash | credit

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")
