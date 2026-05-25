"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { getDashboard, aiSummary } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

function fmt(n: number) {
  return (
    "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
}
function pct(a: number, b: number) {
  return b > 0 ? Math.min((a / b) * 100, 100) : 0;
}

export default function InicioPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingS] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((d) => {
        if (!d) return;
        const parsed = {
          ...d,
          total_balance: Number(d.total_balance),
          monthly_income: Number(d.monthly_income),
          monthly_expenses: Number(d.monthly_expenses),
          credit_debt: Number(d.credit_debt ?? 0),
          safe_daily_budget: Number(d.safe_daily_budget),
          avg_daily_expense: Number(d.avg_daily_expense ?? 0),
          budgets: (d.budgets ?? []).map((b) => ({
            ...b,
            amount: Number(b.amount),
            spent: Number(b.spent),
          })),
          goals: (d.goals ?? []).map((g) => ({
            ...g,
            target_amount: Number(g.target_amount),
            saved_amount: Number(g.saved_amount),
          })),
          accounts: (d.accounts ?? []).map((a) => ({
            ...a,
            balance: Number(a.balance),
          })),
        };
        setData(parsed);

        const hasActivity =
          Number(parsed.monthly_income) > 0 ||
          Number(parsed.monthly_expenses) > 0 ||
          (parsed.recent_transactions ?? []).length > 0;

        if (hasActivity) {
          fetchSummary();
        } else {
          setSummary("__no_data__");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function fetchSummary() {
    setLoadingS(true);
    try {
      const r = await aiSummary();
      setSummary(r.text);
    } catch {
      setSummary("No se pudo cargar el resumen.");
    } finally {
      setLoadingS(false);
    }
  }

  if (loading)
    return (
      <div className="space-y-5 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1e2433] rounded-xl h-32 border border-gray-200 dark:border-gray-700/60"
          />
        ))}
      </div>
    );

  if (!data)
    return <div className="text-gray-500 text-sm">Error cargando datos.</div>;

  const monthlyFlow = data.monthly_income - data.monthly_expenses;
  const savingsRate =
    data.monthly_income > 0 ? (monthlyFlow / data.monthly_income) * 100 : 0;

  // Presupuesto más en riesgo
  const riskBudget =
    data.budgets.length > 0
      ? [...data.budgets]
          .map((b) => ({
            ...b,
            usedPct: b.amount > 0 ? (b.spent / b.amount) * 100 : 0,
          }))
          .sort((a, b) => b.usedPct - a.usedPct)[0]
      : null;
  const showBudgetAlert = riskBudget && riskBudget.usedPct >= 70;

  // Meta más cercana a completarse
  const closestGoal = (() => {
    const inc = data.goals.filter((g) => g.saved_amount < g.target_amount);
    if (!inc.length) return null;
    return [...inc]
      .map((g) => ({
        ...g,
        goalPct:
          g.target_amount > 0 ? (g.saved_amount / g.target_amount) * 100 : 0,
      }))
      .sort((a, b) => b.goalPct - a.goalPct)[0];
  })();

  // Top 5 cuentas por ingreso total — ya vienen ordenadas del backend
  const topAccounts = data.accounts.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* ── Resumen IA ── */}
      <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#165BC5] uppercase tracking-wider">
                Resumen con IA
              </span>
              <button
                onClick={() => summary !== "__no_data__" && fetchSummary()}
                disabled={summary === "__no_data__"}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-gray-400 ${loadingSummary ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
              {loadingSummary
                ? "Generando resumen..."
                : summary === "__no_data__"
                ? "Registra tus primeros movimientos para activar el resumen con IA."
                : summary === null
                ? "Cargando..."
                : summary}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos del mes */}
        <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="text-sm text-gray-400 mb-2">Ingresos del Mes</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {fmt(data.monthly_income)}
          </div>
          <div className="mt-2.5">
            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 text-xs font-semibold rounded-full">
              Este mes
            </span>
          </div>
        </div>

        {/* Gastos del mes */}
        <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="text-sm text-gray-400 mb-2">Gastos del Mes</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {fmt(data.monthly_expenses)}
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 text-xs font-semibold rounded-full">
              Este mes
            </span>
            {data.monthly_income > 0 && (
              <span className="text-xs text-gray-400">
                {savingsRate.toFixed(0)}% ahorro
              </span>
            )}
          </div>
        </div>

        {/* Balance del mes */}
        <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="text-sm text-gray-400 mb-2">Balance del Mes</div>
          <div className={`text-2xl font-bold ${monthlyFlow >= 0 ? "text-gray-900 dark:text-gray-100" : "text-red-500"}`}>
            {monthlyFlow >= 0 ? "+" : ""}{fmt(monthlyFlow)}
          </div>
          <div className="mt-2.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
              monthlyFlow >= 0
                ? "bg-green-50 dark:bg-green-900/30 text-green-700"
                : "bg-red-50 dark:bg-red-900/30 text-red-600"
            }`}>
              {monthlyFlow >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {monthlyFlow >= 0 ? "Ahorrando" : "Déficit"}
            </span>
          </div>
        </div>

        {/* Puedes gastar hoy — héroe */}
        <div className="bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-bl-full" />
          <div className="text-sm text-blue-200 font-semibold mb-2">
            Puedes gastar hoy
          </div>
          <div className="text-3xl font-bold text-white">
            {fmt(data.safe_daily_budget)}
          </div>
          <div className="mt-2.5 text-xs text-blue-200">
            Presupuesto diario recomendado
          </div>
          {data.avg_daily_expense > 0 && (() => {
            const diff = data.safe_daily_budget - data.avg_daily_expense;
            const isAbove = diff >= 0;
            return (
              <div className={`mt-1.5 text-xs font-medium ${isAbove ? "text-green-300" : "text-red-300"}`}>
                {isAbove ? "▲" : "▼"} {fmt(Math.abs(diff))} vs tu promedio histórico ({fmt(data.avg_daily_expense)}/día)
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Alertas contextuales (condicionales) ── */}
      {(showBudgetAlert || closestGoal) && (
        <div
          className={`grid gap-4 ${showBudgetAlert && closestGoal ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          {showBudgetAlert && riskBudget && (
            <div
              className={`flex items-start gap-3 rounded-xl p-4 border ${
                riskBudget.usedPct >= 100
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40"
              }`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-black/20 text-base">
                {riskBudget.category_emoji ?? "📊"}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold mb-0.5 ${
                    riskBudget.usedPct >= 100
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {riskBudget.usedPct >= 100
                    ? "Presupuesto excedido"
                    : "Presupuesto en riesgo"}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {riskBudget.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {riskBudget.usedPct >= 100
                    ? `Excedido por ${fmt(riskBudget.spent - riskBudget.amount)}`
                    : `Queda ${fmt(riskBudget.amount - riskBudget.spent)} · ${riskBudget.usedPct.toFixed(0)}% usado`}
                </p>
              </div>
              <Link
                href="/panel/planificacion"
                className="text-xs text-[#165BC5] hover:underline flex-shrink-0 pt-0.5"
              >
                Ver
              </Link>
            </div>
          )}

          {closestGoal && (
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/60 dark:bg-black/20 text-base">
                {closestGoal.emoji ?? "🎯"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#165BC5] mb-0.5">
                  Meta más cercana
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {closestGoal.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Falta{" "}
                  {fmt(closestGoal.target_amount - closestGoal.saved_amount)} ·{" "}
                  {closestGoal.goalPct.toFixed(0)}% completada
                </p>
              </div>
              <Link
                href="/panel/planificacion"
                className="text-xs text-[#165BC5] hover:underline flex-shrink-0 pt-0.5"
              >
                Ver
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Movimientos | Cuentas | Presupuestos+Metas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Últimos movimientos */}
        <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Últimos movimientos
            </h3>
            <Link
              href="/panel/movimientos"
              className="text-xs text-[#165BC5] hover:underline flex items-center gap-0.5"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {data.recent_transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin movimientos aún
            </p>
          ) : (
            <div className="space-y-1.5 overflow-y-auto max-h-72 pr-1">
              {data.recent_transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-2.5 py-2 px-2 hover:bg-gray-50 dark:hover:bg-[#252d3d] rounded-lg"
                >
                  <span className="text-base">{tx.category_emoji ?? "💳"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {tx.description}
                    </div>
                    <div className="text-xs text-gray-400">{tx.date}</div>
                  </div>
                  <span
                    className={`text-xs font-bold flex-shrink-0 ${tx.type === "income" ? "text-green-600" : "text-gray-900 dark:text-gray-100"}`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cuentas (top 3 por saldo) */}
        <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Cuentas
            </h3>
            <Link
              href="/panel/billetera"
              className="text-xs text-[#165BC5] hover:underline flex items-center gap-0.5"
            >
              Ver detalle <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {topAccounts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin cuentas registradas
            </p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
              {topAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 bg-gray-50 dark:bg-[#252d3d] rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {acc.name}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {acc.bank ?? "—"}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {fmt(acc.balance)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/40 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total en cuentas
            </span>
            <span className="text-sm font-bold text-[#165BC5]">
              {fmt(data.total_balance)}
            </span>
          </div>
        </div>

        {/* Presupuestos + Metas */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Presupuestos
              </h3>
              <Link
                href="/panel/planificacion"
                className="text-xs text-[#165BC5] hover:underline flex items-center gap-0.5"
              >
                Gestionar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {data.budgets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                Sin presupuestos
              </p>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-48 pr-1">
                {data.budgets.map((b) => {
                  const p = pct(b.spent, b.amount);
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          {b.name}
                        </span>
                        <span
                          className={`font-semibold flex-shrink-0 ml-2 ${p >= 100 ? "text-red-500" : p > 90 ? "text-amber-500" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {p.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${p}%`,
                            backgroundColor:
                              p >= 100
                                ? "#ef4444"
                                : p > 90
                                  ? "#f59e0b"
                                  : "#165BC5",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Metas
              </h3>
              <Link
                href="/panel/planificacion"
                className="text-xs text-[#165BC5] hover:underline flex items-center gap-0.5"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {data.goals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                Sin metas
              </p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-48 pr-1">
                {data.goals.map((g) => {
                  const p = pct(g.saved_amount, g.target_amount);
                  return (
                    <div key={g.id} className="flex items-center gap-3">
                      <span className="text-lg">{g.emoji ?? "🎯"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {g.name}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div
                            className="h-1.5 rounded-full bg-[#165BC5]"
                            style={{ width: `${p}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#165BC5] flex-shrink-0">
                        {p.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
