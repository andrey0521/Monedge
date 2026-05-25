#!/usr/bin/env python3
"""
Seed de datos de demostración. Crea el usuario si no existe.
Uso:  cd backend && python seed_demo.py [email] [password]
      Defaults: demo@monedge.dev / demo1234
"""
import asyncio, sys, os, uuid
from datetime import date
from decimal import Decimal

os.environ.setdefault("DATABASE_URL",  "postgresql+asyncpg://admin:adminpassword@localhost:5433/monedge_app")
os.environ.setdefault("SECRET_KEY",    "demo-seed")
os.environ.setdefault("FRONTEND_URL",  "http://localhost:3000")
os.environ.setdefault("GOOGLE_AI_API_KEY", "demo")
os.environ.setdefault("GEMMA_MODEL",   "gemini-2.5-flash")

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, delete
import app.models
from app.models.user                 import User
from app.models.account              import Account
from app.models.category             import Category
from app.models.transaction          import Transaction
from app.models.budget               import Budget
from app.models.goal                 import Goal
from app.models.recurring_transaction import RecurringTransaction
from app.services.category_service  import seed_default_categories
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

DB_URL  = "postgresql+asyncpg://admin:adminpassword@localhost:5433/monedge_app"
engine  = create_async_engine(DB_URL, echo=False)
Session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

TODAY = date(2026, 5, 13)

def uid(): return uuid.uuid4()
def d(y, m, day): return date(y, m, day)

