from google import genai
from google.genai import types
from app.core.config import settings
from decimal import Decimal
import json
import re

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GOOGLE_AI_API_KEY)
    return _client


async def categorize_transaction(
    description: str,
    amount: float,
    categories: list[dict],
) -> dict:
    if not settings.GOOGLE_AI_API_KEY:
        return {"category_name": "Otros", "emoji": "📦", "category_id": None}

    cat_list = "\n".join(
        f"- {c['name']} {c['emoji'] or ''}" + (f": {c['description']}" if c.get("description") else "")
        for c in categories
    )
    prompt = (
        f"Eres un asistente de finanzas personales. "
        f"Dada la siguiente descripción de transacción, elige la categoría más apropiada de la lista.\n\n"
        f"Descripción: {description}\n"
        f"Monto: ${amount:,.0f}\n\n"
        f"Categorías disponibles:\n{cat_list}\n\n"
        f"Responde SOLO con un JSON válido con este formato exacto:\n"
        f'{{"category_name": "nombre", "emoji": "emoji"}}\n'
        f"No incluyas texto adicional."
    )

    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model=settings.GEMMA_MODEL,
            contents=prompt,
        )
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            matched = next((c for c in categories if c["name"] == data.get("category_name")), None)
            if matched:
                data["category_id"] = str(matched["id"])
            return data
    except Exception:
        pass

    return {"category_name": "Otros", "emoji": "📦", "category_id": None}


async def suggest_category_description(name: str, emoji: str | None, type_str: str) -> str:
    if not settings.GOOGLE_AI_API_KEY:
        return ""

    type_label = "gasto" if type_str == "expense" else "ingreso"
    prompt = (
        f"Genera una descripción corta (máximo 10 palabras) para una categoría financiera personal.\n"
        f"Nombre: {name} {emoji or ''}\n"
        f"Tipo: {type_label}\n\n"
        f"Explica qué tipo de transacciones pertenecen a esta categoría. "
        f"Solo la descripción, sin puntuación al final, en español."
    )

    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model=settings.GEMMA_MODEL,
            contents=prompt,
        )
        return response.text.strip()
    except Exception:
        return ""


async def generate_summary(user_context: dict) -> str:
    if not settings.GOOGLE_AI_API_KEY:
        return "Activa tu API key de Google AI Studio para obtener el resumen con IA."

    name = user_context.get("name", "")
    total_balance = user_context.get("total_balance", 0)
    monthly_income = user_context.get("monthly_income", 0)
    monthly_expenses = user_context.get("monthly_expenses", 0)
    budgets = user_context.get("budgets", [])
    goals = user_context.get("goals", [])

    budget_text = ""
    for b in budgets[:3]:
        pct = (float(b.get("spent", 0)) / float(b.get("amount", 1))) * 100 if b.get("amount") else 0
        budget_text += f"- {b['name']}: {pct:.0f}% usado\n"

    goal_text = ""
    for g in goals[:3]:
        pct = (float(g.get("saved_amount", 0)) / float(g.get("target_amount", 1))) * 100 if g.get("target_amount") else 0
        goal_text += f"- {g['name']}: {pct:.0f}% completado\n"

    has_data = total_balance > 0 or monthly_income > 0 or monthly_expenses > 0

    prompt = (
        f"Eres Monedge, un asistente financiero personal. "
        f"Escribe en español 1-2 oraciones de resumen para {name}.\n\n"
        f"Datos del mes:\n"
        f"- Balance total: ${total_balance:,.0f}\n"
        f"- Ingresos: ${monthly_income:,.0f}\n"
        f"- Gastos: ${monthly_expenses:,.0f}\n"
        f"Presupuestos:\n{budget_text or 'Sin presupuestos activos.'}\n"
        f"Metas:\n{goal_text or 'Sin metas activas.'}\n\n"
        + (
            "Describe la situación actual con números específicos. Sin frases genéricas."
            if has_data else
            "El usuario aún no tiene movimientos registrados este mes. Dile en 1 oración qué puede hacer para empezar a usar Monedge. Sin frases motivacionales genéricas."
        )
    )

    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model=settings.GEMMA_MODEL,
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        return f"No se pudo generar el resumen: {str(e)}"


