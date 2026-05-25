#!/usr/bin/env python3
"""
Monedge — Seed de datos: estudiante universitario (1 año)

Perfil simulado:
  · Estudiante de 6to-7mo semestre, vive con su familia (sin renta)
  · Trabajo part-time 2 días por semana (sábado + domingo), paga semanal
  · Recibe apoyo semanal de $700-900 para transporte, cafetería y mandado
  · Recibe remesa mensual de ~$1,500 de su mamá (desde EE.UU.) para pagar
    servicios del hogar (luz, agua, gas, internet); le sobran ~$500-600
  · Va a la universidad 3-4 días/semana (lunes-jueves principalmente)
  · Transporte: camión SETA o Uber/DiDi 2-3 veces por semana
  · Come en la cafetería de la uni 2-4 días/semana
  · Cada 2-3 semanas hace mandado para cocinar en casa → menos cafetería esa semana
  · Sale con su novia viernes o sábado, ~60% de las semanas (a veces 2 veces, a veces ninguna)
  · Servicios fijos personales: Telcel, Netflix, Spotify (mensuales)
  · Agosto y enero: gastos de materiales escolares (inicio de semestre)
  · Diciembre: gastos navideños y regalos

Uso:
    python seed_data.py
    python seed_data.py --email tu@correo.com --password contraseña
    python seed_data.py --months 12
"""

import argparse
import random
import sys
from datetime import date, timedelta
from calendar import monthrange

try:
    import requests
except ImportError:
    print("Instala requests: pip install requests")
    sys.exit(1)

BASE_URL = "http://localhost:8000"

# ── Ingresos ─────────────────────────────────────────────────────────────────
PAGO_SEMANAL    = (720, 980)    # 2 días de trabajo, ~$360-490/día
APOYO_SEMANAL   = (700, 900)    # apoyo familiar semanal para gastos diarios
REMESA_MENSUAL  = (1_400, 1_600)  # remesa de mamá para servicios del hogar

INGRESOS_EXTRA = [
    ("Venta libro de texto",       100, 280, "Otros ingresos"),
    ("Freelance pequeño",          450, 1_400, "Freelance"),
    ("Venta artículo Marketplace", 200, 500,   "Otros ingresos"),
]

# ── Servicios del hogar (pagados con la remesa) ───────────────────────────────
# CFE y Agua son bimestrales en México; Gas e Internet mensuales
SERVICIOS_HOGAR_MENSUALES = [
    ("Internet Telmex",  399, 450, "Servicios"),
    ("Gas natural",      130, 220, "Servicios"),
]
SERVICIOS_HOGAR_BIMESTRALES = [
    ("CFE Luz",          320, 560, "Servicios"),
    ("Agua CESPE",       160, 280, "Servicios"),
]

# ── Transporte ────────────────────────────────────────────────────────────────
TRANSPORTE = [
    ("Camión SETA",  18,  18),   # camión público, muy frecuente
    ("Camión SETA",  18,  18),
    ("Camión SETA",  18,  18),
    ("Uber",         55,  95),   # cuando llega tarde o llueve
    ("DiDi",         48,  85),
]

# ── Comida en la universidad ─────────────────────────────────────────────────
CAFETERIA = [
    ("Cafetería UABC",    55,  90),
    ("Cafetería UABC",    50,  85),
    ("Tortas UABC",       40,  70),
    ("OXXO campus",       28,  65),   # refresco + snack entre clases
    ("OXXO campus",       20,  55),
    ("Tacos afuera de la uni", 60, 100),
]

# ── Mandado (supermercado, cada 2-3 semanas) ──────────────────────────────────
MANDADO = [
    ("Chedraui",  260, 490),
    ("Walmart",   300, 540),
    ("Soriana",   240, 450),
    ("La Comer",  280, 510),
]

# ── Salidas con la novia ──────────────────────────────────────────────────────
SALIDAS_NOVIA = [
    ("Cinépolis - cita",        180, 280, "Entretenimiento"),
    ("Cena con mi novia",       200, 400, "Entretenimiento"),
    ("Tacos - salida novia",    110, 210, "Entretenimiento"),
    ("Café con mi novia",        85, 165, "Entretenimiento"),
    ("Bowling - date night",    190, 330, "Entretenimiento"),
    ("Helados - salida",         60, 110, "Entretenimiento"),
    ("Pizza - noche de cita",   150, 260, "Entretenimiento"),
    ("Sushi - cena con novia",  200, 370, "Entretenimiento"),
    ("McDonald's - salida",      90, 150, "Entretenimiento"),
    ("Smoothies - tarde juntos", 60,  95, "Entretenimiento"),
]

