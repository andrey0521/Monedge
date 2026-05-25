from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services import ai_service, category_service, account_service, budget_service, goal_service, transaction_service
from app.services.transaction_service import get_monthly_totals
from datetime import date, timedelta
from decimal import Decimal

router = APIRouter(prefix="/ai", tags=["ai"])


class CategorizeRequest(BaseModel):
    description: str
    amount: float


class FinanceQueryRequest(BaseModel):
    query: str

class AnalyzeRequest(BaseModel):
    query: str
    history: list[dict] = []  # [{role: "user"|"ai", text: str}]

class SuggestDescriptionRequest(BaseModel):
    name: str
    emoji: str | None = None
    type: str


@router.post("/categorize")
async def categorize(
    body: CategorizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cats = await category_service.get_categories(db, current_user.id)
    cats_dicts = [{"id": str(c.id), "name": c.name, "emoji": c.emoji, "description": c.description} for c in cats]
    return await ai_service.categorize_transaction(body.description, body.amount, cats_dicts)


@router.get("/summary")
async def summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    income, expenses = await get_monthly_totals(db, current_user.id, today.year, today.month)
    accounts = await account_service.get_accounts(db, current_user.id)
    total_balance = sum(Decimal(str(a.balance)) for a in accounts)
    budgets = await budget_service.get_budgets(db, current_user.id)
    goals = await goal_service.get_goals(db, current_user.id)

    context = {
        "name": current_user.full_name.split()[0],
        "total_balance": float(total_balance),
        "monthly_income": float(income),
        "monthly_expenses": float(expenses),
        "budgets": [{"name": b.name, "amount": float(b.amount), "spent": float(b.spent)} for b in budgets],
        "goals": [{"name": g.name, "target_amount": float(g.target_amount), "saved_amount": float(g.saved_amount)} for g in goals],
    }
    text = await ai_service.generate_summary(context)
    return {"text": text}


@router.get("/recommendations")
async def recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    income, expenses = await get_monthly_totals(db, current_user.id, today.year, today.month)
    budgets = await budget_service.get_budgets(db, current_user.id)
    goals = await goal_service.get_goals(db, current_user.id)

    # top spending categories this month
    from sqlalchemy import select, func
    from app.models.transaction import Transaction
    from app.models.category import Category
    from sqlalchemy.orm import joinedload
    import calendar
    last_day = calendar.monthrange(today.year, today.month)[1]
    start = date(today.year, today.month, 1)
    end = date(today.year, today.month, last_day)

    res = await db.execute(
        select(Category.name, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.date >= start,
            Transaction.date <= end,
        )
        .group_by(Category.name)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
    )
    top_cats = [{"name": row[0], "total": float(row[1])} for row in res.all()]

    # Todas las categorías del usuario (para que la IA elija nombres válidos)
    all_cats = await category_service.get_categories(db, current_user.id)
    cat_by_name = {c.name: str(c.id) for c in all_cats}

    context = {
        "name": current_user.full_name.split()[0],
        "monthly_income": float(income),
        "monthly_expenses": float(expenses),
        "budgets": [{"name": b.name, "amount": float(b.amount), "spent": float(b.spent)} for b in budgets],
        "goals": [{"name": g.name, "target_amount": float(g.target_amount), "saved_amount": float(g.saved_amount)} for g in goals],
        "top_categories": top_cats,
        "category_names": list(cat_by_name.keys()),
    }
    result = await ai_service.generate_recommendations(context)

    # Resolver category_name → category_id en acciones de presupuesto
    if result.get("actions"):
        for action in result["actions"]:
            if action.get("type") == "budget" and isinstance(action.get("data"), dict):
                cat_name = action["data"].get("category_name", "")
                action["data"]["category_id"] = cat_by_name.get(cat_name)
    return result


@router.post("/query")
async def finance_query(
    body: FinanceQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    start_30 = today - timedelta(days=30)

    txs = await transaction_service.get_transactions(db, current_user.id, start_30, today, limit=200)

    total_income = sum(float(t.amount) for t in txs if t.type == "income")
    total_expenses = sum(float(t.amount) for t in txs if t.type == "expense")

    cat_totals: dict[str, float] = {}
    for t in txs:
        if t.type == "expense" and t.category_name:
            cat_totals[t.category_name] = cat_totals.get(t.category_name, 0) + float(t.amount)

    cat_breakdown = "\n".join(
        f"- {name}: ${total:,.0f}"
        for name, total in sorted(cat_totals.items(), key=lambda x: -x[1])[:8]
    )

    recent_sample = "\n".join(
        f"- {t.date}: {t.description} ({'ingreso' if t.type == 'income' else 'gasto'}) ${float(t.amount):,.0f}"
        f"{' [' + t.category_name + ']' if t.category_name else ''}"
        for t in txs[:20]
    )

    context = {
        "query": body.query,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "tx_count": len(txs),
        "category_breakdown": cat_breakdown,
        "recent_txs": recent_sample,
        "period": f"{start_30.isoformat()} al {today.isoformat()}",
    }
    text = await ai_service.query_finances(context)
    return {"text": text}


@router.post("/suggest-category-description")
async def suggest_category_description(
    body: SuggestDescriptionRequest,
    current_user: User = Depends(get_current_user),
):
    text = await ai_service.suggest_category_description(body.name, body.emoji, body.type)
    return {"description": text}


@router.post("/analyze")
async def analyze(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ai_service.analyze_query(db, current_user.id, body.query, body.history)
