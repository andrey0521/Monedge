from pydantic import BaseModel
from decimal import Decimal
from typing import List
from app.schemas.transaction import TransactionOut
from app.schemas.account import AccountOut
from app.schemas.budget import BudgetOut
from app.schemas.goal import GoalOut


class DashboardOut(BaseModel):
    total_balance: Decimal
    credit_debt: Decimal
    monthly_income: Decimal
    monthly_expenses: Decimal
    safe_daily_budget: Decimal
    avg_daily_expense: Decimal
    recent_transactions: List[TransactionOut]
    accounts: List[AccountOut]
    budgets: List[BudgetOut]
    goals: List[GoalOut]