# ── Servicios fijos mensuales ─────────────────────────────────────────────────
SERVICIOS_FIJOS = [
    ("Telcel plan", 199, "Servicios"),
    ("Netflix",     169, "Servicios"),
    ("Spotify",      99, "Servicios"),
]

# ── Gastos misceláneos poco frecuentes ───────────────────────────────────────
MISC = [
    # (descripción, min, max, categoría, probabilidad_relativa)
    ("Starbucks",               70, 120, "Alimentación",    12),
    ("OXXO",                    20,  75, "Alimentación",    15),
    ("Burger King",             75, 130, "Alimentación",     8),
    ("Peluquería",              80, 130, "Otros gastos",     5),
    ("Farmacia del Ahorro",     60, 180, "Salud",            4),
    ("Impresiones UABC",        15,  55, "Educación",        8),
    ("Papelería",               30,  90, "Educación",        5),
    ("Steam",                  100, 350, "Entretenimiento",  4),
    ("Lavandería Express",      60, 100, "Otros gastos",     3),
    ("Vitaminas",               80, 160, "Salud",            2),
    ("Domino's",               120, 190, "Alimentación",     5),
]
MISC_WEIGHTS = [m[4] for m in MISC]

# ── Gastos de inicio de semestre (agosto y enero) ─────────────────────────────
INICIO_SEMESTRE = [
    ("Libros Gandhi",          200, 450, "Educación"),
    ("Papelería y cuadernos",   80, 160, "Educación"),
    ("USB / material escolar",  50, 140, "Educación"),
    ("Mochila nueva",          300, 600, "Ropa"),
    ("Udemy / Coursera",       150, 300, "Educación"),
]

# ── Gastos navideños (diciembre) ──────────────────────────────────────────────
NAVIDAD = [
    ("Regalo novia",           300, 700, "Otros gastos"),
    ("Cena navideña familiar",  80, 200, "Alimentación"),
    ("Regalo familiar",        150, 400, "Otros gastos"),
    ("Decoración cuarto",       80, 200, "Otros gastos"),
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def post_tx(s, cats, desc, amount, typ, cat_name, acc_id, tx_date: date) -> bool:
    r = s.post(f"{BASE_URL}/transactions", json={
        "description": desc,
        "amount": round(float(amount), 2),
        "type": typ,
        "date": tx_date.isoformat(),
        "category_id": cats.get(cat_name),
        "account_id": acc_id,
    })
    return r.ok


def login(s: requests.Session, email: str, password: str) -> None:
    s.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": password,
        "full_name": "Andrey Demo", "use_default_categories": True,
    })
    r = s.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if not r.ok:
        print(f"✗ Login fallido: {r.text[:200]}")
        sys.exit(1)
    print(f"✓ Sesión iniciada: {email}")


def reset_data(s: requests.Session) -> None:
    for ep in ["/accounts", "/recurring", "/budgets", "/goals"]:
        items = s.get(f"{BASE_URL}{ep}").json()
        if isinstance(items, list):
            for item in items:
                s.delete(f"{BASE_URL}{ep}/{item['id']}")
    print("✓ Datos anteriores eliminados")


def get_categories(s: requests.Session) -> dict[str, str]:
    cats = s.get(f"{BASE_URL}/categories").json()
    if not cats:
        s.post(f"{BASE_URL}/categories/seed")
        cats = s.get(f"{BASE_URL}/categories").json()
    return {c["name"]: c["id"] for c in cats}


def create_accounts(s: requests.Session) -> tuple[str, str]:
    bbva = s.post(f"{BASE_URL}/accounts", json={
        "name": "BBVA Débito", "bank": "BBVA",
        "balance": 2_800, "type": "checking",
    }).json()
    nu = s.post(f"{BASE_URL}/accounts", json={
        "name": "Nu Ahorro", "bank": "Nu",
        "balance": 1_200, "type": "savings",
    }).json()
    print("✓ Cuentas: BBVA Débito $2,800 | Nu Ahorro $1,200")
    return bbva["id"], nu["id"]


def create_budgets(s: requests.Session, cats: dict) -> None:
    today = date.today()
    start = today.replace(day=1).isoformat()
    _, last = monthrange(today.year, today.month)
    end = today.replace(day=last).isoformat()

    budgets = [
        {
            "name": "Comida del mes", "amount": 1_600,
            "category_id": cats.get("Alimentación"),
            "start_date": start, "end_date": end,
            "is_recurring": True, "frequency": "monthly",
        },
        {
            "name": "Transporte semanal", "amount": 120,
            "category_id": cats.get("Transporte"),
            "start_date": start, "end_date": end,
            "is_recurring": True, "frequency": "weekly",
        },
        {
            "name": "Salidas y ocio", "amount": 600,
            "category_id": cats.get("Entretenimiento"),
            "start_date": start, "end_date": end,
            "is_recurring": True, "frequency": "monthly",
        },
    ]
    for b in budgets:
        if b["category_id"]:
            s.post(f"{BASE_URL}/budgets", json=b)
    print("✓ Presupuestos: Comida $1,600/mes | Transporte $120/semana | Ocio $600/mes")