async def generate_recommendations(user_context: dict) -> dict:
    if not settings.GOOGLE_AI_API_KEY:
        return {"text": "Activa tu API key de Google AI Studio para obtener recomendaciones.", "actions": None}

    name = user_context.get("name", "")
    monthly_income = user_context.get("monthly_income", 0)
    monthly_expenses = user_context.get("monthly_expenses", 0)
    budgets = user_context.get("budgets", [])
    goals = user_context.get("goals", [])
    top_categories = user_context.get("top_categories", [])
    category_names = user_context.get("category_names", [])

    savings_rate = ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0
    has_data = monthly_income > 0 or monthly_expenses > 0 or len(top_categories) >= 2

    cat_text = "\n".join(f"- {c['name']}: ${c['total']:,.0f}" for c in top_categories[:5])
    budget_text = ""
    for b in budgets:
        pct = (float(b.get("spent", 0)) / float(b.get("amount", 1))) * 100 if b.get("amount") else 0
        budget_text += f"- {b['name']}: {pct:.0f}% de ${float(b.get('amount', 0)):,.0f}\n"
    existing_budgets = [b["name"] for b in budgets]
    existing_goals   = [g["name"] for g in goals]

    if not has_data:
        prompt = (
            f"Eres Monedge. {name} aún no tiene suficientes datos este mes.\n"
            f"Ingresos: ${monthly_income:,.0f} | Gastos: ${monthly_expenses:,.0f}\n"
            f"Responde SOLO con JSON válido sin markdown:\n"
            f'{{"text":"1-2 oraciones directas sobre qué registrar primero","actions":null}}'
        )
    else:
        prompt = (
            f"Eres Monedge, asesor financiero de {name}.\n\n"
            f"Datos del mes:\n"
            f"- Ingresos: ${monthly_income:,.0f} | Gastos: ${monthly_expenses:,.0f} | Ahorro: {savings_rate:.1f}%\n"
            f"Gastos por categoría:\n{cat_text or 'Sin datos.'}\n"
            f"Presupuestos activos: {budget_text or 'Ninguno.'}\n"
            f"Metas activas: {', '.join(existing_goals) or 'Ninguna.'}\n"
            f"Categorías disponibles: {', '.join(category_names)}\n\n"
            f"Responde SOLO con JSON válido (sin markdown, sin comillas dobles dentro de strings):\n"
            f'{{"text":"1. recomendación concreta con número\\n2. recomendación concreta con número",'
            f'"actions":[{{"type":"budget","label":"texto del botón acción",'
            f'"data":{{"name":"nombre presupuesto","amount":monto_numero,"category_name":"nombre exacto de la lista","frequency":"monthly"}}}}]}}\n\n'
            f"Reglas para actions:\n"
            f"- Incluye 1 acción MAX si hay algo obvio que crear (presupuesto o meta).\n"
            f"- Solo sugiere presupuesto si esa categoría NO tiene ya uno en la lista de presupuestos activos.\n"
            f"- Solo sugiere meta si NO existe ya una con propósito similar.\n"
            f"- category_name debe ser exactamente uno de: {', '.join(category_names)}.\n"
            f"- Para meta: type='goal', data debe tener name, emoji, target_amount.\n"
            f"- Si no hay acción clara o ya existen: actions: null.\n"
            f"- NO uses comillas dobles dentro de los valores de texto."
        )

    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model=settings.GEMMA_MODEL,
            contents=prompt,
        )
        raw = response.text.strip()
        raw = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                clean = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', match.group())
                data = json.loads(clean)
                return {"text": data.get("text", ""), "actions": data.get("actions")}
            except Exception:
                pass
        # Fallback: devolver como texto plano sin acciones
        return {"text": raw[:500], "actions": None}
    except Exception as e:
        return {"text": f"No se pudo generar las recomendaciones: {str(e)}", "actions": None}


