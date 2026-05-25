"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  X,
  Search,
  Pencil,
  Repeat2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Hash,
} from "lucide-react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  getAccounts,
  aiCategorize,
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  applyRecurring,
  getBudgets,
  getGoals,
} from "@/lib/api";
import type {
  Transaction,
  Category,
  Account,
  RecurringTransaction,
  Budget,
  Goal,
} from "@/lib/types";
import { useToast, Toasts } from "@/lib/toast";

function fmt(n: number) {
  return (
    "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const TODAY = localDateStr();

const EMPTY_FORM = {
  description: "",
  amount: "",
  type: "expense" as "income" | "expense",
  date: TODAY,
  category_id: "",
  account_id: "",
  budget_id: "",
  goal_id: "",
};

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

const INPUT_CLS =
  "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30";
const SELECT_CLS = INPUT_CLS;
const FILTER_CLS =
  "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30";

export default function MovimientosPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedStart, setLoadedStart] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editingRec, setEditingRec] = useState<RecurringTransaction | null>(
    null,
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [recFrequency, setRecFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [recEndType, setRecEndType] = useState<"open" | "date">("open");
  const [recEndDate, setRecEndDate] = useState("");
  const [categorizing, setCategorizing] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<RecurringTransaction | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
    isRec: boolean;
  } | null>(null);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "income" | "expense">("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  const { toast, toasts } = useToast();

  useEffect(() => {
    const start30 = subtractDays(TODAY, 30);
    setLoadedStart(start30);
    Promise.all([
      getTransactions({ start_date: start30, limit: 300 }),
      getCategories(),
      getAccounts(),
      getRecurring(),
      getBudgets(),
      getGoals(),
    ])
      .then(([txs, cats, accs, recs, buds, gls]) => {
        setTransactions(txs);
        setCategories(cats);
        setAccounts(accs);
        setRecurring(recs);
        setBudgets(buds);
        setGoals(gls);
      })
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!hasMore || loadingMore || !loadedStart) return;
    setLoadingMore(true);
    try {
      const endDate = subtractDays(loadedStart, 1);
      const newStart = subtractDays(loadedStart, 31);
      const more = await getTransactions({
        start_date: newStart,
        end_date: endDate,
        limit: 300,
      });
      if (more.length === 0) {
        setHasMore(false);
      } else {
        setTransactions((prev) => [...prev, ...more]);
        setLoadedStart(newStart);
        if (more.length < 10) setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === form.type);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setEditingRec(null);
    setIsRecurring(false);
    setRecFrequency("monthly");
    setRecEndType("open");
    setRecEndDate("");
    setShowForm(false);
  }

  async function handleAiCategorize() {
    if (!form.description || !form.amount) return;
    setCategorizing(true);
    try {
      const res = await aiCategorize(form.description, parseFloat(form.amount));
      if (res.category_id)
        setForm((f) => ({ ...f, category_id: res.category_id! }));
    } finally {
      setCategorizing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRec) {
        const updated = await updateRecurring(editingRec.id, {
          name: form.description,
          amount: parseFloat(form.amount),
          type: form.type,
          frequency: recFrequency,
          next_date: form.date || null,
          category_id: form.category_id || null,
          account_id: form.account_id || null,
        });
        setRecurring((prev) =>
          prev.map((r) => (r.id === editingRec.id ? updated : r)),
        );
        toast("Recurrente actualizado");
      } else if (editing) {
        const updated = await updateTransaction(editing.id, {
          description: form.description,
          amount: parseFloat(form.amount),
          type: form.type,
          date: form.date,
          category_id: form.category_id || null,
          account_id: form.account_id || null,
          budget_id: form.budget_id || null,
          goal_id: form.goal_id || null,
        });
        setTransactions((prev) =>
          prev.map((t) => (t.id === editing.id ? updated : t)),
        );
        toast("Movimiento actualizado");
      } else if (isRecurring) {
        const rec = await createRecurring({
          name: form.description,
          amount: parseFloat(form.amount),
          type: form.type,
          frequency: recFrequency,
          next_date: form.date || null,
          end_date: recEndType === "date" && recEndDate ? recEndDate : null,
          category_id: form.category_id || null,
          account_id: form.account_id || null,
          budget_id: form.type === "expense" ? (form.budget_id || null) : null,
          goal_id: form.type === "income" ? (form.goal_id || null) : null,
          is_active: true,
        });
        setRecurring((prev) => [...prev, rec]);
        toast("Recurrente creado");
      } else {
        const tx = await createTransaction({
          description: form.description,
          amount: parseFloat(form.amount),
          type: form.type,
          date: form.date,
          category_id: form.category_id || null,
          account_id: form.account_id || null,
          budget_id: form.budget_id || null,
          goal_id: null,
        });
        setTransactions((prev) => [tx, ...prev]);
        toast("Movimiento registrado");
      }
      resetForm();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    setDeleteTarget({ id, label: "esta transacción", isRec: false });
  }

  function handleDeleteRec(id: string) {
    setDeleteTarget({ id, label: "este pago recurrente", isRec: true });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.isRec) {
        await deleteRecurring(deleteTarget.id);
        setRecurring((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        toast("Recurrente eliminado");
      } else {
        await deleteTransaction(deleteTarget.id);
        setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        toast("Movimiento eliminado");
      }
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleApply(rec: RecurringTransaction) {
    doApply(rec.id, undefined);
  }

  async function doApply(id: string, accountId: string | undefined) {
    setApplying(id);
    setPayTarget(null);
    try {
      await applyRecurring(id, accountId);
      const [txs, recs] = await Promise.all([
        getTransactions({ start_date: loadedStart, limit: 300 }),
        getRecurring(),
      ]);
      setTransactions(txs);
      setRecurring(recs);
      toast("Transacción registrada");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setApplying(null);
    }
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setEditingRec(null);
    setIsRecurring(false);
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      date: tx.date,
      category_id: tx.category_id ?? "",
      account_id: tx.account_id ?? "",
      budget_id: tx.budget_id ?? "",
      goal_id: tx.goal_id ?? "",
    });
    setShowForm(true);
  }

  function openEditRec(r: RecurringTransaction) {
    setEditingRec(r);
    setEditing(null);
    setIsRecurring(true);
    setRecFrequency(r.frequency);
    setForm({
      description: r.name,
      amount: String(r.amount),
      type: r.type,
      date: r.next_date ?? TODAY,
      category_id: r.category_id ?? "",
      account_id: r.account_id ?? "",
      budget_id: "",
      goal_id: "",
    });
    setShowForm(true);
  }

  // --- Filtrado ---
  const activeFiltersCount = [
    filterType,
    filterCategory,
    filterStart,
    filterEnd,
    filterMinAmount,
    filterMaxAmount,
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setFilterType("");
    setFilterCategory("");
    setFilterStart("");
    setFilterEnd("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
  }

  function setQuickMonth(delta: number) {
    const t = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - delta,
      1,
    );
    const s = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-01`;
    const lastD = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    const e = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(lastD).padStart(2, "0")}`;
    setFilterStart(s);
    setFilterEnd(e);
  }

  const filteredTxs = transactions.filter((tx) => {
    if (
      search &&
      !tx.description.toLowerCase().includes(search.toLowerCase()) &&
      !(tx.category_name ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterType && tx.type !== filterType) return false;
    if (filterCategory && tx.category_id !== filterCategory) return false;
    if (filterStart && tx.date < filterStart) return false;
    if (filterEnd && tx.date > filterEnd) return false;
    if (filterMinAmount && tx.amount < parseFloat(filterMinAmount))
      return false;
    if (filterMaxAmount && tx.amount > parseFloat(filterMaxAmount))
      return false;
    return true;
  });

  const filteredRec = recurring.filter((r) => {
    if (!r.is_active) return false;
    if (
      search &&
      !r.name.toLowerCase().includes(search.toLowerCase()) &&
      !(r.category_name ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterType && r.type !== filterType) return false;
    if (filterCategory && r.category_id !== filterCategory) return false;
    if (filterMinAmount && r.amount < parseFloat(filterMinAmount)) return false;
    if (filterMaxAmount && r.amount > parseFloat(filterMaxAmount)) return false;
    return true;
  });

  // --- KPIs de los movimientos filtrados ---
  const kpiIncome = filteredTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const kpiExpenses = filteredTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const kpiBalance = kpiIncome - kpiExpenses;

  const hasRows = filteredTxs.length > 0 || filteredRec.length > 0;
  const formTitle = editingRec
    ? "Editar recurrente"
    : editing
      ? "Editar movimiento"
      : isRecurring
        ? "Nuevo recurrente"
        : "Nuevo movimiento";

  return (
    <div className="flex flex-col gap-4">
      {/* ══ BARRA SUPERIOR: siempre ancho completo ══ */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`w-56 shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${showFilters ? "bg-[#165BC5] text-white border-[#165BC5]" : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e2433] hover:bg-gray-50 dark:hover:bg-white/5"}`}
        >
          {showFilters ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Filtros
          {activeFiltersCount > 0 && (
            <span
              className={`px-1.5 py-0.5 text-xs font-bold rounded-full leading-none ${showFilters ? "bg-white text-[#165BC5]" : "bg-[#165BC5] text-white"}`}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descripción o categoría..."
            className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1e2433] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30"
          />
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setEditingRec(null);
            setIsRecurring(false);
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 bg-[#165BC5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B3EA1] transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Agregar movimiento
        </button>
      </div>

      {/* ══ FILA INFERIOR: sidebar + contenido (KPIs + tabla) ══ */}
      <div className="flex gap-4 items-start">
        {/* Sidebar filtros */}
        {showFilters && (
          <aside className="w-56 shrink-0 sticky top-20 self-start">
            <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
              {activeFiltersCount > 0 && (
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700/40 flex justify-end">
                  <button
                    onClick={() => clearFilters()}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                </div>
              )}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
                {/* Tipo */}
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Tipo
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {(["", "expense", "income"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setFilterType(v)}
                        className={`w-full py-1.5 rounded-lg text-xs font-medium transition text-left px-2.5 ${
                          filterType === v
                            ? v === "expense"
                              ? "bg-red-500 text-white"
                              : v === "income"
                                ? "bg-green-500 text-white"
                                : "bg-[#165BC5] text-white"
                            : "bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {v === ""
                          ? "Todos"
                          : v === "expense"
                            ? "💸 Gastos"
                            : "💰 Ingresos"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoría */}
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Categoría
                  </p>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className={FILTER_CLS}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Período */}
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Período
                  </p>
                  <div className="flex flex-col gap-1.5 mb-2.5">
                    {[
                      { label: "Este mes", delta: 0 },
                      { label: "Mes anterior", delta: 1 },
                      { label: "Hace 2 meses", delta: 2 },
                    ].map(({ label, delta }) => {
                      const t = new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() - delta,
                        1,
                      );
                      const s = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-01`;
                      const active = filterStart === s;
                      return (
                        <button
                          key={delta}
                          onClick={() => setQuickMonth(delta)}
                          className={`w-full py-1.5 rounded-lg text-xs font-medium transition text-left px-2.5 border ${active ? "bg-[#165BC5] text-white border-[#165BC5]" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-[#165BC5] hover:text-[#165BC5]"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-xs text-gray-400 mb-1">
                        Desde
                      </span>
                      <input
                        type="date"
                        value={filterStart}
                        onChange={(e) => setFilterStart(e.target.value)}
                        className={FILTER_CLS}
                      />
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 mb-1">
                        Hasta
                      </span>
                      <input
                        type="date"
                        value={filterEnd}
                        onChange={(e) => setFilterEnd(e.target.value)}
                        className={FILTER_CLS}
                      />
                    </div>
                  </div>
                </div>

                {/* Monto */}
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Monto
                  </p>
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-xs text-gray-400 mb-1">
                        Mínimo
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={filterMinAmount}
                        onChange={(e) => setFilterMinAmount(e.target.value)}
                        placeholder="$0"
                        className={FILTER_CLS}
                      />
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 mb-1">
                        Máximo
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={filterMaxAmount}
                        onChange={(e) => setFilterMaxAmount(e.target.value)}
                        placeholder="Sin límite"
                        className={FILTER_CLS}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* KPIs + tabla */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Ingresos",
                value: fmt(kpiIncome),
                color: "text-green-600 dark:text-green-400",
                bg: "bg-green-50 dark:bg-green-900/20",
                Icon: TrendingUp,
              },
              {
                label: "Gastos",
                value: fmt(kpiExpenses),
                color: "text-red-500",
                bg: "bg-red-50 dark:bg-red-900/20",
                Icon: TrendingDown,
              },
              {
                label: "Balance neto",
                value: fmt(kpiBalance),
                color: kpiBalance >= 0 ? "text-[#165BC5]" : "text-red-500",
                bg:
                  kpiBalance >= 0
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-red-50 dark:bg-red-900/20",
                Icon: ArrowUpDown,
              },
              {
                label: "Movimientos",
                value: String(filteredTxs.length),
                color: "text-gray-900 dark:text-gray-100",
                bg: "bg-gray-50 dark:bg-gray-700/30",
                Icon: Hash,
              },
            ].map(({ label, value, color, bg, Icon }) => (
              <div
                key={label}
                className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 px-4 py-3 flex items-center gap-3"
              >
                <div
                  className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 leading-none mb-0.5">
                    {label}
                  </p>
                  <p className={`text-base font-bold leading-tight ${color}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Cargando...
              </div>
            ) : !hasRows ? (
              <div className="p-8 text-center text-sm text-gray-400">
                {search || activeFiltersCount > 0
                  ? "Sin resultados para los filtros aplicados."
                  : "Sin movimientos registrados. ¡Agrega el primero!"}
              </div>
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-18rem)]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#252d3d]">
                    <tr className="border-b border-gray-100 dark:border-gray-700/40">
                      <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                        Descripción
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                        Categoría
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                        Cuenta
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                        Fecha
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">
                        Monto
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                    {filteredTxs.map((tx) => (
                      <tr
                        key={`tx-${tx.id}`}
                        className={`transition-colors ${tx.type === "transfer" ? "bg-purple-50/40 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20" : "hover:bg-gray-50 dark:hover:bg-[#252d3d]"}`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tx.description}</p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {tx.budget_id && (() => { const b = budgets.find(b => b.id === tx.budget_id); return b ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#165BC5] bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full">
                                {b.category_emoji ?? "📊"} {b.name}
                              </span>
                            ) : null; })()}
                            {tx.goal_id && (() => { const g = goals.find(g => g.id === tx.goal_id); return g ? (
                              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                                {g.emoji ?? "🎯"} {g.name}
                              </span>
                            ) : null; })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {tx.category_emoji} {tx.category_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {tx.account_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {tx.date}
                        </td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${
                          tx.type === "income" ? "text-green-600"
                          : tx.type === "transfer" ? "text-purple-500"
                          : "text-gray-900 dark:text-gray-100"}`}>
                          {tx.type === "income" ? "+" : tx.type === "transfer" ? "⇄" : "-"}
                          {fmt(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {tx.type !== "transfer" && (
                              <button
                                onClick={() => openEdit(tx)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRec.map((r) => (
                      <tr
                        key={`rec-${r.id}`}
                        className={`hover:bg-gray-50 dark:hover:bg-[#252d3d] transition-colors ${!r.is_active ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            {r.name}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#165BC5] text-xs font-semibold rounded-md">
                              <Repeat2 className="w-2.5 h-2.5" />
                              {FREQ_LABELS[r.frequency]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.category_emoji} {r.category_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.account_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.next_date ? <span>Próx: {r.next_date}</span> : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-bold text-right ${r.type === "income" ? "text-green-600" : "text-gray-900 dark:text-gray-100"}`}
                        >
                          {r.type === "income" ? "+" : "-"}
                          {fmt(r.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApply(r)}
                              disabled={applying === r.id}
                              title="Registrar ahora"
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-[#165BC5] transition disabled:opacity-40"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${applying === r.id ? "animate-spin" : ""}`}
                              />
                            </button>
                            <button
                              onClick={() => openEditRec(r)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRec(r.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {!loading && hasMore && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-[#252d3d]">
                <span className="text-xs text-gray-400">
                  Desde {loadedStart} · {transactions.length} movimientos
                  cargados
                </span>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#165BC5] hover:underline disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" /> Cargando...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Ver 30 días más
                    </>
                  )}
                </button>
              </div>
            )}
            {!loading && !hasMore && transactions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700/40 text-center">
                <span className="text-xs text-gray-400">
                  Historial completo cargado · {transactions.length} movimientos
                </span>
              </div>
            )}
          </div>
        </div>
        {/* fin KPIs+tabla */}
      </div>
      {/* fin fila inferior */}

      {/* Modal nuevo/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="min-h-full flex items-start justify-center px-4 py-6"
            style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>

          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formTitle}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-2 gap-4">

                {/* Tipo — full */}
                <div className="col-span-2 flex gap-2">
                  {(["expense", "income"] as const).map((t) => (
                    <button type="button" key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t, category_id: "", budget_id: "", goal_id: "" }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.type === t ? (t === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white") : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                      {t === "expense" ? "Gasto" : "Ingreso"}
                    </button>
                  ))}
                </div>

                {/* Recurrente — full */}
                {!editing && !editingRec && (
                  <div className="col-span-2">
                    <button type="button"
                      onClick={() => setIsRecurring((v) => !v)}
                      className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition ${isRecurring ? "border-[#165BC5] text-[#165BC5] bg-[#165BC5]/10" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"}`}>
                      <Repeat2 className="w-4 h-4" />
                      {isRecurring ? "Recurrente activado" : "Hacer recurrente"}
                    </button>
                  </div>
                )}

                {/* Descripción + ✨ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <div className="flex gap-2">
                    <input required value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder={isRecurring ? "Ej: Salario, Netflix..." : "Ej: Starbucks Centro"}
                      className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                    <button type="button" onClick={handleAiCategorize} disabled={categorizing}
                      title="Auto-categorizar con IA"
                      className="p-2 bg-[#165BC5]/10 hover:bg-[#165BC5]/20 rounded-lg transition">
                      <Sparkles className={`w-4 h-4 text-[#165BC5] ${categorizing ? "animate-pulse" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                  <input required type="number" min="0" step="0.01" value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0" className={INPUT_CLS} />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRecurring ? "Próxima fecha" : "Fecha"}
                  </label>
                  <input type="date" value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={INPUT_CLS} />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                  <select value={form.category_id}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const update: Partial<typeof form> = { category_id: catId };
                      if (form.type === "expense" && catId && !form.budget_id) {
                        const txDate = form.date || TODAY;
                        const match = budgets.find(b => b.category_id === catId && b.start_date <= txDate && b.end_date >= txDate);
                        if (match) update.budget_id = match.id;
                      }
                      setForm(f => ({ ...f, ...update }));
                    }}
                    className={SELECT_CLS}>
                    <option value="">Sin categoría</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Cuenta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuenta</label>
                  <select value={form.account_id}
                    onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}
                    className={SELECT_CLS}>
                    <option value="">Sin cuenta</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}{a.type === "credit" ? " 💳" : ""}</option>
                    ))}
                  </select>
                </div>

                {/* Frecuencia (si recurrente) | Presupuesto (si gasto) | Meta (si ingreso) */}
                {isRecurring ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frecuencia</label>
                      <select value={recFrequency}
                        onChange={(e) => setRecFrequency(e.target.value as "weekly" | "biweekly" | "monthly")}
                        className={SELECT_CLS}>
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración</label>
                      <div className="flex gap-2 mb-2">
                        {(["open", "date"] as const).map(opt => (
                          <button key={opt} type="button"
                            onClick={() => setRecEndType(opt)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${recEndType === opt ? "border-[#165BC5] bg-[#165BC5]/10 text-[#165BC5]" : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"}`}>
                            {opt === "open" ? "Indefinida" : "Hasta fecha"}
                          </button>
                        ))}
                      </div>
                      {recEndType === "date" && (
                        <input type="date" value={recEndDate} onChange={e => setRecEndDate(e.target.value)}
                          className={SELECT_CLS} placeholder="Fecha de fin" />
                      )}
                    </div>
                    {form.type === "expense" && budgets.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Presupuesto <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <select value={form.budget_id}
                          onChange={e => setForm(f => ({ ...f, budget_id: e.target.value }))}
                          className={SELECT_CLS}>
                          <option value="">Sin presupuesto</option>
                          {budgets.map(b => (
                            <option key={b.id} value={b.id}>{b.category_emoji ?? "📊"} {b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {form.type === "income" && goals.filter(g => g.saved_amount < g.target_amount).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Meta <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <select value={form.goal_id}
                          onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}
                          className={SELECT_CLS}>
                          <option value="">Sin meta</option>
                          {goals.filter(g => g.saved_amount < g.target_amount).map(g => (
                            <option key={g.id} value={g.id}>{g.emoji ?? "🎯"} {g.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : form.type === "expense" ? (() => {
                  const txDate = form.date || TODAY;
                  const validBudgets = budgets.filter(b => b.start_date <= txDate && b.end_date >= txDate);
                  if (validBudgets.length === 0) return <div />;
                  const isSuggested = form.budget_id && form.category_id &&
                    validBudgets.find(b => b.id === form.budget_id)?.category_id === form.category_id;
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Presupuesto <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        {isSuggested && <span className="text-xs font-semibold text-[#165BC5] bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Sugerido</span>}
                      </div>
                      <select value={form.budget_id}
                        onChange={e => setForm(f => ({ ...f, budget_id: e.target.value }))}
                        className={SELECT_CLS}>
                        <option value="">Sin presupuesto</option>
                        {validBudgets.map(b => (
                          <option key={b.id} value={b.id}>{b.category_emoji ?? "📊"} {b.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })() : <div />}

                {/* Botones — full */}
                <div className="col-span-2 flex gap-2 pt-1">
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>

              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Modal confirmación de eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="min-h-full flex items-start justify-center px-4"
            style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 3rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                  ¿Eliminar?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Estás a punto de eliminar {deleteTarget.label}. Esta acción no
                  se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Modal selección de cuenta para pago de crédito */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 3rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{payTarget.name}</p>
                <p className="text-sm text-gray-400">${Number(payTarget.amount).toLocaleString("en-US", { maximumFractionDigits: 0 })} · cuota de crédito</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              ¿De qué cuenta sale el pago?
            </label>
            <select
              value={payAccountId}
              onChange={e => setPayAccountId(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Selecciona cuenta</option>
              {accounts.filter(a => a.type !== "credit").map(a => (
                <option key={a.id} value={a.id}>{a.name} · ${Number(a.balance).toLocaleString("en-US", { maximumFractionDigits: 0 })}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPayTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                Cancelar
              </button>
              <button
                onClick={() => doApply(payTarget.id, payAccountId)}
                disabled={!payAccountId}
                className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">
                Registrar pago
              </button>
            </div>
          </div>
        </div>
      )}

      <Toasts items={toasts} />
    </div>
  );
}