def create_goals(s: requests.Session) -> None:
    today = date.today()
    goals = [
        {
            "name": "Laptop nueva", "emoji": "💻",
            "target_amount": 18_000, "saved_amount": 3_400,
            "deadline": f"{today.year + 1}-06-15",
        },
        {
            "name": "Viaje de verano con la novia", "emoji": "✈️",
            "target_amount": 9_000, "saved_amount": 1_200,
            "deadline": f"{today.year + 1}-07-01",
        },
        {
            "name": "Fondo de emergencia", "emoji": "🛡️",
            "target_amount": 5_000, "saved_amount": 700,
            "deadline": None,
        },
    ]
    for g in goals:
        s.post(f"{BASE_URL}/goals", json=g)
    print("✓ Metas: Laptop $18k | Viaje $9k | Emergencia $5k")


def create_recurring(s: requests.Session, cats: dict, checking_id: str) -> None:
    today = date.today()
    next_m = (today.replace(day=1) + timedelta(days=32)).replace(day=1)

    for name, amount, cat in SERVICIOS_FIJOS:
        s.post(f"{BASE_URL}/recurring", json={
            "name": name, "amount": amount, "type": "expense",
            "frequency": "monthly",
            "next_date": next_m.replace(day=random.randint(1, 5)).isoformat(),
            "category_id": cats.get(cat),
            "account_id": checking_id,
            "is_active": True,
        })
    print("✓ Recurrentes: Telcel $199 + Netflix $169 + Spotify $99")