async def analyze_query(db, user_id, query: str, history: list[dict] | None = None) -> dict:
    """
    Endpoint potente: corre agregaciones SQL reales antes de llamar a Gemini.
    Devuelve { text, chart: {type, title, data} | None, metrics: [{label, value}] | None }
    """
    if not settings.GOOGLE_AI_API_KEY:
        return {"text": "Activa tu API key para usar el Laboratorio IA.", "chart": None, "metrics": None}

    from sqlalchemy import select
    from sqlalchemy.orm import joinedload
    from app.models.transaction import Transaction
    from app.models.budget import Budget
    from app.models.goal import Goal
    from datetime import date, timedelta
    import statistics as stats_lib

    today = date.today()
    six_months_ago = today - timedelta(days=180)

    # ── Fetch transacciones (6 meses) con categorías ──────────────────────────
    result = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.user_id == user_id, Transaction.date >= six_months_ago)
        .order_by(Transaction.date)
    )
    txs = result.scalars().all()

    exp_txs = [t for t in txs if t.type == "expense"]
    inc_txs = [t for t in txs if t.type == "income"]

    # ── Totales globales ──────────────────────────────────────────────────────
    total_exp = sum(float(t.amount) for t in exp_txs)
    total_inc = sum(float(t.amount) for t in inc_txs)
    savings_rate = ((total_inc - total_exp) / total_inc * 100) if total_inc > 0 else 0

    # ── Desglose mensual ─────────────────────────────────────────────────────
    monthly: dict[str, dict] = {}
    for t in txs:
        key = f"{t.date.year}-{t.date.month:02d}"
        if key not in monthly:
            monthly[key] = {"income": 0.0, "expense": 0.0, "label": t.date.strftime("%b %Y")}
        if t.type == "income":
            monthly[key]["income"] += float(t.amount)
        else:
            monthly[key]["expense"] += float(t.amount)
    monthly_list = [
        {"month": k, "label": v["label"], "income": round(v["income"], 2),
         "expense": round(v["expense"], 2), "savings": round(v["income"] - v["expense"], 2)}
        for k, v in sorted(monthly.items())
    ]

    # Tendencia de gastos (regresión lineal simple)
    exp_series = [m["expense"] for m in monthly_list]
    trend_label = "estable"
    if len(exp_series) >= 3:
        n = len(exp_series)
        xm = (n - 1) / 2
        ym = sum(exp_series) / n
        slope = sum((i - xm) * (y - ym) for i, y in enumerate(exp_series)) / sum((i - xm) ** 2 for i in range(n))
        trend_label = "en aumento" if slope > 50 else "en descenso" if slope < -50 else "estable"

    # ── Categorías ────────────────────────────────────────────────────────────
    cat_map: dict[str, dict] = {}
    for t in exp_txs:
        name = t.category.name if t.category else "Sin categoría"
        emoji = t.category.emoji if t.category else "📦"
        if name not in cat_map:
            cat_map[name] = {"amount": 0.0, "count": 0, "emoji": emoji}
        cat_map[name]["amount"] += float(t.amount)
        cat_map[name]["count"] += 1
    top_cats = sorted(
        [{"category": k, "emoji": v["emoji"], "amount": round(v["amount"], 2), "count": v["count"]}
         for k, v in cat_map.items()],
        key=lambda x: x["amount"], reverse=True
    )[:8]

    # ── Patrones por día de semana ────────────────────────────────────────────
    day_names = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    day_totals, day_counts = [0.0] * 7, [0] * 7
    for t in exp_txs:
        dow = t.date.weekday()
        day_totals[dow] += float(t.amount)
        day_counts[dow] += 1
    day_patterns = [
        {"day": day_names[i], "avg_expense": round(day_totals[i] / day_counts[i], 2) if day_counts[i] > 0 else 0}
        for i in range(7)
    ]
    peak_day = max(day_patterns, key=lambda x: x["avg_expense"])["day"] if any(d["avg_expense"] > 0 for d in day_patterns) else "N/A"

    # ── Estadísticas de gasto diario ─────────────────────────────────────────
    avg_daily_exp = total_exp / 180 if total_exp > 0 else 0
    amounts = [float(t.amount) for t in exp_txs]
    volatility = round(stats_lib.stdev(amounts), 2) if len(amounts) >= 2 else 0
    median_exp = round(stats_lib.median(amounts), 2) if amounts else 0
    max_expense = max(amounts) if amounts else 0

    # ── Gastos recurrentes (misma descripción > 1 vez) ───────────────────────
    desc_map: dict[str, dict] = {}
    for t in exp_txs:
        k = (t.description or "").strip().lower()
        if not k:
            continue
        if k not in desc_map:
            desc_map[k] = {"desc": t.description, "count": 0, "total": 0.0}
        desc_map[k]["count"] += 1
        desc_map[k]["total"] += float(t.amount)
    recurring = sorted(
        [v for v in desc_map.values() if v["count"] > 1],
        key=lambda x: x["count"], reverse=True
    )[:5]

    # ── Presupuestos ─────────────────────────────────────────────────────────
    bud_res = await db.execute(select(Budget).where(Budget.user_id == user_id))
    budgets = bud_res.scalars().all()
    # Calcular spent para cada presupuesto usando transacciones etiquetadas
    bud_spent: dict = {}
    for t in exp_txs:
        if t.budget_id:
            bid = str(t.budget_id)
            bud_spent[bid] = bud_spent.get(bid, 0.0) + float(t.amount)
    budget_status = [
        {"name": b.name, "limit": float(b.amount),
         "spent": round(bud_spent.get(str(b.id), 0.0), 2),
         "pct": round(bud_spent.get(str(b.id), 0.0) / float(b.amount) * 100, 1) if b.amount > 0 else 0}
        for b in budgets
    ]

    # ── Metas ─────────────────────────────────────────────────────────────────
    goal_res = await db.execute(select(Goal).where(Goal.user_id == user_id))
    goals = goal_res.scalars().all()
    goal_status = [
        {"name": g.name, "target": float(g.target_amount), "saved": float(g.saved_amount),
         "pct": round(float(g.saved_amount) / float(g.target_amount) * 100, 1) if g.target_amount > 0 else 0,
         "remaining": round(float(g.target_amount) - float(g.saved_amount), 2)}
        for g in goals
    ]

    # ── Prompt ───────────────────────────────────────────────────────────────
    context_block = f"""DATOS REALES DEL USUARIO (últimos 6 meses):
Totales: ingresos ${total_inc:,.0f} | gastos ${total_exp:,.0f} | tasa ahorro {savings_rate:.1f}%
Gasto diario promedio: ${avg_daily_exp:,.0f} | mediana por transacción: ${median_exp:,.0f} | mayor gasto: ${max_expense:,.0f}
Tendencia de gastos: {trend_label}
Día con mayor gasto promedio: {peak_day}
Transacciones en el período: {len(txs)} (gastos: {len(exp_txs)}, ingresos: {len(inc_txs)})

Desglose mensual: {json.dumps(monthly_list, ensure_ascii=False)}
Top categorías: {json.dumps(top_cats, ensure_ascii=False)}
Patrones por día: {json.dumps(day_patterns, ensure_ascii=False)}
Gastos recurrentes: {json.dumps(recurring, ensure_ascii=False)}
Presupuestos: {json.dumps(budget_status, ensure_ascii=False)}
Metas: {json.dumps(goal_status, ensure_ascii=False)}"""

    history_block = ""
    if history:
        history_block = "CONVERSACIÓN PREVIA (usa este contexto para responder la nueva pregunta):\n"
        for msg in history[-4:]:  # máximo 2 intercambios de contexto
            prefix = "Usuario" if msg.get("role") == "user" else "Asistente"
            history_block += f"{prefix}: {msg.get('text', '')}\n"
        history_block += "\n"

    prompt = f"""Eres Monedge, un analista financiero personal con acceso a datos reales del usuario.
Tienes tiempo para razonar antes de responder — úsalo para identificar patrones no obvios, calcular proyecciones precisas y elegir la visualización más útil.

LÍMITE DE TEMAS: Solo puedes responder preguntas relacionadas con las finanzas personales del usuario: gastos, ingresos, presupuestos, metas, ahorros, categorías, transacciones y análisis financiero. Si la pregunta no tiene relación con estos temas, responde exactamente con este JSON y nada más: {{"text":"Solo puedo ayudarte con tus finanzas personales. Pregúntame sobre tus gastos, ingresos, presupuestos o metas.","chart":null,"metrics":null}}

{history_block}PREGUNTA ACTUAL: "{query}"

{context_block}

INSTRUCCIONES DE ANÁLISIS:
1. Identifica qué aspecto financiero es más relevante para la pregunta (gasto, ahorro, tendencia, categoría, proyección).
2. Cruza los datos: no respondas solo lo evidente; busca correlaciones o anomalías en los datos.
3. Si la pregunta es hipotética ("¿qué pasa si...?"), calcula la proyección exacta con los datos reales.
4. Elige el tipo de gráfica más informativo: "bar" para comparativas, "line" para tendencias temporales, "pie" para distribuciones proporcionales.
5. Las métricas deben ser las 2-4 cifras clave que resumen la situación, no repetir lo del texto.

Responde SOLO con JSON válido (sin markdown, sin ```). Formato exacto:
{{"text":"análisis directo 2-4 oraciones con números concretos y conclusión accionable","chart":{{"type":"bar","title":"título descriptivo","data":[{{"label":"etiqueta","value":número}}]}},"metrics":[{{"label":"nombre","value":"$X o X%"}}]}}

Restricciones:
- "text": sin saludos, sin relleno. Empieza con el hallazgo principal. NUNCA uses comillas dobles dentro del texto; usa comillas simples si necesitas citar algo.
- "chart": máx 8 puntos. null solo si realmente no aporta nada visual.
- "metrics": null si no aplica."""

    try:
        client = _get_client()
        try:
            thinking_cfg = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(
                    thinking_budget=settings.ANALYZE_THINKING_BUDGET,
                )
            )
            response = await client.aio.models.generate_content(
                model=settings.GEMMA_MODEL,
                contents=prompt,
                config=thinking_cfg,
            )
        except Exception as think_err:
            if "thinking" in str(think_err).lower() or "INVALID_ARGUMENT" in str(think_err):
                response = await client.aio.models.generate_content(
                    model=settings.GEMMA_MODEL,
                    contents=prompt,
                )
            else:
                raise
        raw = response.text.strip()
        # Limpiar bloques markdown
        raw = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()
        # Extraer el primer bloque JSON
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            json_str = match.group()
            # Estrategia 1: corregir escapes inválidos y parsear
            try:
                clean = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', json_str)
                data = json.loads(clean)
                return {
                    "text":    data.get("text", ""),
                    "chart":   data.get("chart"),
                    "metrics": data.get("metrics"),
                }
            except json.JSONDecodeError:
                pass
            # Estrategia 2: extraer campo "text" con regex cuando el JSON está roto
            # (comillas sin escapar dentro del valor de text)
            text_match = re.search(
                r'"text"\s*:\s*"(.*?)"(?:\s*,\s*"(?:chart|metrics)"|\s*})',
                json_str, re.DOTALL
            )
            if text_match:
                text_val = text_match.group(1).replace('\\"', '"')
                # Intentar extraer chart y metrics del resto
                chart_match   = re.search(r'"chart"\s*:\s*(\{.*?\}|null)', json_str, re.DOTALL)
                metrics_match = re.search(r'"metrics"\s*:\s*(\[.*?\]|null)',  json_str, re.DOTALL)
                chart   = None
                metrics = None
                try:
                    if chart_match and chart_match.group(1) != "null":
                        chart = json.loads(chart_match.group(1))
                except Exception:
                    pass
                try:
                    if metrics_match and metrics_match.group(1) != "null":
                        metrics = json.loads(metrics_match.group(1))
                except Exception:
                    pass
                return {"text": text_val, "chart": chart, "metrics": metrics}
        # Estrategia 3: devolver el texto plano si no se pudo parsear nada
        if raw:
            return {"text": raw[:600], "chart": None, "metrics": None}
    except Exception as e:
        return {"text": f"Error al analizar: {str(e)}", "chart": None, "metrics": None}

    return {"text": "No se pudo generar el análisis.", "chart": None, "metrics": None}


