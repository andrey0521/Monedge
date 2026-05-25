"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, X, Target, TrendingUp, Pencil, RefreshCw, LayoutList, ChevronDown } from "lucide-react";
import {
  getBudgets, createBudget, updateBudget, deleteBudget,
  getGoals, createGoal, updateGoal, deleteGoal,
  getCategories, renewBudget, getAccounts,
  contributeGoal, withdrawGoal,
} from "@/lib/api";
import type { Budget, BudgetPeriod, Goal, Category, Account } from "@/lib/types";
import { useToast, Toasts } from "@/lib/toast";

function fmt(n: number) { return "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }); }
function pct(a: number, b: number) { return b > 0 ? Math.min((a / b) * 100, 100) : 0; }

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = localDateStr();
const MONTH_START = TODAY.slice(0, 8) + "01";
const MONTH_END = (() => {
  const d = new Date(); d.setMonth(d.getMonth() + 1, 0);
  return localDateStr(d);
})();

const BUDGET_FORM = { name: "", amount: "", category_id: "", start_date: MONTH_START, end_date: MONTH_END, is_recurring: true, frequency: "monthly" as "weekly" | "biweekly" | "monthly" };
const GOAL_FORM = { name: "", emoji: "🎯", target_amount: "", saved_amount: "", deadline: "" };

const INPUT_CLS = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30";

export default function PlanificacionPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"budgets" | "goals">("budgets");
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState<Goal | null>(null);
  const [savingsAction, setSavingsAction] = useState<"contribute" | "withdraw">("contribute");
  const [savingsAccountId, setSavingsAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgetForm, setBudgetForm] = useState(BUDGET_FORM);
  const [goalForm, setGoalForm] = useState(GOAL_FORM);
  const [addAmount, setAddAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "budget" | "goal"; id: string; name: string } | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [showBudgetHistory, setShowBudgetHistory] = useState(false);
  const [showGoalHistory, setShowGoalHistory] = useState(false);
  const { toast, toasts } = useToast();

  useEffect(() => {
    Promise.all([getBudgets(), getGoals(), getCategories(), getAccounts()])
      .then(([b, g, c, a]) => { setBudgets(b); setGoals(g); setCategories(c); setAccounts(a); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmitBudget(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = {
      name: budgetForm.name,
      amount: parseFloat(budgetForm.amount),
      category_id: budgetForm.category_id || null,
      start_date: budgetForm.start_date,
      end_date: budgetForm.end_date,
      is_recurring: budgetForm.is_recurring,
      frequency: budgetForm.is_recurring ? budgetForm.frequency : null,
    };
    try {
      if (editingBudget) {
        const updated = await updateBudget(editingBudget.id, payload);
        setBudgets(prev => prev.map(b => b.id === editingBudget.id ? updated : b));
        toast("Presupuesto actualizado");
      } else {
        const b = await createBudget(payload);
        setBudgets(prev => [b, ...prev]);
        toast("Presupuesto creado");
      }
      setBudgetForm(BUDGET_FORM); setEditingBudget(null); setShowBudgetForm(false);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally { setSaving(false); }
  }

  async function handleSubmitGoal(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = {
      name: goalForm.name,
      emoji: goalForm.emoji || "🎯",
      target_amount: parseFloat(goalForm.target_amount),
      saved_amount: parseFloat(goalForm.saved_amount) || 0,
      deadline: goalForm.deadline || null,
    };
    try {
      if (editingGoal) {
        const updated = await updateGoal(editingGoal.id, payload);
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? updated : g));
        toast("Meta actualizada");
      } else {
        const g = await createGoal(payload);
        setGoals(prev => [g, ...prev]);
        toast("Meta creada");
      }
      setGoalForm(GOAL_FORM); setEditingGoal(null); setShowGoalForm(false);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally { setSaving(false); }
  }

  function openEditBudget(b: Budget) {
    setEditingBudget(b);
    setBudgetForm({
      name: b.name,
      amount: String(b.amount),
      category_id: b.category_id ?? "",
      start_date: b.start_date,
      end_date: b.end_date,
      is_recurring: true,
      frequency: (b.frequency as "weekly" | "biweekly" | "monthly") || "monthly",
    });
    setShowBudgetForm(true);
  }

  async function handleRenew(b: Budget) {
    try {
      const renewed = await renewBudget(b.id);
      setBudgets(prev => [renewed, ...prev]);
      toast(`Presupuesto "${b.name}" renovado`);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  function openEditGoal(g: Goal) {
    setEditingGoal(g);
    setGoalForm({ name: g.name, emoji: g.emoji ?? "🎯", target_amount: String(g.target_amount), saved_amount: String(g.saved_amount), deadline: g.deadline ?? "" });
    setShowGoalForm(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "budget") {
        await deleteBudget(deleteTarget.id);
        setBudgets(prev => prev.filter(b => b.id !== deleteTarget.id));
        toast("Presupuesto eliminado");
      } else {
        await deleteGoal(deleteTarget.id);
        setGoals(prev => prev.filter(g => g.id !== deleteTarget.id));
        toast("Meta eliminada");
      }
    } catch (err) { toast((err as Error).message, "error"); }
    finally { setDeleteTarget(null); }
  }

  async function handleAddSavings(e: React.FormEvent) {
    e.preventDefault();
    if (!showAddSavings || !savingsAccountId) return;
    setSaving(true);
    try {
      const amount = parseFloat(addAmount);
      const updated = savingsAction === "contribute"
        ? await contributeGoal(showAddSavings.id, savingsAccountId, amount)
        : await withdrawGoal(showAddSavings.id, savingsAccountId, amount);
      setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      toast(savingsAction === "contribute" ? "Ahorro registrado" : "Retiro registrado");
      setShowAddSavings(null); setAddAmount(""); setSavingsAccountId("");
    } catch (err) { toast((err as Error).message, "error"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="text-sm text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-1 w-fit">
        {([["budgets", "Presupuestos", Target], ["goals", "Metas", TrendingUp]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-[#165BC5] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "budgets" && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Presupuestos activos</h3>
            <div className="flex gap-2">
              {budgets.filter(b => b.end_date < TODAY).length > 0 && (
                <button onClick={() => setShowBudgetHistory(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${showBudgetHistory ? "border-gray-400 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"}`}>
                  Historial ({budgets.filter(b => b.end_date < TODAY).length})
                </button>
              )}
              <button onClick={() => { setEditingBudget(null); setBudgetForm(BUDGET_FORM); setShowBudgetForm(true); }} className="flex items-center gap-2 bg-[#165BC5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B3EA1]">
                <Plus className="w-4 h-4" /> Nuevo presupuesto
              </button>
            </div>
          </div>
          {budgets.filter(b => b.end_date >= TODAY).length === 0 ? (
            <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-12 text-center">
              <Target className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Sin presupuestos activos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.filter(b => b.end_date >= TODAY).map(b => {
                const totalBudget = b.total_budget || b.amount;
                const totalPct = pct(b.spent, totalBudget);
                const expired = b.end_date < TODAY;
                const currentPeriod = b.periods?.find(per => per.is_current);
                const curPct = currentPeriod ? pct(currentPeriod.spent, currentPeriod.amount) : 0;
                const totalColor = totalPct >= 100 ? "#ef4444" : totalPct > 70 ? "#f59e0b" : "#165BC5";
                const curColor = curPct >= 100 ? "#ef4444" : curPct > 70 ? "#f59e0b" : "#165BC5";

                return (
                  <div key={b.id} className={`bg-white dark:bg-[#1e2433] rounded-2xl border overflow-hidden ${expired ? "border-amber-300 dark:border-amber-700/60" : "border-gray-200 dark:border-gray-700/60"}`}>

                    {/* ── Header ── */}
                    <div className="px-5 pt-5 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{b.category_emoji ?? "📊"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">{b.name}</span>
                              {expired && <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-full shrink-0">Vencido</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{b.start_date} → {b.end_date}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 shrink-0 ml-2">
                          {b.is_recurring && expired && (
                            <button onClick={() => handleRenew(b)} title="Renovar" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-[#165BC5]">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {b.periods && b.periods.length > 1 && (
                            <button onClick={() => setDetailBudget(b)} title="Ver desglose" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-gray-400 hover:text-[#165BC5]">
                              <LayoutList className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => openEditBudget(b)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget({ type: "budget", id: b.id, name: b.name })} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {/* ── Período actual ── */}
                      {currentPeriod ? (
                        <div className={b.periods && b.periods.length > 1 ? "mb-4" : "mb-0"}>
                          <div className="flex items-baseline justify-between mb-2">
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Período actual</span>
                              <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">{currentPeriod.label}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold" style={{ color: curColor }}>{fmt(currentPeriod.spent)}</span>
                              <span className="text-sm text-gray-400 ml-1">/ {fmt(currentPeriod.amount)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-2.5">
                            <div className="h-2.5 rounded-full transition-all" style={{ width: `${curPct}%`, backgroundColor: curColor }} />
                          </div>
                          <div className="flex justify-between mt-1.5">
                            <span className="text-xs text-gray-400">{currentPeriod.start_date.slice(5).replace("-", "/")} → {currentPeriod.end_date.slice(5).replace("-", "/")}</span>
                            <span className="text-xs font-semibold" style={{ color: curColor }}>{curPct.toFixed(0)}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 text-xs text-gray-400 italic">Sin período activo</div>
                      )}

                      {/* ── Total acumulado ── */}
                      {b.periods && b.periods.length > 1 && (
                        <>
                          <div className="border-t border-gray-100 dark:border-gray-700/40 pt-3">
                            <div className="flex items-baseline justify-between mb-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Acumulado total</span>
                              <div className="text-right">
                                <span className="text-base font-bold text-gray-700 dark:text-gray-300">{fmt(b.spent)}</span>
                                <span className="text-xs text-gray-400 ml-1">/ {fmt(totalBudget)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all" style={{ width: `${totalPct}%`, backgroundColor: totalColor }} />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-gray-400">{b.periods.length} períodos · {fmt(b.amount)} c/u</span>
                              <span className="text-xs font-semibold" style={{ color: totalColor }}>{totalPct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    </div>
                );
              })}
            </div>
          )}

          {/* Historial presupuestos vencidos */}
          {showBudgetHistory && budgets.filter(b => b.end_date < TODAY).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Vencidos</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                  {budgets.filter(b => b.end_date < TODAY).map(b => {
                    const totalBudget = b.total_budget || b.amount;
                    const totalPct = pct(b.spent, totalBudget);
                    const currentPeriod = b.periods?.find(per => per.is_current);
                    const curPct = currentPeriod ? pct(currentPeriod.spent, currentPeriod.amount) : 0;
                    const totalColor = totalPct >= 100 ? "#ef4444" : totalPct > 70 ? "#f59e0b" : "#6b7280";
                    return (
                      <div key={b.id} className="bg-white dark:bg-[#1e2433] rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
                        <div className="px-5 pt-4 pb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{b.category_emoji ?? "📊"}</span>
                              <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{b.name}</span>
                                <p className="text-xs text-gray-400">{b.start_date} → {b.end_date}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5">
                              {b.periods && b.periods.length > 1 && (
                                <button onClick={() => setDetailBudget(b)} title="Ver desglose" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-[#165BC5]">
                                  <LayoutList className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {b.is_recurring && (
                                <button onClick={() => handleRenew(b)} title="Renovar" className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-[#165BC5]">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => setDeleteTarget({ type: "budget", id: b.id, name: b.name })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(b.spent)}</span>
                            <span className="text-gray-400">/ {fmt(totalBudget)}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${totalPct}%`, backgroundColor: totalColor }} />
                          </div>
                          <p className="text-xs font-semibold mt-1" style={{ color: totalColor }}>{totalPct.toFixed(0)}% usado</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "goals" && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Metas de ahorro</h3>
            <div className="flex gap-2">
              {goals.filter(g => g.saved_amount >= g.target_amount).length > 0 && (
                <button onClick={() => setShowGoalHistory(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${showGoalHistory ? "border-gray-400 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"}`}>
                  Completadas ({goals.filter(g => g.saved_amount >= g.target_amount).length})
                </button>
              )}
              <button onClick={() => { setEditingGoal(null); setGoalForm(GOAL_FORM); setShowGoalForm(true); }} className="flex items-center gap-2 bg-[#165BC5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B3EA1]">
                <Plus className="w-4 h-4" /> Nueva meta
              </button>
            </div>
          </div>
          {goals.filter(g => g.saved_amount < g.target_amount).length === 0 ? (
            <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-12 text-center">
              <TrendingUp className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Sin metas activas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.filter(g => g.saved_amount < g.target_amount).map(g => {
                const p = pct(g.saved_amount, g.target_amount);
                return (
                  <div key={g.id} className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{g.emoji ?? "🎯"}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{g.name}</div>
                          {g.deadline && <div className="text-xs text-gray-400">Fecha límite: {g.deadline}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditGoal(g)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget({ type: "goal", id: g.id, name: g.name })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-2xl font-bold text-[#165BC5]">{fmt(g.saved_amount)}</span>
                      <span className="text-sm text-gray-400">meta: {fmt(g.target_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div className="h-2 rounded-full bg-[#165BC5] transition-all" style={{ width: `${p}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#165BC5]">{p.toFixed(0)}% completado</span>
                      <button onClick={() => { setShowAddSavings(g); setSavingsAction("contribute"); setSavingsAccountId(""); setAddAmount(""); }} className="text-xs text-[#165BC5] hover:underline">Abonar / Retirar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Historial metas completadas */}
          {showGoalHistory && goals.filter(g => g.saved_amount >= g.target_amount).length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Completadas</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {goals.filter(g => g.saved_amount >= g.target_amount).map(g => (
                  <div key={g.id} className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-4 opacity-70">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{g.emoji ?? "🎯"}</span>
                        <div>
                          <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
                            {g.name}
                            <span className="text-xs font-bold px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">✓ Completada</span>
                          </div>
                          {g.deadline && <div className="text-xs text-gray-400">Fecha límite: {g.deadline}</div>}
                        </div>
                      </div>
                      <button onClick={() => setDeleteTarget({ type: "goal", id: g.id, name: g.name })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-2 mb-1">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: "100%" }} />
                    </div>
                    <p className="text-xs text-green-600 font-semibold">{fmt(g.saved_amount)} / {fmt(g.target_amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal presupuesto */}
      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{editingBudget ? "Editar presupuesto" : "Nuevo presupuesto"}</h3>
              <button onClick={() => setShowBudgetForm(false)}><X className="w-4 h-4 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmitBudget} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input required value={budgetForm.name} onChange={e => setBudgetForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Alimentación" className={INPUT_CLS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
                  <select value={budgetForm.frequency}
                    onChange={e => setBudgetForm(f => ({ ...f, frequency: e.target.value as "weekly" | "biweekly" | "monthly" }))}
                    className={INPUT_CLS}>
                    <option value="weekly">1 semana (7 días)</option>
                    <option value="biweekly">2 semanas (14 días)</option>
                    <option value="monthly">4 semanas (28 días)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Límite por período
                  </label>
                  <input required type="number" min="0" step="0.01" value={budgetForm.amount} onChange={e => setBudgetForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select value={budgetForm.category_id} onChange={e => setBudgetForm(f => ({ ...f, category_id: e.target.value }))} className={INPUT_CLS}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
                  <input type="date" value={budgetForm.start_date} onChange={e => setBudgetForm(f => ({ ...f, start_date: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                  <input type="date" value={budgetForm.end_date} onChange={e => setBudgetForm(f => ({ ...f, end_date: e.target.value }))} className={INPUT_CLS} />
                </div>
              </div>
              {/* Recurrente */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Renovar automáticamente</p>
                  <p className="text-xs text-gray-400">Al vencer, crea un nuevo período con la misma duración</p>
                </div>
                <button type="button" onClick={() => setBudgetForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                  className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ml-3 ${budgetForm.is_recurring ? "bg-[#165BC5]" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${budgetForm.is_recurring ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>

              {/* Preview de períodos */}
              {budgetForm.start_date && budgetForm.end_date && budgetForm.amount && (() => {
                const days = budgetForm.frequency === "weekly" ? 7 : budgetForm.frequency === "biweekly" ? 14 : 28;
                const start = new Date(budgetForm.start_date + "T12:00:00");
                const end = new Date(budgetForm.end_date + "T12:00:00");
                const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
                const numPeriods = Math.ceil(totalDays / days);
                const total = numPeriods * parseFloat(budgetForm.amount || "0");
                if (numPeriods <= 0 || isNaN(total)) return null;
                return (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-xs text-[#165BC5]">
                    {numPeriods} período{numPeriods !== 1 ? "s" : ""} × ${parseFloat(budgetForm.amount).toLocaleString("en-US", { maximumFractionDigits: 0 })} = <strong>${total.toLocaleString("en-US", { maximumFractionDigits: 0 })} total</strong>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowBudgetForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal meta */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{editingGoal ? "Editar meta" : "Nueva meta"}</h3>
              <button onClick={() => setShowGoalForm(false)}><X className="w-4 h-4 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmitGoal} className="p-5 space-y-4">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emoji</label>
                  <input value={goalForm.emoji} onChange={e => setGoalForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-center bg-white dark:bg-[#252d3d] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input required value={goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Viaje a Japón" className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta total</label>
                <input required type="number" min="0" step="0.01" value={goalForm.target_amount} onChange={e => setGoalForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="0" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ya tengo ahorrado</label>
                <input type="number" min="0" step="0.01" value={goalForm.saved_amount} onChange={e => setGoalForm(f => ({ ...f, saved_amount: e.target.value }))} placeholder="0" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha límite (opcional)</label>
                <input type="date" value={goalForm.deadline} onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))} className={INPUT_CLS} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowGoalForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal abonar / retirar meta */}
      {showAddSavings && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{showAddSavings.emoji} {showAddSavings.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Ahorrado: {fmt(showAddSavings.saved_amount)} / Meta: {fmt(showAddSavings.target_amount)}</p>
              </div>
              <button onClick={() => { setShowAddSavings(null); setAddAmount(""); setSavingsAccountId(""); }}><X className="w-4 h-4 text-gray-500 dark:text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddSavings} className="p-5 space-y-4">
              {/* Abonar / Retirar toggle */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1">
                {(["contribute", "withdraw"] as const).map(action => (
                  <button key={action} type="button"
                    onClick={() => setSavingsAction(action)}
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${savingsAction === action ? "bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                    {action === "contribute" ? "Abonar" : "Retirar"}
                  </button>
                ))}
              </div>
              {/* Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {savingsAction === "contribute" ? "De qué cuenta sale" : "A qué cuenta va"}
                </label>
                <select required value={savingsAccountId} onChange={e => setSavingsAccountId(e.target.value)} className={INPUT_CLS}>
                  <option value="">Selecciona cuenta</option>
                  {accounts.filter(a => a.type !== "credit").map(a => (
                    <option key={a.id} value={a.id}>{a.name} · {fmt(a.balance)}</option>
                  ))}
                </select>
              </div>
              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                <input required type="number" min="0.01" step="0.01" value={addAmount}
                  onChange={e => setAddAmount(e.target.value)} placeholder="0" className={INPUT_CLS} />
                {(() => {
                  const acc = accounts.find(a => a.id === savingsAccountId);
                  const amt = parseFloat(addAmount) || 0;
                  if (savingsAction === "contribute" && acc && amt > acc.balance)
                    return <p className="text-xs text-red-500 mt-1">Saldo insuficiente — disponible: {fmt(acc.balance)}</p>;
                  if (savingsAction === "withdraw" && showAddSavings && amt > showAddSavings.saved_amount)
                    return <p className="text-xs text-red-500 mt-1">La meta solo tiene {fmt(showAddSavings.saved_amount)} ahorrado</p>;
                })()}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddSavings(null); setAddAmount(""); setSavingsAccountId(""); }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">Cancelar</button>
                <button type="submit"
                  disabled={saving || !savingsAccountId || (() => {
                    const acc = accounts.find(a => a.id === savingsAccountId);
                    const amt = parseFloat(addAmount) || 0;
                    if (savingsAction === "contribute" && acc && amt > acc.balance) return true;
                    if (savingsAction === "withdraw" && showAddSavings && amt > showAddSavings.saved_amount) return true;
                    return false;
                  })()}
                  className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">
                  {saving ? "..." : savingsAction === "contribute" ? "Abonar" : "Retirar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              ¿Eliminar {deleteTarget.type === "budget" ? "presupuesto" : "meta"}?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              <span className="font-medium text-gray-800 dark:text-gray-200">"{deleteTarget.name}"</span> se eliminará permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                Cancelar
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal desglose de presupuesto */}
      {detailBudget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailBudget(null)}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/40">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{detailBudget.category_emoji ?? "📊"}</span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">{detailBudget.name}</p>
                  <p className="text-xs text-gray-400">{detailBudget.start_date} → {detailBudget.end_date}</p>
                </div>
              </div>
              <button onClick={() => setDetailBudget(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Resumen */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700/40 border-b border-gray-100 dark:border-gray-700/40">
              {[
                { label: "Por período", value: fmt(detailBudget.amount) },
                { label: "Gastado total", value: fmt(detailBudget.spent) },
                { label: "Presupuesto total", value: fmt(detailBudget.total_budget) },
              ].map(({ label, value }) => (
                <div key={label} className="px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
              ))}
            </div>
            {/* Períodos */}
            <div className="overflow-y-auto flex-1">
              {(detailBudget.periods ?? []).map((per: BudgetPeriod, i) => {
                const pp = pct(per.spent, per.amount);
                const over = per.spent > per.amount;
                const barColor = over ? "#ef4444" : pp > 70 ? "#f59e0b" : "#165BC5";
                return (
                  <div key={i} className={`px-6 py-4 ${per.is_current ? "bg-blue-50/60 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-white/5"} ${i < (detailBudget.periods?.length ?? 0) - 1 ? "border-b border-gray-100 dark:border-gray-700/30" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${per.is_current ? "text-[#165BC5]" : "text-gray-700 dark:text-gray-300"}`}>{per.label}</span>
                        {per.is_current && <span className="text-xs font-medium px-1.5 py-0.5 bg-[#165BC5] text-white rounded-full">en curso</span>}
                        <span className="text-xs text-gray-400">{per.start_date.slice(5).replace("-","/")} – {per.end_date.slice(5).replace("-","/")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${over ? "text-red-500" : "text-gray-800 dark:text-gray-200"}`}>{fmt(per.spent)}</span>
                        <span className="text-xs text-gray-400">/ {fmt(per.amount)}</span>
                        {over && <span className="text-red-500 text-sm">⚠</span>}
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pp, 100)}%`, backgroundColor: barColor }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">{fmt(per.amount - per.spent > 0 ? per.amount - per.spent : 0)} restante</span>
                      <span className="text-xs font-semibold" style={{ color: barColor }}>{pp.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Toasts items={toasts} />
    </div>
  );
}