def generate_all(
    s: requests.Session,
    cats: dict,
    checking_id: str,
    savings_id: str,
    months: int,
) -> int:
    today = date.today()
    start = today - timedelta(days=30 * months)
    # Alinear al lunes más cercano
    start -= timedelta(days=start.weekday())

    months_done: set[tuple[int, int]] = set()   # para servicios fijos (1/mes)
    weeks_since_mandado = 3                      # arranca con mandado pendiente
    bimestral_months: set[tuple[int, int]] = set()  # CFE y agua (cada 2 meses)
    total_tx = 0
    monthly_report: dict[tuple, dict] = {}

    current = start
    while current <= today:
        week_end = min(current + timedelta(days=6), today)
        mkey = (current.year, current.month)
        if mkey not in monthly_report:
            monthly_report[mkey] = {"tx": 0, "income": 0.0, "expense": 0.0}

        def add(ok: bool, amount: float, typ: str) -> None:
            if ok:
                nonlocal total_tx
                total_tx += 1
                monthly_report[mkey]["tx"] += 1
                monthly_report[mkey][typ] += amount

        # ── Ingreso semanal (trabajo sáb+dom, cobro domingo) ──────────────────
        cobro_day = current + timedelta(days=6)  # domingo
        if cobro_day > today:
            cobro_day = today
        if cobro_day >= current:
            # ~10% de semanas no trabaja (exámenes, enfermedad, días feriados)
            if random.random() > 0.10:
                pago = random.uniform(*PAGO_SEMANAL)
                ok = post_tx(s, cats, "Trabajo part-time", pago, "income", "Salario", checking_id, cobro_day)
                add(ok, pago, "income")

        # ── Apoyo semanal de la familia ($700-900 para gastos diarios) ────────
        apoyo_day = current + timedelta(days=random.randint(0, 1))  # lunes o martes
        if apoyo_day <= today:
            apoyo = random.uniform(*APOYO_SEMANAL)
            ok = post_tx(s, cats, "Apoyo semanal familia", apoyo, "income", "Otros ingresos", checking_id, apoyo_day)
            add(ok, apoyo, "income")

        # Ingreso extra ocasional (~6% de semanas)
        if random.random() < 0.06:
            desc, mn, mx, cat_e = random.choice(INGRESOS_EXTRA)
            extra_day = current + timedelta(days=random.randint(0, (week_end - current).days))
            ok = post_tx(s, cats, desc, random.uniform(mn, mx), "income", cat_e, checking_id, extra_day)
            add(ok, 0, "income")

        # ── Servicios fijos + remesa (primera semana del mes) ─────────────────
        if mkey not in months_done and current.day <= 7:
            months_done.add(mkey)
            month_d1 = current.replace(day=1)

            # Servicios personales: Telcel, Netflix, Spotify
            for svc_name, svc_amt, svc_cat in SERVICIOS_FIJOS:
                svc_day = month_d1 + timedelta(days=random.randint(1, 5))
                if svc_day > today:
                    svc_day = today
                ok = post_tx(s, cats, svc_name, svc_amt, "expense", svc_cat, checking_id, svc_day)
                add(ok, svc_amt, "expense")

            # Remesa de mamá (~$1,400-1,600 para pagar servicios del hogar)
            remesa_day = month_d1 + timedelta(days=random.randint(1, 6))
            if remesa_day > today:
                remesa_day = today
            remesa = random.uniform(*REMESA_MENSUAL)
            ok = post_tx(s, cats, "Remesa de mamá", remesa, "income", "Otros ingresos", checking_id, remesa_day)
            add(ok, remesa, "income")

            # Pago de servicios del hogar con la remesa (1-3 días después de recibirla)
            for svc_name, mn_s, mx_s, svc_cat in SERVICIOS_HOGAR_MENSUALES:
                pay_day = remesa_day + timedelta(days=random.randint(1, 3))
                if pay_day > today:
                    pay_day = today
                amt_s = random.uniform(mn_s, mx_s)
                ok = post_tx(s, cats, svc_name, amt_s, "expense", svc_cat, checking_id, pay_day)
                add(ok, amt_s, "expense")

            # CFE y Agua: bimestrales (meses impares: ene, mar, may, jul, sep, nov)
            if current.month % 2 == 1:
                bkey = (current.year, current.month)
                if bkey not in bimestral_months:
                    bimestral_months.add(bkey)
                    for svc_name, mn_s, mx_s, svc_cat in SERVICIOS_HOGAR_BIMESTRALES:
                        pay_day = remesa_day + timedelta(days=random.randint(2, 5))
                        if pay_day > today:
                            pay_day = today
                        amt_s = random.uniform(mn_s, mx_s)
                        ok = post_tx(s, cats, svc_name, amt_s, "expense", svc_cat, checking_id, pay_day)
                        add(ok, amt_s, "expense")

            # Inicio de semestre: agosto y enero → materiales escolares
            if current.month in (1, 8):
                n_items = random.randint(2, 4)
                for item in random.sample(INICIO_SEMESTRE, min(n_items, len(INICIO_SEMESTRE))):
                    desc_s, mn_s, mx_s, cat_s = item
                    school_day = current + timedelta(days=random.randint(0, 10))
                    if school_day > today:
                        school_day = today
                    amt_s = random.uniform(mn_s, mx_s)
                    ok = post_tx(s, cats, desc_s, amt_s, "expense", cat_s, checking_id, school_day)
                    add(ok, amt_s, "expense")

            # Diciembre: regalos navideños (2-3 gastos)
            if current.month == 12:
                for item in random.sample(NAVIDAD, random.randint(2, 3)):
                    desc_n, mn_n, mx_n, cat_n = item
                    nav_day = current + timedelta(days=random.randint(1, 20))
                    if nav_day > today:
                        nav_day = today
                    amt_n = random.uniform(mn_n, mx_n)
                    ok = post_tx(s, cats, desc_n, amt_n, "expense", cat_n, checking_id, nav_day)
                    add(ok, amt_n, "expense")

        # ── Mandado (cada 2-3 semanas, sábado o domingo) ─────────────────────
        do_mandado = weeks_since_mandado >= random.randint(2, 3)
        if do_mandado:
            weeks_since_mandado = 0
            mandado_dow = random.choice([5, 6])  # sáb=5 o dom=6
            days_in_week = (week_end - current).days
            mandado_day = current + timedelta(days=min(mandado_dow, days_in_week))
            store, mn, mx = random.choice(MANDADO)
            amt = random.uniform(mn, mx)
            ok = post_tx(s, cats, store, amt, "expense", "Alimentación", checking_id, mandado_day)
            add(ok, amt, "expense")
        else:
            weeks_since_mandado += 1

        # ── Transporte (2-3 días de lunes a jueves) ──────────────────────────
        uni_days_count = random.randint(2, 3)
        days_in_week = (week_end - current).days
        lun_jue = [d for d in range(min(4, days_in_week + 1))]   # 0=lun, 3=jue
        random.shuffle(lun_jue)
        uni_days = lun_jue[:uni_days_count]

        for dow in uni_days:
            tx_day = current + timedelta(days=dow)
            if tx_day > today:
                continue
            merch, mn, mx = random.choice(TRANSPORTE)
            amt = random.uniform(mn, mx)
            ok = post_tx(s, cats, merch, amt, "expense", "Transporte", checking_id, tx_day)
            add(ok, amt, "expense")

        # ── Comida en la uni ──────────────────────────────────────────────────
        # Semanas de mandado → solo 1 visita a la cafetería
        # Semanas normales → 2-4 visitas, preferentemente en días de uni
        cafe_count = 1 if do_mandado else random.randint(2, 4)
        cafe_pool = uni_days if uni_days else [0]

        for _ in range(min(cafe_count, len(cafe_pool))):
            dow = random.choice(cafe_pool)
            tx_day = current + timedelta(days=dow)
            if tx_day > today:
                continue
            merch, mn, mx = random.choice(CAFETERIA)
            amt = random.uniform(mn, mx)
            ok = post_tx(s, cats, merch, amt, "expense", "Alimentación", checking_id, tx_day)
            add(ok, amt, "expense")

        # ── Salida con la novia (vie o sáb, ~60% de semanas) ─────────────────
        if random.random() < 0.60:
            outing_dow = random.choice([4, 5])   # viernes=4, sábado=5
            days_avail = (week_end - current).days
            if outing_dow <= days_avail:
                tx_day = current + timedelta(days=outing_dow)
                if tx_day <= today:
                    place, mn, mx, cat_o = random.choice(SALIDAS_NOVIA)
                    amt = random.uniform(mn, mx)
                    ok = post_tx(s, cats, place, amt, "expense", cat_o, checking_id, tx_day)
                    add(ok, amt, "expense")

                    # Segunda salida esa semana (~20% de las veces que salen)
                    if random.random() < 0.20:
                        day2_dow = 5 if outing_dow == 4 else 4
                        if day2_dow <= days_avail:
                            day2 = current + timedelta(days=day2_dow)
                            if day2 <= today:
                                place2, mn2, mx2, cat2 = random.choice(SALIDAS_NOVIA)
                                amt2 = random.uniform(mn2, mx2)
                                ok2 = post_tx(s, cats, place2, amt2, "expense", cat2, checking_id, day2)
                                add(ok2, amt2, "expense")

        # ── Gastos varios (OXXO, Starbucks, farmacia...) ~25% días ──────────
        days_in_week_actual = (week_end - current).days + 1
        for dow in range(days_in_week_actual):
            if random.random() > 0.28:
                continue
            tx_day = current + timedelta(days=dow)
            if tx_day > today:
                continue
            desc_m, mn_m, mx_m, cat_m, _ = random.choices(MISC, weights=MISC_WEIGHTS)[0]
            # Ropa y salud muy poco frecuentes en el día a día
            if cat_m == "Ropa" and random.random() < 0.94:
                continue
            if cat_m == "Salud" and random.random() < 0.75:
                continue
            if cat_m == "Entretenimiento" and random.random() < 0.80:
                continue
            amt_m = random.uniform(mn_m, mx_m)
            ok = post_tx(s, cats, desc_m, amt_m, "expense", cat_m, checking_id, tx_day)
            add(ok, amt_m, "expense")

        current += timedelta(days=7)

    # ── Reporte mensual ───────────────────────────────────────────────────────
    print(f"\nHistorial generado:\n")
    for (y, m), stats in sorted(monthly_report.items()):
        label = f"{y}-{m:02d}"
        print(f"  {label}  ingresos ~${int(stats['income']):>6,}  |  "
              f"gastos ~${int(stats['expense']):>6,}  |  {stats['tx']:>3} tx")

    return total_tx


def main() -> None:
    parser = argparse.ArgumentParser(description="Monedge — seed estudiante universitario")
    parser.add_argument("--email",    default="demo@monedge.dev")
    parser.add_argument("--password", default="demo1234")
    parser.add_argument("--months",   type=int, default=12)
    args = parser.parse_args()

    random.seed(42)

    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})

    print(f"\n{'='*60}")
    print(f"  Monedge — Seed estudiante  ({args.months} meses)")
    print(f"{'='*60}\n")

    login(s, args.email, args.password)
    reset_data(s)
    cats = get_categories(s)
    checking_id, savings_id = create_accounts(s)
    create_budgets(s, cats)
    create_goals(s)
    create_recurring(s, cats, checking_id)

    print(f"\nGenerando {args.months} meses de historial...")
    total = generate_all(s, cats, checking_id, savings_id, args.months)

    print(f"\n{'='*60}")
    print(f"  Total: {total} transacciones generadas")
    print(f"  Usuario: {args.email} / {args.password}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
