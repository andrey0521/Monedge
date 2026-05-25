from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
import uuid

DEFAULT_CATEGORIES = [
    # Gastos (9 categorías genéricas)
    {
        "name": "Alimentación", "emoji": "🍽️", "color": "#f59e0b", "type": "expense",
        "description": "Comida diaria por necesidad: cafetería, mandado, despensa, OXXO, lunch entre semana. No incluye salidas sociales ni citas.",
    },
    {
        "name": "Transporte", "emoji": "🚗", "color": "#3b82f6", "type": "expense",
        "description": "Moverse de un lugar a otro: camión, Uber, DiDi, gasolina, estacionamiento, taxi.",
    },
    {
        "name": "Vivienda", "emoji": "🏠", "color": "#8b5cf6", "type": "expense",
        "description": "Renta mensual, hipoteca o cuota de habitación.",
    },
    {
        "name": "Salud", "emoji": "🏥", "color": "#ef4444", "type": "expense",
        "description": "Farmacia, médico, dentista, vitaminas, gym y todo lo relacionado con bienestar físico.",
    },
    {
        "name": "Entretenimiento", "emoji": "🎬", "color": "#ec4899", "type": "expense",
        "description": "Salidas de ocio y diversión: cines, citas, cenas con pareja o amigos, bares, bowling, streaming, videojuegos y actividades recreativas.",
    },
    {
        "name": "Educación", "emoji": "📚", "color": "#06b6d4", "type": "expense",
        "description": "Colegiatura, libros, cursos, materiales escolares, impresiones y herramientas de aprendizaje.",
    },
    {
        "name": "Ropa", "emoji": "👗", "color": "#f97316", "type": "expense",
        "description": "Ropa, calzado y accesorios personales.",
    },
    {
        "name": "Servicios", "emoji": "💡", "color": "#84cc16", "type": "expense",
        "description": "Servicios del hogar y suscripciones fijas: luz, agua, gas, internet, teléfono, Netflix, Spotify.",
    },
    {
        "name": "Otros gastos", "emoji": "📦", "color": "#6b7280", "type": "expense",
        "description": "Gastos que no encajan en otra categoría: regalos, peluquería, lavandería, papelería suelta.",
    },
    # Ingresos (5 categorías genéricas)
    {
        "name": "Salario", "emoji": "💼", "color": "#22c55e", "type": "income",
        "description": "Sueldo fijo, pago por trabajo de tiempo completo o part-time.",
    },
    {
        "name": "Freelance", "emoji": "💻", "color": "#4f46e5", "type": "income",
        "description": "Ingresos por proyectos independientes, servicios por honorarios o trabajo por cuenta propia.",
    },
    {
        "name": "Inversiones", "emoji": "📈", "color": "#14b8a6", "type": "income",
        "description": "Rendimientos, intereses, dividendos o ganancias de instrumentos financieros.",
    },
    {
        "name": "Negocio", "emoji": "🏪", "color": "#f59e0b", "type": "income",
        "description": "Ingresos de un negocio propio, ventas de productos o servicios propios.",
    },
    {
        "name": "Otros ingresos", "emoji": "💰", "color": "#84cc16", "type": "income",
        "description": "Apoyo familiar, remesas, ventas de artículos usados, reembolsos y cualquier ingreso no laboral.",
    },
]


async def get_categories(
    db: AsyncSession, user_id: uuid.UUID, type_filter: str | None = None
) -> list[Category]:
    q = select(Category).where(
        or_(Category.user_id == user_id, Category.user_id.is_(None))
    )
    if type_filter:
        q = q.where(Category.type == type_filter)
    result = await db.execute(q)
    return result.scalars().all()


async def create_category(db: AsyncSession, user_id: uuid.UUID, data: CategoryCreate) -> Category:
    cat = Category(id=uuid.uuid4(), user_id=user_id, **data.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def seed_default_categories(db: AsyncSession, user_id: uuid.UUID) -> None:
    existing = await db.execute(
        select(Category).where(Category.user_id == user_id)
    )
    if existing.scalars().first():
        return
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(id=uuid.uuid4(), user_id=user_id, is_default=True, **cat))
    await db.commit()


async def update_category(
    db: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID, data: CategoryUpdate
) -> Category | None:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


async def delete_category(db: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        return False
    await db.delete(cat)
    await db.commit()
    return True