async def query_finances(user_context: dict) -> str:
    if not settings.GOOGLE_AI_API_KEY:
        return "Activa tu API key de Google AI Studio para usar consultas con IA."

    query = user_context.get("query", "")
    income = user_context.get("total_income", 0)
    expenses = user_context.get("total_expenses", 0)
    tx_count = user_context.get("tx_count", 0)
    cat_breakdown = user_context.get("category_breakdown", "")
    recent_txs = user_context.get("recent_txs", "")
    period = user_context.get("period", "últimos 30 días")

    prompt = (
        f"Eres Monedge, un asistente de finanzas personales. "
        f"El usuario pregunta: \"{query}\"\n\n"
        f"Datos disponibles ({period}):\n"
        f"- Ingresos totales: ${income:,.0f}\n"
        f"- Gastos totales: ${expenses:,.0f}\n"
        f"- Número de transacciones: {tx_count}\n\n"
        f"Gastos por categoría:\n{cat_breakdown or 'Sin datos de categorías.'}\n\n"
        f"Transacciones recientes:\n{recent_txs or 'Sin transacciones.'}\n\n"
        f"Reglas:\n"
        f"- Responde en español, máximo 2-3 oraciones.\n"
        f"- Usa números concretos de los datos cuando sea relevante.\n"
        f"- Si la pregunta no puede responderse con estos datos, dilo en 1 oración.\n"
        f"- No inventes información que no esté en los datos.\n"
        f"- No añadas saludos ni cierres; solo la respuesta directa."
    )

    try:
        client = _get_client()
        response = await client.aio.models.generate_content(
            model=settings.GEMMA_MODEL,
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        return f"No se pudo procesar la consulta: {str(e)}"