async def seed(email: str, password: str):
    async with Session() as db:

        # ── 1. usuario ───────────────────────────────────────────────────────
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        if not user:
            user = User(
                id=uuid.uuid4(),
                email=email,
                full_name="Usuario Demo",
                hashed_password=hash_password(password),
                is_active=True,
            )
            db.add(user)
            await db.flush()
            print(f"✓ Usuario creado: {email} / {password}")
        else:
            print(f"✓ Usuario existente: {email}")
        uid_ = user.id

        # ── 2. limpiar datos anteriores ──────────────────────────────────────
        await db.execute(delete(Transaction).where(Transaction.user_id == uid_))
        await db.execute(delete(RecurringTransaction).where(RecurringTransaction.user_id == uid_))
        await db.execute(delete(Budget).where(Budget.user_id == uid_))
        await db.execute(delete(Goal).where(Goal.user_id == uid_))
        await db.execute(delete(Account).where(Account.user_id == uid_))
        await db.commit()

        # ── 3. categorías ────────────────────────────────────────────────────
        await seed_default_categories(db, uid_)
        res = await db.execute(select(Category).where(Category.user_id == uid_))
        cats = {c.name: c.id for c in res.scalars().all()}

        # ── 4. cuentas ───────────────────────────────────────────────────────
        # Balances calculados sobre el neto real de las transacciones + saldo inicial
        bbva  = Account(id=uid(), user_id=uid_, name="BBVA Bancomer",  bank="BBVA",       balance=Decimal("24920"),  type="checking")
        efect = Account(id=uid(), user_id=uid_, name="Efectivo",       bank=None,          balance=Decimal("1710"),   type="cash")
        cetes = Account(id=uid(), user_id=uid_, name="CETES Directo",  bank="Gobierno MX", balance=Decimal("18500"),  type="savings")
        amex  = Account(id=uid(), user_id=uid_, name="Amex Oro",       bank="American Express", balance=Decimal("25601"), credit_limit=Decimal("50000"), type="credit")
        for acc in (bbva, efect, cetes, amex):
            db.add(acc)
        await db.flush()
        B, C, S, A = bbva.id, efect.id, cetes.id, amex.id

        # ── 4. presupuestos mayo ─────────────────────────────────────────────
        presu = [
            Budget(id=uid(), user_id=uid_, name="Comida mayo",
                   category_id=cats.get("Alimentación"),
                   amount=Decimal("3500"), start_date=d(2026,5,1), end_date=d(2026,5,31)),
            Budget(id=uid(), user_id=uid_, name="Transporte mayo",
                   category_id=cats.get("Transporte"),
                   amount=Decimal("1200"), start_date=d(2026,5,1), end_date=d(2026,5,31)),
            Budget(id=uid(), user_id=uid_, name="Entretenimiento mayo",
                   category_id=cats.get("Entretenimiento"),
                   amount=Decimal("1000"), start_date=d(2026,5,1), end_date=d(2026,5,31)),
            Budget(id=uid(), user_id=uid_, name="Servicios mayo",
                   category_id=cats.get("Servicios"),
                   amount=Decimal("1100"), start_date=d(2026,5,1), end_date=d(2026,5,31)),
        ]
        for p in presu:
            db.add(p)

        # ── 5. metas ─────────────────────────────────────────────────────────
        metas = [
            Goal(id=uid(), user_id=uid_, name="Viaje a CDMX",       emoji="✈️",
                 target_amount=Decimal("8000"),  saved_amount=Decimal("3200"), deadline=d(2026,8,15)),
            Goal(id=uid(), user_id=uid_, name="Laptop nueva",        emoji="💻",
                 target_amount=Decimal("22000"), saved_amount=Decimal("8500"), deadline=d(2026,12,1)),
            Goal(id=uid(), user_id=uid_, name="Fondo de emergencia", emoji="🛡️",
                 target_amount=Decimal("30000"), saved_amount=Decimal("18500"), deadline=None),
        ]
        for m in metas:
            db.add(m)

        # ── 6. recurrentes ───────────────────────────────────────────────────
        def rec(name, amt, typ, cat, acc, freq, next_d, end_d=None, active=True):
            return RecurringTransaction(
                id=uid(), user_id=uid_, name=name,
                amount=Decimal(str(amt)), type=typ,
                category_id=cats.get(cat), account_id=acc,
                frequency=freq, next_date=next_d,
                end_date=end_d,
                is_active=active,
            )

        recurrentes = [
            # Servicios fijos mensuales
            rec("Telmex Internet",  399,  "expense", "Servicios", B, "monthly", d(2026,6,5)),
            rec("Telcel plan",      249,  "expense", "Servicios", B, "monthly", d(2026,6,5)),
            rec("Netflix",          169,  "expense", "Servicios", B, "monthly", d(2026,6,8)),
            rec("Spotify",           99,  "expense", "Servicios", B, "monthly", d(2026,6,8)),
            rec("Gym mensualidad",  599,  "expense", "Salud",     B, "monthly", d(2026,6,1)),
            # Salario quincenal
            rec("Salario quincenal", 8250, "income", "Salario",   B, "biweekly", d(2026,5,15)),
            # Suscripción con fecha de fin (termina en agosto)
            rec("Disney+", 139, "expense", "Servicios", B, "monthly", d(2026,6,12), end_d=d(2026,8,12)),
        ]
        for r in recurrentes:
            db.add(r)

        # ── 7. transacciones ─────────────────────────────────────────────────
        def tx(desc, amt, typ, cat, acc, fecha):
            return Transaction(
                id=uid(), user_id=uid_, account_id=acc,
                category_id=cats.get(cat),
                description=desc, amount=Decimal(str(amt)),
                type=typ, date=fecha,
            )

        txs = []

        # ════ FEBRERO 2026 ════════════════════════════════════════════════════
        txs += [
            tx("Salario 1ra quincena",          8250, "income",  "Salario",         B, d(2026,2,1)),
            tx("Salario 2da quincena",          8250, "income",  "Salario",         B, d(2026,2,15)),
            tx("Renta febrero",                 5200, "expense", "Vivienda",        B, d(2026,2,3)),
            tx("CFE luz",                        380, "expense", "Vivienda",        B, d(2026,2,10)),
            tx("Telmex internet",                399, "expense", "Servicios",       B, d(2026,2,5)),
            tx("Telcel plan mensual",            249, "expense", "Servicios",       B, d(2026,2,5)),
            tx("Netflix",                        169, "expense", "Servicios",       B, d(2026,2,12)),
            tx("Spotify",                         99, "expense", "Servicios",       B, d(2026,2,12)),
            tx("Gym mensualidad",                599, "expense", "Salud",           B, d(2026,2,1)),
            tx("Farmacia Guadalajara",           230, "expense", "Salud",           C, d(2026,2,23)),
            tx("Walmart supermercado",           850, "expense", "Alimentación",    B, d(2026,2,2)),
            tx("OXXO",                            85, "expense", "Alimentación",    C, d(2026,2,4)),
            tx("Restaurante El Fogón",           180, "expense", "Alimentación",    C, d(2026,2,7)),
            tx("McDonald's",                     120, "expense", "Alimentación",    C, d(2026,2,9)),
            tx("Chedraui",                       620, "expense", "Alimentación",    B, d(2026,2,14)),
            tx("Taquería Los Compadres",          95, "expense", "Alimentación",    C, d(2026,2,16)),
            tx("7-Eleven",                        65, "expense", "Alimentación",    C, d(2026,2,18)),
            tx("Restaurante sushi Hiroshi",      290, "expense", "Alimentación",    B, d(2026,2,21)),
            tx("La Comer",                       710, "expense", "Alimentación",    B, d(2026,2,24)),
            tx("Domino's Pizza",                 210, "expense", "Alimentación",    B, d(2026,2,26)),
            tx("OXXO antojo noche",               58, "expense", "Alimentación",    C, d(2026,2,28)),
            tx("Gasolina Pemex",                 500, "expense", "Transporte",      B, d(2026,2,3)),
            tx("Uber al trabajo",                 85, "expense", "Transporte",      B, d(2026,2,6)),
            tx("Gasolina Pemex",                 450, "expense", "Transporte",      B, d(2026,2,17)),
            tx("Camión",                          20, "expense", "Transporte",      C, d(2026,2,19)),
            tx("Uber regreso noche",             130, "expense", "Transporte",      B, d(2026,2,22)),
            tx("Cine Cinépolis",                 180, "expense", "Entretenimiento", B, d(2026,2,8)),
            tx("Salida con amigos",              350, "expense", "Entretenimiento", C, d(2026,2,15)),
            tx("Steam videojuegos",              250, "expense", "Entretenimiento", B, d(2026,2,20)),
            tx("Zara",                           980, "expense", "Ropa",            B, d(2026,2,13)),
            # Compra iPhone a MSI en Amex (primer cargo completo)
            tx("iPhone 15 Pro – Amex 6 MSI",   8499, "expense", "Otros gastos",    A, d(2026,2,10)),
        ]

        # ════ MARZO 2026 ══════════════════════════════════════════════════════
        txs += [
            tx("Salario 1ra quincena",          8250, "income",  "Salario",         B, d(2026,3,1)),
            tx("Proyecto freelance UABC",       4500, "income",  "Freelance",       B, d(2026,3,10)),
            tx("Salario 2da quincena",          8250, "income",  "Salario",         B, d(2026,3,15)),
            tx("Renta marzo",                   5200, "expense", "Vivienda",        B, d(2026,3,3)),
            tx("CFE luz",                        290, "expense", "Vivienda",        B, d(2026,3,12)),
            tx("Telmex internet",                399, "expense", "Servicios",       B, d(2026,3,5)),
            tx("Telcel plan mensual",            249, "expense", "Servicios",       B, d(2026,3,5)),
            tx("Netflix",                        169, "expense", "Servicios",       B, d(2026,3,12)),
            tx("Spotify",                         99, "expense", "Servicios",       B, d(2026,3,12)),
            tx("Gym mensualidad",                599, "expense", "Salud",           B, d(2026,3,1)),
            tx("Médico consulta general",        500, "expense", "Salud",           C, d(2026,3,25)),
            tx("Walmart supermercado",           920, "expense", "Alimentación",    B, d(2026,3,2)),
            tx("OXXO café mañana",                55, "expense", "Alimentación",    C, d(2026,3,5)),
            tx("Subway",                         115, "expense", "Alimentación",    C, d(2026,3,7)),
            tx("La Parroquia desayuno",          195, "expense", "Alimentación",    C, d(2026,3,11)),
            tx("Soriana supermercado",           680, "expense", "Alimentación",    B, d(2026,3,16)),
            tx("KFC",                            145, "expense", "Alimentación",    C, d(2026,3,18)),
            tx("OXXO snacks",                     78, "expense", "Alimentación",    C, d(2026,3,20)),
            tx("Restaurante El Japonés",         340, "expense", "Alimentación",    B, d(2026,3,22)),
            tx("Chedraui semana",                590, "expense", "Alimentación",    B, d(2026,3,26)),
            tx("Burger King",                    135, "expense", "Alimentación",    C, d(2026,3,29)),
            tx("Tortas del mercado",              90, "expense", "Alimentación",    C, d(2026,3,31)),
            tx("Gasolina Pemex",                 550, "expense", "Transporte",      B, d(2026,3,4)),
            tx("Uber a reunión",                 220, "expense", "Transporte",      B, d(2026,3,9)),
            tx("Gasolina BP",                    480, "expense", "Transporte",      B, d(2026,3,18)),
            tx("Estacionamiento centro",          45, "expense", "Transporte",      C, d(2026,3,22)),
            tx("Uber regreso",                   110, "expense", "Transporte",      B, d(2026,3,27)),
            tx("Cine Cinemex",                   160, "expense", "Entretenimiento", B, d(2026,3,7)),
            tx("Bar con amigos",                 420, "expense", "Entretenimiento", C, d(2026,3,14)),
            tx("Videojuego PS Store",            599, "expense", "Entretenimiento", B, d(2026,3,20)),
            tx("Partido fútbol entrada",          80, "expense", "Entretenimiento", C, d(2026,3,29)),
            tx("Libros semestre",                680, "expense", "Educación",       B, d(2026,3,6)),
            tx("Udemy curso Python",             249, "expense", "Educación",       B, d(2026,3,19)),
            # Cuota MSI iPhone (2/6)
            tx("Cuota – iPhone 15 Pro",         1416, "expense", "Otros gastos",   B, d(2026,3,15)),
        ]

        # ════ ABRIL 2026 ══════════════════════════════════════════════════════
        txs += [
            tx("Salario 1ra quincena",          8250, "income",  "Salario",         B, d(2026,4,1)),
            tx("Salario 2da quincena",          8250, "income",  "Salario",         B, d(2026,4,15)),
            tx("Freelance diseño web",          3200, "income",  "Freelance",       B, d(2026,4,22)),
            tx("Renta abril",                   5200, "expense", "Vivienda",        B, d(2026,4,3)),
            tx("CFE luz",                        310, "expense", "Vivienda",        B, d(2026,4,11)),
            tx("Agua CESPE",                     120, "expense", "Vivienda",        B, d(2026,4,15)),
            tx("Telmex internet",                399, "expense", "Servicios",       B, d(2026,4,5)),
            tx("Telcel plan mensual",            249, "expense", "Servicios",       B, d(2026,4,5)),
            tx("Netflix",                        169, "expense", "Servicios",       B, d(2026,4,12)),
            tx("Spotify",                         99, "expense", "Servicios",       B, d(2026,4,12)),
            tx("Disney+",                        139, "expense", "Servicios",       B, d(2026,4,20)),
            tx("Gym mensualidad",                599, "expense", "Salud",           B, d(2026,4,1)),
            tx("Walmart supermercado",          1050, "expense", "Alimentación",    B, d(2026,4,2)),
            tx("Café Punta del Cielo",            75, "expense", "Alimentación",    C, d(2026,4,4)),
            tx("Taquería del mercado",           110, "expense", "Alimentación",    C, d(2026,4,6)),
            tx("Sushi Roll",                     280, "expense", "Alimentación",    B, d(2026,4,10)),
            tx("La Comer",                       740, "expense", "Alimentación",    B, d(2026,4,14)),
            tx("OXXO",                            95, "expense", "Alimentación",    C, d(2026,4,16)),
            tx("Subway",                         125, "expense", "Alimentación",    C, d(2026,4,19)),
            tx("Restaurante La Querencia",       380, "expense", "Alimentación",    B, d(2026,4,23)),
            tx("Chedraui quincenal",             820, "expense", "Alimentación",    B, d(2026,4,27)),
            tx("Pizza Hut",                      195, "expense", "Alimentación",    B, d(2026,4,30)),
            tx("Gasolina Pemex",                 600, "expense", "Transporte",      B, d(2026,4,4)),
            tx("Uber al mall",                    95, "expense", "Transporte",      B, d(2026,4,9)),
            tx("Gasolina Pemex",                 520, "expense", "Transporte",      B, d(2026,4,19)),
            tx("Estacionamiento plaza",           40, "expense", "Transporte",      C, d(2026,4,25)),
            tx("Uber noche",                     145, "expense", "Transporte",      B, d(2026,4,28)),
            tx("Cinemex IMAX",                   240, "expense", "Entretenimiento", B, d(2026,4,5)),
            tx("Concierto Natanael Cano",        650, "expense", "Entretenimiento", B, d(2026,4,12)),
            tx("Bowling con amigos",             180, "expense", "Entretenimiento", C, d(2026,4,19)),
            tx("Steam Deck juego",               320, "expense", "Entretenimiento", B, d(2026,4,25)),
            tx("H&M ropa primavera",            1250, "expense", "Ropa",            B, d(2026,4,8)),
            tx("Tenis Nike",                    1800, "expense", "Ropa",            B, d(2026,4,20)),
            tx("Material diseño gráfico",        450, "expense", "Educación",       B, d(2026,4,17)),
            # Cuota MSI iPhone (3/6)
            tx("Cuota – iPhone 15 Pro",         1416, "expense", "Otros gastos",   B, d(2026,4,15)),
            # Compra MacBook a MSI en Amex (primer cargo)
            tx("MacBook Air M3 – Amex 12 MSI", 15900, "expense", "Educación",      A, d(2026,4,20)),
        ]

        # ════ MAYO 2026 (días 1–13) ═══════════════════════════════════════════
        txs += [
            tx("Salario 1ra quincena",          8250, "income",  "Salario",         B, d(2026,5,1)),
            tx("Renta mayo",                    5200, "expense", "Vivienda",        B, d(2026,5,2)),
            tx("Telmex internet",                399, "expense", "Servicios",       B, d(2026,5,5)),
            tx("Telcel plan mensual",            249, "expense", "Servicios",       B, d(2026,5,5)),
            tx("Netflix",                        169, "expense", "Servicios",       B, d(2026,5,8)),
            tx("Spotify",                         99, "expense", "Servicios",       B, d(2026,5,8)),
            tx("Gym mensualidad",                599, "expense", "Salud",           B, d(2026,5,1)),
            tx("Walmart semana",                 930, "expense", "Alimentación",    B, d(2026,5,3)),
            tx("OXXO desayuno",                   68, "expense", "Alimentación",    C, d(2026,5,5)),
            tx("Taquería del parque",             95, "expense", "Alimentación",    C, d(2026,5,7)),
            tx("Subway",                         118, "expense", "Alimentación",    C, d(2026,5,9)),
            tx("Restaurante familiar",           420, "expense", "Alimentación",    B, d(2026,5,10)),
            tx("7-Eleven",                        72, "expense", "Alimentación",    C, d(2026,5,12)),
            tx("Gasolina Pemex",                 550, "expense", "Transporte",      B, d(2026,5,4)),
            tx("Uber al campus UABC",             78, "expense", "Transporte",      B, d(2026,5,6)),
            tx("Estacionamiento UABC",            30, "expense", "Transporte",      C, d(2026,5,9)),
            tx("Uber regreso tarde",              92, "expense", "Transporte",      B, d(2026,5,12)),
            tx("Cine Cinépolis",                 170, "expense", "Entretenimiento", B, d(2026,5,11)),
        ]

        for t in txs:
            db.add(t)

        await db.commit()

        print(f"\n✓ Seed completado para {email}")
        print(f"  Cuentas:         4  (BBVA, Efectivo, CETES, Amex crédito)")
        print(f"  Presupuestos:    {len(presu)}")
        print(f"  Metas:           {len(metas)}")
        print(f"  Recurrentes:     {len(recurrentes)}")
        print(f"  Transacciones:   {len(txs)}  (feb–may 2026)")

_email    = sys.argv[1] if len(sys.argv) > 1 else "demo@monedge.dev"
_password = sys.argv[2] if len(sys.argv) > 2 else "demo1234"
asyncio.run(seed(_email, _password))
