"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Sparkles, TrendingUp,
  BarChart2, ChevronRight, X, Target, Send, Calendar, ChevronLeft,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, BarChart, Bar, Cell, PieChart, Pie, Legend,
  AreaChart, Area, LabelList,
} from "recharts";
import {
  getTransactions, getDashboard, getBudgets, getGoals, getRecurring,
  getCategories, createBudget, createGoal,
  aiRecommendations, aiAnalyze,
} from "@/lib/api";
import type { RecommendationAction } from "@/lib/api";
import type { Transaction, DashboardData, Budget, Goal, RecurringTransaction, Category } from "@/lib/types";

// ─── Constantes ──────────────────────────────────────────────────────────────
const CAT_COLORS = ["#165BC5","#3b82f6","#60a5fa","#818cf8","#34d399","#f59e0b","#ef4444","#f97316"];
// Colores más vivos para Patrones (mejor contraste entre categorías)
const PAT_COLORS = ["#165BC5","#7c3aed","#059669","#dc2626","#d97706","#0891b2","#be185d","#65a30d"];

const TIME_CHIPS = [
  { label: "15 Días", key: "15d" }, { label: "1 Mes",   key: "1m"     },
  { label: "3 Meses", key: "3m" }, { label: "6 Meses",  key: "6m"     },
  { label: "1 Año",   key: "1y" }, { label: "Personalizado", key: "custom" },
] as const;
type TimeChip = typeof TIME_CHIPS[number]["key"];

const LAB_PILLS = [
  "¿En qué mes gasté más?",
  "¿Cuánto podría ahorrar si reduzco comida un 20%?",
  "¿Cuál es mi gasto más recurrente?",
  "¿Cómo va mi balance vs el mes pasado?",
  "¿Cuánto gasto en promedio por semana?",
  "¿Qué categoría me cuesta más al mes?",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmt(n: number) { return "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 }); }
function fmtK(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return "$" + (a/1_000_000).toFixed(1) + "M";
  if (a >= 1_000)     return "$" + (a/1_000).toFixed(0) + "k";
  return "$" + Math.round(a);
}
function stdDev(vals: number[]) {
  if (vals.length < 2) return 0;
  const avg = vals.reduce((s,v) => s+v,0) / vals.length;
  return Math.sqrt(vals.reduce((s,v) => s + Math.pow(v-avg,2),0) / vals.length);
}
function getRange(chip: TimeChip, from?: string, to?: string) {
  const today = new Date(); const ts = toStr(today);
  const days = (s: Date) => Math.ceil((today.getTime()-s.getTime())/86400000)+1;
  if (chip==="15d"){ const s=new Date(today); s.setDate(s.getDate()-14); return {startStr:toStr(s),endStr:ts,totalDays:15}; }
  if (chip==="1m") { const s=new Date(today); s.setMonth(s.getMonth()-1); return {startStr:toStr(s),endStr:ts,totalDays:days(s)}; }
  if (chip==="3m") { const s=new Date(today); s.setMonth(s.getMonth()-3); return {startStr:toStr(s),endStr:ts,totalDays:days(s)}; }
  if (chip==="6m") { const s=new Date(today); s.setMonth(s.getMonth()-6); return {startStr:toStr(s),endStr:ts,totalDays:days(s)}; }
  if (chip==="1y") { const s=new Date(today); s.setFullYear(s.getFullYear()-1); return {startStr:toStr(s),endStr:ts,totalDays:days(s)}; }
  if (chip==="custom" && from && to && from<=to) {
    const d = Math.ceil((new Date(to+"T00:00:00").getTime()-new Date(from+"T00:00:00").getTime())/86400000)+1;
    if (d>=15) return {startStr:from,endStr:to,totalDays:d};
  }
  const s=new Date(today); s.setMonth(s.getMonth()-1);
  return {startStr:toStr(s),endStr:ts,totalDays:days(s)};
}

// ─── Componentes reutilizables ────────────────────────────────────────────────
function ChipPills({ value, onChange, from, to, onFrom, onTo }: {
  value: TimeChip; onChange: (k: TimeChip) => void;
  from?: string; to?: string; onFrom?: (v: string) => void; onTo?: (v: string) => void;
}) {
  const customDays = (from && to && from<=to) ? Math.ceil((new Date(to+"T00:00:00").getTime()-new Date(from+"T00:00:00").getTime())/86400000)+1 : 0;
  const customInvalid = value==="custom" && customDays>0 && customDays<15;
  const INPUT = "border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {TIME_CHIPS.map(c => (
          <button key={c.key} onClick={() => onChange(c.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${value===c.key ? "bg-[#165BC5] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-[#165BC5]"}`}>
            {c.label}
          </button>
        ))}
      </div>
      {value==="custom" && (
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={from??""} onChange={e=>onFrom?.(e.target.value)} className={INPUT} />
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" value={to??""} onChange={e=>onTo?.(e.target.value)} className={INPUT} />
          {customInvalid && <span className="text-xs text-amber-500">Mínimo 15 días</span>}
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label, dark }: { active?: boolean; payload?: {name:string;value:number;color:string}[]; label?: string; dark?: boolean; }) {
  if (!active||!payload?.length) return null;
  return (
    <div className={`rounded-xl shadow-xl px-4 py-3 text-sm border ${dark?"bg-[#1e2433] border-gray-700 text-gray-200":"bg-white border-gray-200 text-gray-700"}`}>
      {label && <p className="font-semibold mb-1.5">{label}</p>}
      {payload.map(p=><p key={p.name} style={{color:p.color}} className="font-medium">{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
}
function CountTooltip({ active, payload, label, dark }: { active?: boolean; payload?: {value:number}[]; label?: string; dark?: boolean; }) {
  if (!active||!payload?.length) return null;
  return (
    <div className={`rounded-xl shadow-xl px-4 py-3 text-sm border ${dark?"bg-[#1e2433] border-gray-700 text-gray-200":"bg-white border-gray-200 text-gray-700"}`}>
      {label && <p className="font-semibold mb-1.5">{label}</p>}
      <p className="font-medium text-[#165BC5]">{payload[0].value} transacciones</p>
    </div>
  );
}
function PieTooltip({ active, payload, dark }: { active?: boolean; payload?: {name:string;value:number}[]; dark?: boolean; }) {
  if (!active||!payload?.length) return null;
  return (
    <div className={`rounded-xl shadow-xl px-4 py-3 text-sm border ${dark?"bg-[#1e2433] border-gray-700 text-gray-200":"bg-white border-gray-200 text-gray-700"}`}>
      <p className="font-semibold mb-1">{payload[0].name}</p>
      <p className="font-medium text-[#165BC5]">{fmt(payload[0].value)}</p>
    </div>
  );
}

function ModalOverlay({ onClose, children, size="lg" }: { onClose: () => void; children: React.ReactNode; size?: "lg"|"xl"|"2xl" }) {
  const maxW = size==="2xl" ? "max-w-[88rem]" : size==="xl" ? "max-w-[74rem]" : "max-w-[64rem]";
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full ${maxW} h-[82vh] flex flex-col overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ icon, title, subtitle, onClose }: { icon: React.ReactNode; title: string; subtitle: string; onClose: () => void; }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/60 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition shrink-0 ml-4"><X className="w-5 h-5 text-gray-400" /></button>
    </div>
  );
}

function DualKpi({ label, incValue, expValue, incSub, expSub }: { label: string; incValue: string; expValue: string; incSub?: string; expSub?: string; }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 flex flex-col">
      <p className="text-sm text-gray-400 font-medium mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-3 divide-x divide-gray-200 dark:divide-gray-600 w-full">
        <div className="pr-3">
          <p className="text-xs text-emerald-500 font-semibold mb-1">Ingresos</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{incValue}</p>
          {incSub && <p className="text-xs text-gray-400 mt-0.5">{incSub}</p>}
        </div>
        <div className="pl-3">
          <p className="text-xs text-red-400 font-semibold mb-1">Gastos</p>
          <p className="text-xl font-bold text-red-500 leading-tight">{expValue}</p>
          {expSub && <p className="text-xs text-gray-400 mt-0.5">{expSub}</p>}
        </div>
      </div>
    </div>
  );
}
function SingleKpi({ label, value, sub, valueColor="text-gray-900 dark:text-gray-100" }: { label: string; value: string; sub?: string; valueColor?: string; }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5">
      <p className="text-sm text-gray-400 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
function EntryCard({ title, sub, icon, onClick }: { title: string; sub: string; icon: React.ReactNode; onClick: () => void; }) {
  return (
    <button onClick={onClick} className="bg-white dark:bg-[#1e2433] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-5 text-left hover:border-[#165BC5] hover:shadow-md transition-all group w-full">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">{title}</p>
            <p className="text-sm text-gray-400 mt-0.5 leading-snug">{sub}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#165BC5] transition-colors flex-shrink-0 mt-0.5 ml-2" />
      </div>
    </button>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AnalisisPage() {
  const [allTxs,       setAllTxs]       = useState<Transaction[]>([]);
  const [dashboard,    setDashboard]    = useState<DashboardData | null>(null);
  const [allBudgets,   setAllBudgets]   = useState<Budget[]>([]);
  const [allGoals,     setAllGoals]     = useState<Goal[]>([]);
  const [allRecurring, setAllRecurring] = useState<RecurringTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [isDark,       setIsDark]       = useState(false);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Modales
  const [showStats,      setShowStats]      = useState(false);
  const [showPatrones,   setShowPatrones]   = useState(false);
  const [showSeguimiento,setShowSeguimiento]= useState(false);
  const [showLab,        setShowLab]        = useState(false);

  // Selectores de tiempo
  const [statsChip, setStatsChip] = useState<TimeChip>("1m");
  const [statsFrom, setStatsFrom] = useState("");
  const [statsTo,   setStatsTo]   = useState("");

  const [patChip, setPatChip] = useState<TimeChip>("1m");
  const [patFrom, setPatFrom] = useState("");
  const [patTo,   setPatTo]   = useState("");
  const [patChartView, setPatChartView] = useState<"amount"|"count">("amount");
  const [histView, setHistView] = useState<"count"|"amount">("count");

  // Lab IA — multi-sesión
  type AnalyzeResult = { text: string; chart: { type: string; title: string; data: { label: string; value: number }[] } | null; metrics: { label: string; value: string }[] | null };
  type ChatMsg =
    | { id: number; role: "user"; text: string }
    | { id: number; role: "ai"; text: string; chart?: AnalyzeResult["chart"]; metrics?: AnalyzeResult["metrics"]; actions?: RecommendationAction[] }
    | { id: number; role: "loading" };
  type ChatSession = { id: string; title: string; date: string; msgs: ChatMsg[]; updatedAt: string };
  type ActionFormState = { msgId: number; idx: number; values: RecommendationAction["data"] & { name: string } };

  const LAB_STORAGE_KEY = "monedge_lab_sessions";
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const nextId = () => Date.now() + Math.floor(Math.random() * 999);

  const [sessions,    setSessions]    = useState<ChatSession[]>([]);
  const [activeId,    setActiveId]    = useState<string>("");
  const [chatInput,   setChatInput]   = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [actionForm,  setActionForm]  = useState<ActionFormState | null>(null);
  const [actionSaving,setActionSaving]= useState(false);
  const [actionDone,  setActionDone]  = useState<number | null>(null); // msgId de acción creada
  const [labCats,     setLabCats]     = useState<Category[]>([]);
  const [labCatsLoaded, setLabCatsLoaded] = useState(false);
  const labInputRef   = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeId) ?? null;
  const chatMsgs = activeSession?.msgs ?? [];

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([getTransactions({limit:500}), getDashboard(), getBudgets(), getGoals(), getRecurring()])
      .then(([txs,dash,budgets,goals,recurring]) => {
        setAllRecurring(recurring.map(r=>({...r,amount:Number(r.amount)})));
        setAllTxs(txs.map(t => ({...t,amount:Number(t.amount)})));
        setDashboard(dash ? {
          ...dash,
          total_balance:     Number(dash.total_balance),
          monthly_income:    Number(dash.monthly_income),
          monthly_expenses:  Number(dash.monthly_expenses),
          credit_debt:       Number(dash.credit_debt??0),
          safe_daily_budget: Number(dash.safe_daily_budget),
          budgets:  (dash.budgets??[]).map(b=>({...b,amount:Number(b.amount),spent:Number(b.spent)})),
          goals:    (dash.goals??[]).map(g=>({...g,target_amount:Number(g.target_amount),saved_amount:Number(g.saved_amount)})),
          accounts: (dash.accounts??[]).map(a=>({...a,balance:Number(a.balance)})),
        } : null);
        setAllBudgets(budgets.map(b=>({...b,amount:Number(b.amount),spent:Number(b.spent)})));
        setAllGoals(goals.map(g=>({...g,target_amount:Number(g.target_amount),saved_amount:Number(g.saved_amount)})));
      }).finally(() => setLoading(false));
  }, []);

  // Cargar sesiones del día desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAB_STORAGE_KEY);
      if (!raw) return;
      const stored: ChatSession[] = JSON.parse(raw);
      const today = todayStr();
      const todaySessions = stored
        .filter(s => s.date === today)
        .map(s => ({ ...s, msgs: s.msgs.filter(m => m.role !== "loading") }));
      if (todaySessions.length > 0) {
        setSessions(todaySessions);
        setActiveId(todaySessions[0].id);
      }
    } catch { /* localStorage no disponible o datos corruptos */ }
  }, []);

  // Guardar sesiones al cambiar
  useEffect(() => {
    if (sessions.length === 0) return;
    try {
      localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(sessions));
    } catch { /* sin espacio */ }
  }, [sessions]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  async function openActionForm(msgId: number, idx: number, action: RecommendationAction) {
    if (!labCatsLoaded) {
      const cats = await getCategories();
      setLabCats(cats);
      setLabCatsLoaded(true);
    }
    setActionForm({ msgId, idx, values: { ...action.data, name: action.data.name } });
  }

  async function confirmAction() {
    if (!actionForm) return;
    setActionSaving(true);
    const msg = activeSession?.msgs.find(m => m.id === actionForm.msgId);
    const action = msg && msg.role === "ai" ? msg.actions?.[actionForm.idx] : null;
    if (!action) { setActionSaving(false); return; }
    try {
      const v = actionForm.values;
      if (action.type === "budget") {
        const today = new Date();
        const start = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-01`;
        const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
        const end = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${lastDay}`;
        await createBudget({
          name: v.name,
          amount: Number(v.amount) || 0,
          category_id: v.category_id ?? null,
          start_date: start,
          end_date: end,
          is_recurring: true,
          frequency: v.frequency ?? "monthly",
          total_budget: Number(v.amount) || 0,
          periods: [],
          category_name: null,
          category_emoji: null,
          spent: 0,
        });
      } else {
        await createGoal({
          name: v.name,
          emoji: v.emoji ?? "🎯",
          target_amount: Number(v.target_amount) || 0,
          saved_amount: 0,
          deadline: v.deadline || null,
        });
      }
      setActionDone(actionForm.msgId);
      setActionForm(null);
    } catch (e) {
      alert((e as Error).message);
    } finally { setActionSaving(false); }
  }

  function createSession(): string {
    const id = `s_${Date.now()}`;
    const s: ChatSession = { id, title: "Nueva conversación", date: todayStr(), msgs: [], updatedAt: new Date().toISOString() };
    setSessions(prev => [s, ...prev]);
    setActiveId(id);
    return id;
  }

  function deleteSession(id: string) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? "");
      return next;
    });
  }

  function updateSession(id: string, updater: (s: ChatSession) => ChatSession) {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }

  async function sendMessage(q: string) {
    if (!q.trim() || aiLoading) return;
    const text = q.trim();
    const sessionId = activeId || createSession();
    if (!activeId) setActiveId(sessionId);

    const currentMsgs = sessions.find(s => s.id === sessionId)?.msgs ?? [];
    const history = currentMsgs
      .filter(m => m.role === "user" || m.role === "ai")
      .slice(-10)
      .map(m => ({ role: m.role, text: (m as { role: string; text: string }).text }));

    const userMsgId = nextId();
    const loadId    = nextId();
    setChatInput("");
    updateSession(sessionId, s => ({
      ...s,
      msgs: [...s.msgs, { id: userMsgId, role: "user", text }, { id: loadId, role: "loading" }],
      updatedAt: new Date().toISOString(),
    }));
    setAiLoading(true);
    try {
      const r = await aiAnalyze(text, history);
      updateSession(sessionId, s => ({
        ...s,
        title: s.title === "Nueva conversación" ? text.slice(0, 38) + (text.length > 38 ? "…" : "") : s.title,
        msgs: s.msgs.map(m => m.id === loadId
          ? { id: m.id, role: "ai" as const, text: r.text, chart: r.chart ?? undefined, metrics: r.metrics ?? undefined }
          : m),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      updateSession(sessionId, s => ({
        ...s,
        msgs: s.msgs.map(m => m.id === loadId ? { id: m.id, role: "ai" as const, text: `Error: ${msg}` } : m),
      }));
    } finally { setAiLoading(false); }
  }

  async function loadRecommendations() {
    if (aiLoading) return;
    const sessionId = activeId || createSession();
    if (!activeId) setActiveId(sessionId);
    const userMsgId = nextId();
    const loadId    = nextId();
    updateSession(sessionId, s => ({
      ...s,
      msgs: [...s.msgs, { id: userMsgId, role: "user", text: "Dame mis recomendaciones financieras" }, { id: loadId, role: "loading" }],
      updatedAt: new Date().toISOString(),
    }));
    setAiLoading(true);
    try {
      const r = await aiRecommendations();
      updateSession(sessionId, s => ({
        ...s,
        title: s.title === "Nueva conversación" ? "Recomendaciones financieras" : s.title,
        msgs: s.msgs.map(m => m.id === loadId
          ? { id: m.id, role: "ai" as const, text: r.text, actions: r.actions ?? undefined }
          : m),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      updateSession(sessionId, s => ({
        ...s,
        msgs: s.msgs.map(m => m.id === loadId ? { id: m.id, role: "ai" as const, text: `Error: ${msg}` } : m),
      }));
    } finally { setAiLoading(false); }
  }

  // ── Rangos ────────────────────────────────────────────────────────────────
  const statsRange = useMemo(() => getRange(statsChip, statsFrom||undefined, statsTo||undefined), [statsChip,statsFrom,statsTo]);
  const patRange   = useMemo(() => getRange(patChip,   patFrom||undefined,   patTo||undefined),   [patChip,patFrom,patTo]);

  const statsTxs = useMemo(() => allTxs.filter(t => t.date>=statsRange.startStr && t.date<=statsRange.endStr), [allTxs,statsRange]);
  const patTxs   = useMemo(() => allTxs.filter(t => t.date>=patRange.startStr   && t.date<=patRange.endStr),   [allTxs,patRange]);

  // ── Datos: Estadísticas ───────────────────────────────────────────────────
  const statsData = useMemo(() => {
    const inc = statsTxs.filter(t => t.type==="income");
    const exp = statsTxs.filter(t => t.type==="expense");
    const totalInc = inc.reduce((s,t)=>s+t.amount,0);
    const totalExp = exp.reduce((s,t)=>s+t.amount,0);
    const avgDailyInc = statsRange.totalDays>0 ? totalInc/statsRange.totalDays : 0;
    const avgDailyExp = statsRange.totalDays>0 ? totalExp/statsRange.totalDays : 0;
    const savingsRate = totalInc>0 ? ((totalInc-totalExp)/totalInc)*100 : 0;
    const largestExp  = exp.length ? Math.max(...exp.map(t=>t.amount)) : 0;

    // vs período anterior
    const pStart = new Date(statsRange.startStr+"T00:00:00");
    const prevEnd   = new Date(pStart); prevEnd.setDate(prevEnd.getDate()-1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate()-(statsRange.totalDays-1));
    const ps = toStr(prevStart), pe = toStr(prevEnd);
    const prevExp = allTxs.filter(t=>t.type==="expense"&&t.date>=ps&&t.date<=pe).reduce((s,t)=>s+t.amount,0);
    const prevInc = allTxs.filter(t=>t.type==="income" &&t.date>=ps&&t.date<=pe).reduce((s,t)=>s+t.amount,0);
    const expChange = prevExp>0 ? ((totalExp-prevExp)/prevExp)*100 : null;
    const incChange = prevInc>0 ? ((totalInc-prevInc)/prevInc)*100 : null;

    // Rango habitual de gasto diario
    const dailyMap: Record<string,number> = {};
    const s = new Date(statsRange.startStr+"T00:00:00"), e = new Date(statsRange.endStr+"T00:00:00");
    for (let d=new Date(s); d<=e; d.setDate(d.getDate()+1)) dailyMap[toStr(d)]=0;
    exp.forEach(t=>{ if(t.date in dailyMap) dailyMap[t.date]+=t.amount; });
    const dailyVals = Object.values(dailyMap);
    const vol = stdDev(dailyVals);

    // Tendencia de ahorro mensual (6 meses)
    const today = new Date();
    const monthlySavings: {label:string;Ahorro:number;Ingresos:number;Gastos:number}[] = [];
    for (let i=5; i>=0; i--) {
      const d=new Date(today); d.setDate(1); d.setMonth(d.getMonth()-i);
      const ms=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const mTxs=allTxs.filter(t=>t.date.startsWith(ms));
      const mInc=mTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
      const mExp=mTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
      monthlySavings.push({ label:d.toLocaleDateString("es-MX",{month:"short"}), Ahorro:mInc-mExp, Ingresos:mInc, Gastos:mExp });
    }

    const largestIncTx = inc.length ? inc.reduce((m, t) => t.amount > m.amount ? t : m) : null;
    const largestExpTx = exp.length ? exp.reduce((m, t) => t.amount > m.amount ? t : m) : null;

    const catMap: Record<string, { name: string; emoji: string; amount: number }> = {};
    exp.forEach(t => { const k = t.category_name ?? "Otros"; if (!catMap[k]) catMap[k] = { name: k, emoji: t.category_emoji ?? "📦", amount: 0 }; catMap[k].amount += t.amount; });
    const topCatEntry = Object.values(catMap).sort((a, b) => b.amount - a.amount)[0] ?? null;
    const topCategory = topCatEntry ? { ...topCatEntry, pct: totalExp > 0 ? (topCatEntry.amount / totalExp) * 100 : 0 } : null;

    const activeDays = new Set(statsTxs.map(t => t.date)).size;

    const weeks = statsRange.totalDays / 7;
    const avgWeeklyInc = weeks > 0 ? totalInc / weeks : 0;
    const avgWeeklyExp = weeks > 0 ? totalExp / weeks : 0;

    return { totalInc, totalExp, avgDailyInc, avgDailyExp, savingsRate,
             largestExp: largestExpTx?.amount ?? 0, largestExpDate: largestExpTx?.date,
             largestInc: largestIncTx?.amount ?? 0, largestIncDate: largestIncTx?.date,
             topCategory, activeDays, avgWeeklyInc, avgWeeklyExp,
             expChange, incChange, prevExp, prevInc,
             vol, rangoLow: Math.max(0,avgDailyExp-vol), rangoHigh: avgDailyExp+vol,
             incCount: inc.length, expCount: exp.length, monthlySavings };
  }, [statsTxs, allTxs, statsRange]);

  // ── Datos: Patrones ───────────────────────────────────────────────────────
  const patData = useMemo(() => {
    const exp = patTxs.filter(t=>t.type==="expense");
    const totalExp = exp.reduce((s,t)=>s+t.amount,0);

    const gd = patRange.totalDays<=31 ? 1 : patRange.totalDays<=90 ? 7 : 30;
    const pStart=new Date(patRange.startStr+"T00:00:00"), pEnd=new Date(patRange.endStr+"T00:00:00");
    const inc = patTxs.filter(t=>t.type==="income");
    const trendData: {label:string;Gastos:number;Ingresos:number}[] = [];
    let cur=new Date(pStart);
    while (cur<=pEnd) {
      const ge=new Date(cur); ge.setDate(ge.getDate()+gd-1); if(ge>pEnd) ge.setTime(pEnd.getTime());
      const cs=toStr(cur), ce=toStr(ge);
      trendData.push({ label: gd>=28 ? cur.toLocaleDateString("es-MX",{month:"short"}) : `${String(cur.getDate()).padStart(2,"0")}/${String(cur.getMonth()+1).padStart(2,"0")}`, Gastos:exp.filter(t=>t.date>=cs&&t.date<=ce).reduce((s,t)=>s+t.amount,0), Ingresos:inc.filter(t=>t.date>=cs&&t.date<=ce).reduce((s,t)=>s+t.amount,0) });
      cur.setDate(cur.getDate()+gd);
    }

    // Categorías
    const catMap: Record<string,{name:string;emoji:string;amount:number;count:number}> = {};
    exp.forEach(t=>{ const k=t.category_name??"Otros"; if(!catMap[k]) catMap[k]={name:k,emoji:t.category_emoji??"📦",amount:0,count:0}; catMap[k].amount+=t.amount; catMap[k].count++; });
    const _catSorted  = Object.values(catMap).sort((a,b)=>b.amount-a.amount);
    const _catTotal   = _catSorted.reduce((s,c)=>s+c.amount,0);
    const _countTotal = _catSorted.reduce((s,c)=>s+c.count,0);
    const catAll      = _catSorted.map(c=>({name:`${c.emoji} ${c.name}`,amount:c.amount,count:c.count,pct:_catTotal>0?(c.amount/_catTotal)*100:0,countPct:_countTotal>0?(c.count/_countTotal)*100:0}));
    const catVolume = catAll.slice(0,6);
    const catFreq   = Object.values(catMap).sort((a,b)=>b.count-a.count).slice(0,6);
    const catPie    = Object.values(catMap).sort((a,b)=>b.amount-a.amount).slice(0,6).map(c=>({name:c.name,emoji:c.emoji,value:c.amount}));

    // Día de semana — promedio por ocurrencia real del día en el período
    const dayNames=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const dayMap: Record<number,{sum:number;dayCount:number}> = {};
    for(let i=0;i<7;i++) dayMap[i]={sum:0,dayCount:0};
    const _ds=new Date(patRange.startStr+"T00:00:00"), _de=new Date(patRange.endStr+"T00:00:00");
    for(let d=new Date(_ds);d<=_de;d.setDate(d.getDate()+1)) dayMap[d.getDay()].dayCount++;
    exp.forEach(t=>{ const d=new Date(t.date+"T00:00:00").getDay(); dayMap[d].sum+=t.amount; });
    const dayData = dayNames.map((name,i)=>({ name, weekend:i===0||i===6, avg:dayMap[i].dayCount>0?Math.round(dayMap[i].sum/dayMap[i].dayCount):0 }));

    // Histograma
    const maxAmt = exp.length ? Math.max(...exp.map(t=>t.amount)) : 0;
    const minAmt = exp.length ? Math.min(...exp.map(t=>t.amount)) : 0;
    const LOG_BREAKS = [50,100,200,500,1000,2000,5000,10000,20000,50000,100000];
    const allBuckets: {label:string;min:number;max:number}[] = [
      {label:`<$${LOG_BREAKS[0]}`, min:0, max:LOG_BREAKS[0]},
      ...LOG_BREAKS.slice(0,-1).map((b,i)=>({label:`${fmtK(b)}-${fmtK(LOG_BREAKS[i+1])}`,min:b,max:LOG_BREAKS[i+1]})),
      {label:`>${fmtK(LOG_BREAKS[LOG_BREAKS.length-1])}`, min:LOG_BREAKS[LOG_BREAKS.length-1], max:Infinity},
    ];
    const relevantBuckets = allBuckets.filter(b => b.min <= maxAmt && (b.max === Infinity || b.max >= minAmt));
    const histData = relevantBuckets.map(b=>{const txs=exp.filter(t=>t.amount>=b.min&&t.amount<b.max);return{label:b.label,count:txs.length,amount:txs.reduce((s,t)=>s+t.amount,0)};});

    // Gastos repetidos (merchants)
    const descMap: Record<string,{desc:string;emoji:string;count:number;total:number}> = {};
    exp.forEach(t=>{ const k=(t.description??"").trim().toLowerCase(); if(!k) return; if(!descMap[k]) descMap[k]={desc:t.description??k,emoji:t.category_emoji??"📦",count:0,total:0}; descMap[k].count++; descMap[k].total+=t.amount; });
    const topDesc = Object.values(descMap).filter(d=>d.count>1).sort((a,b)=>b.total-a.total).slice(0,8);
    const topDescMax = topDesc.length ? topDesc[0].total : 1;

    // Quincena 1 vs 2 (días 1-15 vs 16-fin)
    const q1 = exp.filter(t => parseInt(t.date.slice(8)) <= 15).reduce((s,t)=>s+t.amount, 0);
    const q2 = exp.filter(t => parseInt(t.date.slice(8)) > 15).reduce((s,t)=>s+t.amount, 0);

    // Top 5 días de mayor gasto
    const dayTotals: Record<string,number> = {};
    exp.forEach(t=>{ dayTotals[t.date]=(dayTotals[t.date]||0)+t.amount; });
    const topDays = Object.entries(dayTotals).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([date, amount])=>({ date, amount }));

    // Tendencias por categoría vs período anterior
    const prevStart2 = new Date(patRange.startStr+"T00:00:00");
    prevStart2.setDate(prevStart2.getDate()-patRange.totalDays);
    const prevEnd2 = new Date(patRange.startStr+"T00:00:00");
    prevEnd2.setDate(prevEnd2.getDate()-1);
    const ps2=toStr(prevStart2), pe2=toStr(prevEnd2);
    const prevExpMap: Record<string,number> = {};
    allTxs.filter(t=>t.type==="expense"&&t.date>=ps2&&t.date<=pe2).forEach(t=>{
      const k=t.category_name??"Otros"; prevExpMap[k]=(prevExpMap[k]||0)+t.amount;
    });
    const catAllWithTrend = catAll.map(c=>{
      const rawName = c.name.replace(/^\S+\s/,"");
      const prev = prevExpMap[rawName]||0;
      const change = prev>0 ? ((c.amount-prev)/prev)*100 : null;
      return { ...c, prev, change };
    });
    const catVolumeWithTrend = catAllWithTrend.slice(0,6);

    // Heatmap de calendario (cada día del período)
    const calDays: {date:string;amount:number;dow:number;week:number}[] = [];
    const calStart=new Date(patRange.startStr+"T00:00:00");
    const calEnd=new Date(patRange.endStr+"T00:00:00");
    const dayAmounts: Record<string,number>={};
    exp.forEach(t=>{ dayAmounts[t.date]=(dayAmounts[t.date]||0)+t.amount; });
    let weekIdx=0;
    for (let cd=new Date(calStart); cd<=calEnd; cd.setDate(cd.getDate()+1)) {
      const ds=toStr(cd);
      if (cd.getDay()===0 && ds!==patRange.startStr) weekIdx++;
      calDays.push({ date:ds, amount:dayAmounts[ds]||0, dow:cd.getDay(), week:weekIdx });
    }
    const calMax=Math.max(...calDays.map(d=>d.amount),1);

    const sortedExp = [...exp].sort((a,b)=>b.amount-a.amount);
    const top3sum  = sortedExp.slice(0,3).reduce((s,t)=>s+t.amount,0);
    const top5sum  = sortedExp.slice(0,5).reduce((s,t)=>s+t.amount,0);
    const top10sum = sortedExp.slice(0,10).reduce((s,t)=>s+t.amount,0);
    const top3pct  = totalExp>0 ? (top3sum/totalExp)*100 : 0;
    const top5pct  = totalExp>0 ? (top5sum/totalExp)*100 : 0;
    const top10pct = totalExp>0 ? (top10sum/totalExp)*100 : 0;
    const top10txs = sortedExp.slice(0,10);

    const weekendTotal = exp.filter(t=>{const d=new Date(t.date+"T00:00:00").getDay();return d===0||d===6;}).reduce((s,t)=>s+t.amount,0);
    const weekdayTotal = exp.filter(t=>{const d=new Date(t.date+"T00:00:00").getDay();return d>0&&d<6;}).reduce((s,t)=>s+t.amount,0);
    const peakDay = dayData.length ? dayData.reduce((max,d)=>d.avg>max.avg?d:max) : null;
    const expDates = new Set(exp.map(t=>t.date));
    const activeDays = expDates.size;

    return { totalExp, trendData, catAll, catAllWithTrend, catVolume, catVolumeWithTrend, catFreq, catPie, dayData, histData, topDesc, topDescMax, q1, q2, topDays, calDays, calMax, expCount:exp.length, groupLabel: gd>=28?"Por mes":gd>=7?"Por semana":"Por día", weekendTotal, weekdayTotal, peakDay, activeDays, top3sum, top5sum, top10sum, top3pct, top5pct, top10pct, top10txs };
  }, [patTxs, patRange]);

  // ── Datos: Seguimiento ────────────────────────────────────────────────────
  const seguimientoData = useMemo(() => {
    // Proyección de metas basada en transacciones etiquetadas
    const goalProjections = allGoals.map(g => {
      const tagged = allTxs.filter(t => t.goal_id===g.id && t.type==="income");
      let monthlyRate = 0;
      let projectedDate: string|null = null;
      const remaining = g.target_amount - g.saved_amount;
      const done = remaining <= 0;

      if (tagged.length >= 1) {
        const sorted = [...tagged].sort((a,b)=>a.date.localeCompare(b.date));
        const firstDate = new Date(sorted[0].date+"T00:00:00");
        const daysDiff = Math.max(1, (new Date().getTime()-firstDate.getTime())/86400000);
        const totalTagged = tagged.reduce((s,t)=>s+t.amount,0);
        monthlyRate = (totalTagged/daysDiff)*30;
        if (!done && monthlyRate > 0) {
          const monthsLeft = remaining/monthlyRate;
          const projDate = new Date(); projDate.setDate(projDate.getDate()+Math.ceil(monthsLeft*30));
          projectedDate = toStr(projDate);
        }
      }

      const pct = g.target_amount>0 ? Math.min((g.saved_amount/g.target_amount)*100,100) : 0;
      return { ...g, monthlyRate, projectedDate, done, pct };
    });

    // Budget vs real: gastos reales por categoría vs presupuesto
    const budgetStatus = allBudgets.map(b => {
      const usedPct = b.amount>0 ? (b.spent/b.amount)*100 : 0;
      const isActive = b.end_date >= toStr(new Date());
      return { ...b, usedPct, isActive };
    }).sort((a,b) => b.usedPct - a.usedPct);

    return { goalProjections, budgetStatus };
  }, [allGoals, allBudgets, allTxs]);

  // ── Vista rápida (3 meses) ─────────────────────────────────────────────────
  const mainRange = useMemo(() => { const t=new Date(),s=new Date(t); s.setDate(s.getDate()-89); return {startStr:toStr(s),endStr:toStr(t)}; }, []);
  const mainTxs    = useMemo(() => allTxs.filter(t=>t.date>=mainRange.startStr&&t.date<=mainRange.endStr), [allTxs,mainRange]);
  const mainExpTxs = mainTxs.filter(t=>t.type==="expense");
  const mainTotal  = mainExpTxs.reduce((s,t)=>s+t.amount,0);
  const catData    = useMemo(() => {
    const m: Record<string,{name:string;emoji:string;value:number}> = {};
    mainExpTxs.forEach(t=>{ const k=t.category_name??"Otros"; if(!m[k]) m[k]={name:k,emoji:t.category_emoji??"📦",value:0}; m[k].value+=t.amount; });
    return Object.values(m).sort((a,b)=>b.value-a.value);
  }, [mainTxs]);
  const flowData = useMemo(() => {
    if(!mainTxs.length) return [];
    const {startStr,endStr} = mainRange;
    const start=new Date(startStr+"T00:00:00"), end=new Date(endStr+"T00:00:00");
    const pts: {label:string;Gastos:number;Ingresos:number}[] = [];
    let cur=new Date(start);
    while (cur<=end) {
      const ge=new Date(cur); ge.setDate(ge.getDate()+6); if(ge>end) ge.setTime(end.getTime());
      const cs=toStr(cur), ce=toStr(ge);
      const g=mainTxs.filter(t=>t.date>=cs&&t.date<=ce);
      pts.push({ label:`${String(cur.getDate()).padStart(2,"0")}/${String(cur.getMonth()+1).padStart(2,"0")}`, Gastos:g.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0), Ingresos:g.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0) });
      cur.setDate(cur.getDate()+7);
    }
    return pts;
  }, [mainTxs,mainRange]);

  const monthlyData = useMemo(() => {
    const months: {label:string;Ingresos:number;Gastos:number}[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0");
      const prefix = `${y}-${m}`;
      const txs = allTxs.filter(t => t.date.startsWith(prefix));
      months.push({
        label: d.toLocaleString("es-MX", { month: "short" }),
        Ingresos: txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),
        Gastos:   txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),
      });
    }
    return months;
  }, [allTxs]);

  const gridColor   = isDark ? "#374151" : "#f3f4f6";
  const tickColor   = isDark ? "#6b7280" : "#9ca3af";
  const gastosColor = isDark ? "#93c5fd" : "#165BC5";

  const currentMonthData = useMemo(() => {
    const today = new Date();
    const ms = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
    const prevD = new Date(today); prevD.setMonth(prevD.getMonth()-1);
    const pms = `${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,"0")}`;
    const txs  = allTxs.filter(t=>t.date.startsWith(ms));
    const ptxs = allTxs.filter(t=>t.date.startsWith(pms));
    const inc  = txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
    const exp  = txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    const pExp = ptxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
    const net  = inc - exp;
    const pct  = inc>0 ? (exp/inc)*100 : 0;
    const vsLastMonth = pExp>0 ? ((exp-pExp)/pExp)*100 : null;
    const catMap: Record<string,{name:string;emoji:string;amount:number}> = {};
    txs.filter(t=>t.type==="expense").forEach(t=>{ const k=t.category_name??"Otros"; if(!catMap[k]) catMap[k]={name:k,emoji:t.category_emoji??"📦",amount:0}; catMap[k].amount+=t.amount; });
    const topCat = Object.values(catMap).sort((a,b)=>b.amount-a.amount)[0]??null;
    const activeBudgets = allBudgets.filter(b=>b.end_date>=toStr(today)).map(b=>({...b,usedPct:b.amount>0?(Number(b.spent)/Number(b.amount))*100:0}));
    const worstBudget = activeBudgets.sort((a,b)=>b.usedPct-a.usedPct)[0]??null;

    // Tasa de ahorro
    const savingsRate = inc>0 ? (net/inc)*100 : 0;

    // Día pico de gasto del mes
    const dayMap: Record<number,{sum:number;cnt:number}> = {};
    for(let i=0;i<7;i++) dayMap[i]={sum:0,cnt:0};
    const mStart=new Date(today.getFullYear(),today.getMonth(),1);
    const mEnd=new Date(today.getFullYear(),today.getMonth()+1,0);
    for(let d=new Date(mStart);d<=mEnd;d.setDate(d.getDate()+1)) dayMap[d.getDay()].cnt++;
    txs.filter(t=>t.type==="expense").forEach(t=>{const d=new Date(t.date+"T00:00:00").getDay();dayMap[d].sum+=t.amount;});
    const DAYS=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const peakDay = Object.entries(dayMap).map(([d,v])=>({name:DAYS[+d],avg:v.cnt>0?v.sum/v.cnt:0})).reduce((a,b)=>b.avg>a.avg?b:a,{name:"—",avg:0});

    // Concentración top 3
    const sortedExp=[...txs.filter(t=>t.type==="expense")].sort((a,b)=>b.amount-a.amount);
    const top3pct = exp>0 ? (sortedExp.slice(0,3).reduce((s,t)=>s+t.amount,0)/exp)*100 : 0;

    // Tendencia diaria del mes actual
    const dailyTrend: {label:string;Ingresos:number;Gastos:number}[] = [];
    for (let d=new Date(mStart); d<=mEnd; d.setDate(d.getDate()+1)) {
      const ds=toStr(d);
      const dtxs=txs.filter(t=>t.date===ds);
      dailyTrend.push({ label:String(d.getDate()), Ingresos:dtxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0), Gastos:dtxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0) });
    }
    const monthlyHistory = dailyTrend;

    // Todas las categorías del mes para barra horizontal
    const catAll = Object.values(catMap).sort((a,b)=>b.amount-a.amount).map(c=>{
      const total=Object.values(catMap).reduce((s,x)=>s+x.amount,0);
      return {name:`${c.emoji} ${c.name}`, amount:c.amount, pct:total>0?(c.amount/total)*100:0};
    });
    const catPie = catAll.slice(0,6).map(c=>({name:c.name,emoji:"",value:c.amount}));

    return { inc, exp, net, pct, vsLastMonth, topCat, worstBudget, monthlyHistory, catPie, catAll, savingsRate, peakDay, top3pct };
  }, [allTxs, allBudgets]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-[#165BC5] border-t-transparent rounded-full" /></div>;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Cards de entrada */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <EntryCard title="Estadísticas" sub="KPIs del período: totales, promedios y comparativas"
          icon={<div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><BarChart2 className="w-5 h-5 text-[#165BC5]" /></div>}
          onClick={() => setShowStats(true)} />
        <EntryCard title="Patrones" sub="Cuándo y en qué gastas: categorías, días, montos"
          icon={<div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center"><BarChart2 className="w-5 h-5 text-violet-500" /></div>}
          onClick={() => setShowPatrones(true)} />
        <EntryCard title="Laboratorio IA" sub="Preguntas libres, hipotéticos y recomendaciones"
          icon={<div className="w-9 h-9 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-xl flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>}
          onClick={() => setShowLab(true)} />
        {false && <EntryCard title="Seguimiento" sub="Presupuestos vs real y proyección de metas"
          icon={<div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-amber-500" /></div>}
          onClick={() => setShowSeguimiento(true)} />}
      </div>

      {/* Resumen analítico del mes */}
      <div className="bg-white dark:bg-[#1e2433] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Resumen del mes actual</p>
        {/* Fila 1: números clave */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700/60 mb-4">
          <div className="pr-6">
            <p className="text-xs text-gray-400 mb-0.5">Balance neto</p>
            <p className={`text-3xl font-bold ${currentMonthData.net>=0?"text-emerald-600 dark:text-emerald-400":"text-red-500"}`}>
              {currentMonthData.net>=0?"+":""}{fmt(currentMonthData.net)}
            </p>
            {currentMonthData.vsLastMonth!==null && (
              <span className={`text-xs font-semibold ${currentMonthData.vsLastMonth>0?"text-red-400":"text-emerald-500"}`}>
                Gastos {currentMonthData.vsLastMonth>0?"↑":"↓"}{Math.abs(currentMonthData.vsLastMonth).toFixed(0)}% vs mes ant.
              </span>
            )}
          </div>
          <div className="pl-6">
            <p className="text-xs text-gray-400 mb-0.5">Tasa de ahorro</p>
            <p className={`text-3xl font-bold ${currentMonthData.savingsRate>=0?"text-[#165BC5]":"text-red-500"}`}>
              {currentMonthData.savingsRate.toFixed(1)}%
            </p>
            <span className="text-xs text-gray-400">{fmt(currentMonthData.inc)} ingresado · {fmt(currentMonthData.exp)} gastado</span>
          </div>
        </div>
        {/* Fila 2: insights de comportamiento */}
        <div className="border-t border-gray-100 dark:border-gray-700/60 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Día pico de gasto</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{currentMonthData.peakDay.name}</p>
            {currentMonthData.peakDay.avg>0 && <p className="text-xs text-gray-400">~{fmt(currentMonthData.peakDay.avg)} promedio</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Categoría top</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
              {currentMonthData.topCat ? `${currentMonthData.topCat.emoji} ${currentMonthData.topCat.name}` : "—"}
            </p>
            {currentMonthData.topCat && <p className="text-xs text-gray-400">{fmt(currentMonthData.topCat.amount)}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Concentración</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{currentMonthData.top3pct.toFixed(0)}% en top 3</p>
            <p className="text-xs text-gray-400">de tus gastos totales</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Presupuesto ajustado</p>
            {currentMonthData.worstBudget ? (
              <>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{currentMonthData.worstBudget.name}</p>
                <p className={`text-xs font-semibold ${currentMonthData.worstBudget.usedPct>=100?"text-red-500":currentMonthData.worstBudget.usedPct>=70?"text-amber-500":"text-emerald-500"}`}>
                  {currentMonthData.worstBudget.usedPct.toFixed(0)}% usado
                </p>
              </>
            ) : <p className="text-sm text-gray-400">Sin presupuestos</p>}
          </div>
        </div>
      </div>

      {/* Gráficas del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tendencia diaria del mes */}
        <div className="bg-white dark:bg-[#1e2433] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">Tendencia del mes</p>
          <p className="text-xs text-gray-400 mb-4">Ingresos y gastos día a día</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={currentMonthData.monthlyHistory} margin={{top:4,right:8,left:0,bottom:0}}>
              <defs>
                <linearGradient id="gradCurInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                <linearGradient id="gradCurExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="label" tick={{fontSize:10,fill:tickColor}} axisLine={false} tickLine={false} interval={4} />
              <YAxis tickFormatter={fmtK} tick={{fontSize:11,fill:tickColor}} axisLine={false} tickLine={false} width={38} />
              <ReTooltip content={<ChartTooltip dark={isDark} />} />
              <Area type="monotone" dataKey="Ingresos" stroke="#34d399" strokeWidth={2} fill="url(#gradCurInc)" dot={false} activeDot={{r:4,fill:"#34d399",strokeWidth:0}} />
              <Area type="monotone" dataKey="Gastos"   stroke="#ef4444" strokeWidth={2} fill="url(#gradCurExp)" dot={false} activeDot={{r:4,fill:"#ef4444",strokeWidth:0}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por categoría — dona */}
        <div className="bg-white dark:bg-[#1e2433] rounded-2xl border border-gray-200 dark:border-gray-700/60 p-5">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">Distribución del mes</p>
          <p className="text-xs text-gray-400 mb-3">Gasto por categoría</p>
          {currentMonthData.catAll.length===0 ? (
            <p className="text-sm text-gray-400 text-center py-16">Sin gastos este mes</p>
          ) : (
            <div className="flex gap-3">
              {/* Leyenda — 1/3 */}
              <div className="w-1/3 flex flex-col justify-center gap-1.5 overflow-y-auto max-h-[240px]">
                {currentMonthData.catAll.map((c,i)=>(
                  <div key={i} className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:CAT_COLORS[i%CAT_COLORS.length]}} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{c.name}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">{c.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              {/* Dona — 2/3 */}
              <div className="w-2/3">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={currentMonthData.catAll} dataKey="amount" cx="50%" cy="50%" innerRadius={68} outerRadius={108} paddingAngle={2} stroke="none">
                      {currentMonthData.catAll.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]} />)}
                    </Pie>
                    <ReTooltip content={<PieTooltip dark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════ MODAL 1: ESTADÍSTICAS ════ */}
      {showStats && (
        <ModalOverlay onClose={() => setShowStats(false)} size="xl">
          <ModalHeader
            icon={<div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><BarChart2 className="w-5 h-5 text-[#165BC5]" /></div>}
            title="Estadísticas" subtitle={`${statsTxs.length} transacciones · ${statsRange.startStr} → ${statsRange.endStr}`}
            onClose={() => setShowStats(false)} />
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            <ChipPills value={statsChip} onChange={setStatsChip} from={statsFrom} to={statsTo} onFrom={setStatsFrom} onTo={setStatsTo} />

            {/* KPIs duales — fila de 4 */}
            {(() => { const net = statsData.totalInc - statsData.totalExp; return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DualKpi label="Total del período" incValue={fmt(statsData.totalInc)} expValue={fmt(statsData.totalExp)} />
              <DualKpi label="Promedio diario"
                incValue={statsData.avgDailyInc > 0 ? fmt(statsData.avgDailyInc) : "—"}
                expValue={statsData.avgDailyExp > 0 ? fmt(statsData.avgDailyExp) : "—"}
                incSub={`${statsRange.totalDays} días`} expSub={`${statsRange.totalDays} días`} />
              <DualKpi label="Transacciones" incValue={String(statsData.incCount)} expValue={String(statsData.expCount)} />
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 flex flex-col">
                <p className="text-sm text-gray-400 font-medium mb-3">Resultado</p>
                <div className="grid grid-cols-2 gap-3 divide-x divide-gray-200 dark:divide-gray-600 w-full">
                  <div className="pr-3">
                    <p className="text-xs text-gray-400 font-semibold mb-1">Balance neto</p>
                    <p className={`text-xl font-bold leading-tight ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {net >= 0 ? "+" : ""}{fmt(net)}
                    </p>
                  </div>
                  <div className="pl-3">
                    <p className="text-xs text-gray-400 font-semibold mb-1">Tasa ahorro</p>
                    <p className={`text-xl font-bold leading-tight ${statsData.savingsRate >= 0 ? "text-[#165BC5]" : "text-red-500"}`}>{statsData.savingsRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
            ); })()}

            {/* KPIs fila 2 — 4 DualKpi */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DualKpi label="Promedio por movimiento"
                incValue={statsData.incCount > 0 ? fmt(statsData.totalInc / statsData.incCount) : "—"}
                expValue={statsData.expCount > 0 ? fmt(statsData.totalExp / statsData.expCount) : "—"} />
              <DualKpi label="Promedio semanal"
                incValue={statsData.avgWeeklyInc > 0 ? fmt(statsData.avgWeeklyInc) : "—"}
                expValue={statsData.avgWeeklyExp > 0 ? fmt(statsData.avgWeeklyExp) : "—"}
                incSub={`${(statsRange.totalDays / 7).toFixed(1)} sem`}
                expSub={`${(statsRange.totalDays / 7).toFixed(1)} sem`} />
              <DualKpi label="Mayor movimiento"
                incValue={statsData.largestInc ? fmt(statsData.largestInc) : "—"}
                expValue={statsData.largestExp ? fmt(statsData.largestExp) : "—"}
                incSub={statsData.largestIncDate ? new Date(statsData.largestIncDate + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : undefined}
                expSub={statsData.largestExpDate ? new Date(statsData.largestExpDate + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : undefined} />
              <SingleKpi label="Rango diario habitual"
                value={statsData.vol > 0 ? `${fmtK(statsData.rangoLow)} – ${fmtK(statsData.rangoHigh)}` : `~${fmt(statsData.avgDailyExp)}`}
                sub={statsData.vol > 0 ? "promedio ± desv. estándar" : undefined} />
            </div>

            {/* Comparativa período anterior */}
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 flex gap-6">
              <div className="flex flex-col gap-4 shrink-0 w-44">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Comparativa período anterior<br/><span className="text-xs font-normal text-gray-400">{statsRange.totalDays} días previos</span></p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Ingresos anteriores</p>
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">{statsData.prevInc ? fmt(statsData.prevInc) : "—"}</p>
                    {statsData.incChange !== null && (
                      <span className={`text-sm font-bold ${statsData.incChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {statsData.incChange >= 0 ? "↑ " : "↓ "}{Math.abs(statsData.incChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Gastos anteriores</p>
                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">{statsData.prevExp ? fmt(statsData.prevExp) : "—"}</p>
                    {statsData.expChange !== null && (
                      <span className={`text-sm font-bold ${statsData.expChange > 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {statsData.expChange > 0 ? "↑ +" : "↓ "}{Math.abs(statsData.expChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-2">Actual vs Anterior — período completo</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: "Actual",   Ingresos: statsData.totalInc, Gastos: statsData.totalExp },
                    { name: "Anterior", Ingresos: statsData.prevInc,  Gastos: statsData.prevExp  },
                  ]} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} width={44} />
                    <ReTooltip cursor={false} formatter={(v: unknown) => fmt(v as number)} contentStyle={{ background: isDark ? "#1e2433" : "#fff", border: "none", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gastos"   fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ════ MODAL 2: (eliminado) ════ */}
      {false && (
        <ModalOverlay onClose={() => setShowFlujo(false)} size="xl">
          <ModalHeader
            icon={<div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-emerald-500" /></div>}
            title="Calendario financiero" subtitle="Gastos históricos y eventos futuros"
            onClose={() => setShowFlujo(false)} />
          {(() => {
            const today = new Date();
            const todayStr = toStr(today);
            const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
            const firstDow = new Date(calYear, calMonth, 1).getDay();
            const monthStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}`;

            // Gasto por día del mes
            const spendByDay: Record<number,number> = {};
            const incByDay: Record<number,number> = {};
            allTxs.filter(t=>t.date.startsWith(monthStr)).forEach(t=>{
              const d = parseInt(t.date.slice(8));
              if (t.type==="expense") spendByDay[d]=(spendByDay[d]||0)+t.amount;
              else incByDay[d]=(incByDay[d]||0)+t.amount;
            });
            const maxSpend = Math.max(...Object.values(spendByDay), 1);

            // Eventos por día (recurrentes, presupuestos, metas)
            type CalEvent = {type:"recurring"|"budget"|"goal"; label:string; color:string; txType?:string};
            const eventsByDay: Record<number, CalEvent[]> = {};
            const addEvent = (day:number, ev:CalEvent) => { if(!eventsByDay[day]) eventsByDay[day]=[]; eventsByDay[day].push(ev); };

            allRecurring.filter(r=>r.is_active&&r.next_date?.startsWith(monthStr)).forEach(r=>{
              const d=parseInt(r.next_date.slice(8));
              addEvent(d,{type:"recurring",label:r.name,color:r.type==="income"?"#34d399":"#ef4444",txType:r.type});
            });
            allBudgets.filter(b=>b.end_date?.startsWith(monthStr)).forEach(b=>{
              const d=parseInt(b.end_date.slice(8));
              addEvent(d,{type:"budget",label:`Fin: ${b.name}`,color:"#f59e0b"});
            });
            seguimientoData.goalProjections.filter(g=>g.projectedDate?.startsWith(monthStr)).forEach(g=>{
              const d=parseInt((g.projectedDate as string).slice(8));
              addEvent(d,{type:"goal",label:`Meta: ${g.name}`,color:"#165BC5"});
            });

            // Próximos eventos (30 días)
            const upcomingEnd = new Date(today); upcomingEnd.setDate(upcomingEnd.getDate()+30);
            const upcomingEndStr = toStr(upcomingEnd);
            type UpcomingEvent = {date:string; label:string; color:string; amount?:number};
            const upcoming: UpcomingEvent[] = [];
            allRecurring.filter(r=>r.is_active&&r.next_date>=todayStr&&r.next_date<=upcomingEndStr)
              .forEach(r=>upcoming.push({date:r.next_date,label:r.name,color:r.type==="income"?"#34d399":"#ef4444",amount:Number(r.amount)}));
            allBudgets.filter(b=>b.end_date>=todayStr&&b.end_date<=upcomingEndStr)
              .forEach(b=>upcoming.push({date:b.end_date,label:`Vence presupuesto: ${b.name}`,color:"#f59e0b"}));
            seguimientoData.goalProjections.filter(g=>g.projectedDate&&g.projectedDate>=todayStr&&g.projectedDate<=upcomingEndStr)
              .forEach(g=>upcoming.push({date:g.projectedDate as string,label:`Meta alcanzada: ${g.name}`,color:"#165BC5"}));
            upcoming.sort((a,b)=>a.date.localeCompare(b.date));

            const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
            const monthName = new Date(calYear,calMonth,1).toLocaleDateString("es-MX",{month:"long",year:"numeric"});

            return (
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Navegación de mes */}
                <div className="flex items-center justify-between">
                  <button onClick={()=>{ const d=new Date(calYear,calMonth-1,1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">{monthName}</h3>
                  <button onClick={()=>{ const d=new Date(calYear,calMonth+1,1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition">
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Calendario */}
                <div>
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS.map(d=><div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({length: firstDow}, (_,i) => <div key={`e${i}`} />)}
                    {Array.from({length: daysInMonth}, (_,i) => {
                      const day = i+1;
                      const ds = `${monthStr}-${String(day).padStart(2,"0")}`;
                      const spend = spendByDay[day]||0;
                      const isToday = ds === todayStr;
                      const isFuture = ds > todayStr;
                      const intensity = spend>0 ? Math.max(0.12, spend/maxSpend) : 0;
                      const events = eventsByDay[day]||[];
                      return (
                        <div key={day} className={`relative rounded-xl p-1.5 min-h-[3.5rem] flex flex-col transition-all ${isToday?"ring-2 ring-[#165BC5]":""} ${isFuture?"opacity-60":""}`}
                          style={{backgroundColor: spend>0 ? `rgba(22,91,197,${intensity*0.7})` : isDark?"rgba(55,65,81,0.3)":"rgba(243,244,246,0.8)"}}>
                          <span className={`text-xs font-bold ${isToday?"text-[#165BC5]":spend>0?"text-white":"text-gray-500 dark:text-gray-400"}`}>{day}</span>
                          {spend>0 && <span className="text-[9px] font-semibold text-white/90 leading-tight">{fmtK(spend)}</span>}
                          {events.length>0 && (
                            <div className="flex flex-wrap gap-0.5 mt-auto">
                              {events.slice(0,3).map((ev,ei)=>(
                                <div key={ei} className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:ev.color}} title={ev.label} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leyenda */}
                <div className="flex items-center gap-5 text-xs text-gray-400 flex-wrap">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#165BC5]/70"/><span>Gastos (más oscuro = más gasto)</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#34d399]"/><span>Ingreso recurrente</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"/><span>Gasto recurrente</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"/><span>Vence presupuesto</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#165BC5]"/><span>Meta proyectada</span></div>
                </div>

                {/* Próximos eventos */}
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Próximos 30 días</p>
                    <div className="space-y-2">
                      {upcoming.map((ev,i)=>(
                        <div key={i} className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:ev.color}}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{ev.label}</p>
                            <p className="text-xs text-gray-400">{new Date(ev.date+"T00:00:00").toLocaleDateString("es-MX",{weekday:"short",day:"numeric",month:"short"})}</p>
                          </div>
                          {ev.amount !== undefined && <span className="text-sm font-bold shrink-0" style={{color:ev.color}}>{fmt(ev.amount)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </ModalOverlay>
      )}

      {/* ════ MODAL 3: PATRONES ════ */}
      {showPatrones && (
        <ModalOverlay onClose={() => setShowPatrones(false)} size="xl">
          <ModalHeader
            icon={<div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center"><BarChart2 className="w-5 h-5 text-violet-500" /></div>}
            title="Patrones de gasto" subtitle={`${patData.expCount} gastos · ${patData.totalExp>0?fmt(patData.totalExp)+" total":""} · ${patRange.startStr} → ${patRange.endStr}`}
            onClose={() => setShowPatrones(false)} />
          <div className="overflow-y-auto flex-1 p-6 space-y-8">
            <ChipPills value={patChip} onChange={setPatChip} from={patFrom} to={patTo} onFrom={setPatFrom} onTo={setPatTo} />

            {patData.catPie.length===0 ? (
              <p className="text-sm text-gray-400 text-center py-16">Sin gastos en el período seleccionado</p>
            ) : <>

            {/* ══ BLOQUE: CATEGORÍAS ══ */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0.5">Categorías</h3>
                <p className="text-sm text-gray-400">Distribución, frecuencia y tendencias de tus gastos</p>
              </div>

              {/* Toggle + BarChart horizontal */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {(["amount","count"] as const).map(v => (
                    <button key={v} onClick={() => setPatChartView(v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${patChartView===v ? "bg-[#165BC5] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-[#165BC5]"}`}>
                      {v === "amount" ? "Por monto" : "Por frecuencia"}
                    </button>
                  ))}
                </div>
                {(() => {
                  const data = patChartView === "amount"
                    ? patData.catAll
                    : [...patData.catAll].sort((a,b) => b.count - a.count);
                  return (
                    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
                      <BarChart data={data} layout="vertical" margin={{top:0,right:16,left:0,bottom:0}} barCategoryGap="25%">
                        <CartesianGrid stroke={gridColor} horizontal={false} />
                        <XAxis type="number" tickFormatter={patChartView==="amount" ? fmtK : (v:number)=>`${v}`} tick={{fontSize:12,fill:tickColor}} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{fontSize:14,fill:tickColor}} axisLine={false} tickLine={false} width={150} />
                        <ReTooltip cursor={false}
                          formatter={(v:unknown) => [patChartView==="amount" ? fmt(v as number) : `${v as number} veces`, patChartView==="amount" ? "Monto" : "Frecuencia"]}
                          contentStyle={{background:isDark?"#1e2433":"#fff",border:"none",borderRadius:8,fontSize:12}}
                          labelStyle={{color:isDark?"#e5e7eb":"#111827",fontWeight:600}}
                          itemStyle={{color:isDark?"#e5e7eb":"#374151"}} />
                        <Bar dataKey={patChartView==="amount" ? "amount" : "count"} radius={[0,4,4,0]}>
                          {data.map((_,i) => <Cell key={i} fill={PAT_COLORS[i%PAT_COLORS.length]} />)}
                          {patChartView==="amount"
                            ? <LabelList dataKey="pct" position="insideRight" formatter={(v:number)=>`${v.toFixed(0)}%`} style={{fill:"#ffffff",fontSize:13,fontWeight:700}} />
                            : <LabelList dataKey="countPct" position="insideRight" formatter={(v:number)=>`${v.toFixed(0)}%`} style={{fill:"#ffffff",fontSize:13,fontWeight:700}} />
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              {/* Dos tablas independientes */}
              <div className="grid grid-cols-2 gap-4">
                {/* Por monto */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ranking por monto</p>
                    <p className="text-xs text-gray-400">Categorías con mayor gasto total en el período</p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-100 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700/60">
                    <span className="col-span-2">Categoría</span>
                    <span className="text-right">Total</span>
                    <span className="text-right">Cambio</span>
                  </div>
                  {patData.catAllWithTrend.map((c,i) => (
                    <div key={i} className="grid grid-cols-4 items-center py-2.5 px-4 border-b border-gray-100 dark:border-gray-700/40 last:border-0">
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:PAT_COLORS[i%PAT_COLORS.length]}} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 text-right">{fmt(c.amount)}</span>
                      <div className="flex justify-end">
                        {c.change !== null ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            c.change > 5 ? "bg-red-50 dark:bg-red-900/20 text-red-500" :
                            c.change < -5 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" :
                            "bg-gray-100 dark:bg-gray-600/40 text-gray-500"
                          }`}>
                            {c.change > 0 ? "↑" : c.change < 0 ? "↓" : "="} {Math.abs(c.change).toFixed(0)}%
                          </span>
                        ) : <span className="text-xs text-gray-400">nuevo</span>}
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Por frecuencia */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ranking por frecuencia</p>
                    <p className="text-xs text-gray-400">Categorías en las que gastas más seguido</p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-100 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700/60">
                    <span className="col-span-2">Categoría</span>
                    <span className="text-right">Veces</span>
                    <span className="text-right">Total</span>
                  </div>
                  {[...patData.catAllWithTrend].sort((a,b)=>b.count-a.count).map((c,i) => (
                    <div key={i} className="grid grid-cols-4 items-center py-2.5 px-4 border-b border-gray-100 dark:border-gray-700/40 last:border-0">
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{backgroundColor:PAT_COLORS[i%PAT_COLORS.length]}} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 text-right">{c.count}×</span>
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400 text-right">{fmt(c.amount)}</span>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ══ BLOQUE: TIEMPO ══ */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0.5">Tiempo</h3>
                <p className="text-sm text-gray-400">Cuándo gastas, qué días y cómo se distribuye en el mes</p>
              </div>

            {/* ¿Cuándo gastas? */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Gasto promedio por día de la semana</p>
                <p className="text-xs text-gray-400 mb-4">Gasto total dividido entre las veces que apareció cada día en el período</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={patData.dayData} margin={{top:4,right:12,left:0,bottom:0}}>
                    <CartesianGrid stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize:13,fill:tickColor,fontWeight:600}} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={fmtK} tick={{fontSize:12,fill:tickColor}} tickLine={false} axisLine={false} width={50} />
                    <ReTooltip content={<ChartTooltip dark={isDark} />} />
                    <Bar dataKey="avg" name="Promedio" radius={[6,6,0,0]}>
                      {patData.dayData.map((d,i)=>(
                        <Cell key={i} fill={d.weekend ? "#f59e0b" : "#165BC5"} fillOpacity={d.weekend ? 1 : 0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: "Día pico de gasto", value: patData.peakDay ? patData.peakDay.name : "—", sub: patData.peakDay ? `~${fmt(patData.peakDay.avg)} en promedio` : undefined },
                  { label: "Fin de semana vs hábiles", value: patData.weekendTotal > 0 || patData.weekdayTotal > 0 ? `${((patData.weekendTotal/(patData.weekendTotal+patData.weekdayTotal))*100).toFixed(0)}% fin de semana` : "—", sub: `${fmt(patData.weekendTotal)} vs ${fmt(patData.weekdayTotal)}` },
                  { label: "Días con gasto", value: patData.activeDays > 0 ? `${((patData.activeDays / patRange.totalDays)*100).toFixed(0)}%` : "—", sub: `${patData.activeDays} de ${patRange.totalDays} días` },
                ].map(k => (
                  <div key={k.label} className="flex-1 bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 flex flex-col justify-center">
                    <p className="text-xs text-gray-400 font-medium mb-1">{k.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{k.value}</p>
                    {k.sub && <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>}
                  </div>
                ))}
              </div>
            </div>




            {/* Tendencia en el período */}
            {patData.trendData.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Tendencia en el período</p>
                <p className="text-xs text-gray-400 mb-4">Evolución de gastos e ingresos — agrupado {patData.groupLabel.toLowerCase()}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={patData.trendData} margin={{top:4,right:8,left:0,bottom:0}}>
                    <defs>
                      <linearGradient id="gradPatInc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradPatExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="label" tick={{fontSize:11,fill:tickColor}} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={fmtK} tick={{fontSize:11,fill:tickColor}} tickLine={false} axisLine={false} width={44} />
                    <ReTooltip content={<ChartTooltip dark={isDark} />} />
                    <Area type="monotone" dataKey="Ingresos" stroke="#34d399" strokeWidth={2.5} fill="url(#gradPatInc)" dot={{r:3,fill:"#34d399",strokeWidth:0}} activeDot={{r:5,fill:"#34d399",strokeWidth:0}} />
                    <Area type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2.5} fill="url(#gradPatExp)" dot={{r:3,fill:"#ef4444",strokeWidth:0}} activeDot={{r:5,fill:"#ef4444",strokeWidth:0}} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-full bg-[#34d399]"/><span className="text-xs text-gray-400">Ingresos</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-full bg-[#ef4444]"/><span className="text-xs text-gray-400">Gastos</span></div>
                </div>
              </div>
            )}

            </div>{/* fin bloque Tiempo */}

            {/* ══ BLOQUE: MONTOS ══ */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-0.5">Montos</h3>
                <p className="text-sm text-gray-400">Cuánto gastas por compra y dónde se repite más</p>
              </div>

              {/* Histograma de rangos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">¿Cuánto sueles gastar por compra?</p>
                    <p className="text-xs text-gray-400">Distribución por rango de monto</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["count","amount"] as const).map(v => (
                      <button key={v} onClick={() => setHistView(v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${histView===v ? "bg-[#165BC5] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-[#165BC5]"}`}>
                        {v === "count" ? "Transacciones" : "Monto total"}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={patData.histData} margin={{top:4,right:12,left:0,bottom:0}}>
                    <CartesianGrid stroke={gridColor} vertical={false} />
                    <XAxis dataKey="label" tick={{fontSize:12,fill:tickColor}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize:12,fill:tickColor}} tickLine={false} axisLine={false}
                      allowDecimals={histView==="count"?false:true}
                      tickFormatter={histView==="amount"?fmtK:undefined} />
                    <ReTooltip
                      cursor={false}
                      formatter={(v:unknown) => [histView==="count" ? `${v} transacciones` : fmt(v as number), histView==="count" ? "Frecuencia" : "Total"]}
                      contentStyle={{background:isDark?"#1e2433":"#fff",border:"none",borderRadius:8,fontSize:12}}
                      labelStyle={{color:isDark?"#e5e7eb":"#111827",fontWeight:600}}
                      itemStyle={{color:isDark?"#e5e7eb":"#374151"}} />
                    <Bar dataKey={histView} radius={[6,6,0,0]}>
                      {patData.histData.map((_,i)=><Cell key={i} fill={PAT_COLORS[i%PAT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Movimientos frecuentes */}
              {patData.topDesc.length > 0 && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Movimientos frecuentes</p>
                    <p className="text-xs text-gray-400">Lo que más repites, ordenado por gasto total</p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-100 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700/60">
                      <span className="col-span-2">Descripción</span>
                      <span className="text-right">Veces</span>
                      <span className="text-right">Total</span>
                    </div>
                    {patData.topDesc.map((d,i)=>(
                      <div key={i} className="grid grid-cols-4 items-center py-2.5 px-4 border-b border-gray-100 dark:border-gray-700/40 last:border-0">
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{d.emoji}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{d.desc}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 text-right">{d.count}×</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{fmt(d.total)}</p>
                          <p className="text-xs text-gray-400">~{fmt(d.total/d.count)} c/u</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concentración del gasto */}
              {patData.expCount >= 3 && (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Concentración del gasto</p>
                    <p className="text-xs text-gray-400">Cuánto del total representan tus mayores movimientos</p>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-100 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700/60">
                      <span>Nivel</span>
                      <span className="text-right">% del total</span>
                    </div>
                    {[
                      { label:"Top 3", pct:patData.top3pct, sum:patData.top3sum, color:"#ef4444" },
                      { label:"Top 5", pct:patData.top5pct, sum:patData.top5sum, color:"#165BC5" },
                      { label:"Top 10", pct:patData.top10pct, sum:patData.top10sum, color:"#f59e0b" },
                    ].map(row=>(
                      <div key={row.label} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/40 last:border-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.label}</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{row.pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${row.pct}%`, backgroundColor:row.color}} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{fmt(row.sum)} del total</p>
                      </div>
                    ))}
                    <div className="px-4 py-3 space-y-1.5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top 10 movimientos</p>
                      {patData.top10txs.map((t,i)=>{
                        const color = i<3 ? "#ef4444" : i<5 ? "#165BC5" : "#f59e0b";
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:color}} />
                            <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{t.description || "Sin descripción"}</span>
                            <span className="font-bold shrink-0" style={{color}}>{fmt(t.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            </div>{/* fin bloque Montos */}

            </>}
          </div>
        </ModalOverlay>
      )}

      {/* ════ MODAL 4: SEGUIMIENTO ════ */}
      {showSeguimiento && (
        <ModalOverlay onClose={() => setShowSeguimiento(false)} size="lg">
          <ModalHeader
            icon={<div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-amber-500" /></div>}
            title="Seguimiento" subtitle={`${allBudgets.length} presupuestos · ${allGoals.length} metas`}
            onClose={() => setShowSeguimiento(false)} />
          <div className="overflow-y-auto flex-1 p-6 space-y-7">

              {/* Presupuestos vs real */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Presupuestos vs Real</h3>
                <p className="text-xs text-gray-400 mb-4">Qué tan ajustado va cada presupuesto con los gastos etiquetados</p>
                {seguimientoData.budgetStatus.length===0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 text-center">
                    <p className="text-sm text-gray-400 mb-2">Sin presupuestos configurados.</p>
                    <a href="/panel/planificacion" className="text-sm text-[#165BC5] hover:underline">Crear presupuesto →</a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {seguimientoData.budgetStatus.map(b => {
                      const p = b.usedPct;
                      const barColor = p>=100?"#ef4444":p>=90?"#f59e0b":"#165BC5";
                      return (
                        <div key={b.id} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {b.category_emoji && <span className="text-base flex-shrink-0">{b.category_emoji}</span>}
                              <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{b.name}</span>
                              {!b.isActive && <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">vencido</span>}
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ml-2 ${p>=100?"text-red-500":p>=90?"text-amber-500":"text-[#165BC5]"}`}>{p.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full rounded-full transition-all" style={{width:`${Math.min(p,100)}%`,backgroundColor:barColor}} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{fmt(b.spent)} gastado</span>
                            <span className={`text-xs font-medium ${b.spent>b.amount?"text-red-500":"text-emerald-500"}`}>
                              {b.spent>b.amount?`Excedido ${fmt(b.spent-b.amount)}`:`Disponible ${fmt(b.amount-b.spent)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Proyección de metas */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Proyección de Metas</h3>
                <p className="text-xs text-gray-400 mb-4">Estimado de cuándo completarás cada meta según tu ritmo de ahorro</p>
                {seguimientoData.goalProjections.length===0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 text-center">
                    <p className="text-sm text-gray-400 mb-2">Sin metas configuradas.</p>
                    <a href="/panel/planificacion" className="text-sm text-[#165BC5] hover:underline">Crear meta →</a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {seguimientoData.goalProjections.map(g => (
                      <div key={g.id} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl flex-shrink-0">{g.emoji??"🎯"}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{g.name}</p>
                              <p className="text-xs text-gray-400">{fmt(g.saved_amount)} de {fmt(g.target_amount)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${g.done?"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600":"bg-blue-50 dark:bg-blue-900/20 text-[#165BC5]"}`}>
                            {g.done?"Completada":`${g.pct.toFixed(0)}%`}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-3">
                          <div className="h-full rounded-full transition-all" style={{width:`${g.pct}%`,backgroundColor:g.done?"#34d399":"#165BC5"}} />
                        </div>
                        {!g.done && (
                          <div className="flex items-center justify-between text-xs">
                            {g.projectedDate ? (
                              <>
                                <span className="text-gray-400">Al ritmo actual ({fmt(g.monthlyRate)}/mes)</span>
                                <span className="font-semibold text-[#165BC5]">Meta: {g.projectedDate}</span>
                              </>
                            ) : g.monthlyRate===0 ? (
                              <span className="text-gray-400">Sin ahorros etiquetados a esta meta aún</span>
                            ) : (
                              <span className="text-emerald-500 font-medium">¡En camino!</span>
                            )}
                          </div>
                        )}
                        {g.deadline && !g.done && (
                          <p className="text-xs text-gray-400 mt-1">Fecha límite: {g.deadline}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </ModalOverlay>
      )}

      {/* ════ MODAL 5: LABORATORIO IA ════ */}
      {showLab && (
        <ModalOverlay onClose={() => setShowLab(false)} size="xl">
          <ModalHeader
            icon={<div className="w-10 h-10 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-xl flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>}
            title="Laboratorio IA" subtitle="Los chats se guardan durante el día y se reinician a la medianoche"
            onClose={() => setShowLab(false)} />

          <div className="flex flex-1 overflow-hidden">

            {/* ── Sidebar de sesiones ── */}
            <div className="w-52 shrink-0 border-r border-gray-200 dark:border-gray-700/60 flex flex-col bg-gray-50 dark:bg-[#161c2a]">
              <div className="p-2.5 border-b border-gray-200 dark:border-gray-700/60">
                <button onClick={createSession}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-[#165BC5] hover:bg-[#0B3EA1] text-white rounded-lg text-sm font-medium transition">
                  <span className="text-base leading-none">+</span> Nueva conversación
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 px-2">Sin conversaciones hoy</p>
                )}
                {sessions.map(s => (
                  <div key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${s.id === activeId ? "bg-[#165BC5]/10 dark:bg-[#165BC5]/20 border border-[#165BC5]/30" : "hover:bg-gray-200/60 dark:hover:bg-gray-700/40"}`}>
                    <Sparkles className={`w-3.5 h-3.5 shrink-0 ${s.id === activeId ? "text-[#165BC5]" : "text-gray-400"}`} />
                    <span className={`flex-1 text-xs truncate ${s.id === activeId ? "text-[#165BC5] font-semibold" : "text-gray-700 dark:text-gray-300"}`}>
                      {s.title}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-gray-400 transition-opacity shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Panel de chat ── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-gray-50 dark:bg-[#161c2a]">

                {chatMsgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[280px] gap-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">¿Qué quieres saber?</p>
                      <p className="text-sm text-gray-400">Pregunta sobre tus gastos, ingresos, categorías o pide recomendaciones</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      <button onClick={loadRecommendations} disabled={aiLoading}
                        className="px-4 py-2 bg-gradient-to-r from-[#165BC5] to-[#0B3EA1] text-white rounded-full text-sm font-medium hover:opacity-90 transition shadow-sm disabled:opacity-50">
                        ✨ Mis recomendaciones
                      </button>
                      {LAB_PILLS.map(pill => (
                        <button key={pill} onClick={() => sendMessage(pill)} disabled={aiLoading}
                          className="px-3 py-1.5 bg-white dark:bg-[#1e2433] border border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:border-[#165BC5] hover:text-[#165BC5] transition disabled:opacity-50">
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMsgs.map(msg => (
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="bg-[#165BC5] text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%] shadow-sm">
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ) : msg.role === "loading" ? (
                    <div key={msg.id} className="flex items-end gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-[#1e2433] border border-gray-200 dark:border-gray-700/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex gap-1.5 items-center h-4">
                          {[0,150,300].map(delay => (
                            <div key={delay} className="w-2 h-2 bg-[#165BC5] rounded-full animate-bounce" style={{animationDelay:`${delay}ms`}} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-full flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2 max-w-[90%]">
                        <div className="bg-white dark:bg-[#1e2433] border border-gray-200 dark:border-gray-700/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">{msg.text}</p>
                        </div>
                        {msg.metrics && msg.metrics.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {msg.metrics.map((m, i) => (
                              <div key={i} className="bg-white dark:bg-[#1e2433] border border-gray-200 dark:border-gray-700/60 rounded-xl p-3 text-center shadow-sm">
                                <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                          <div className="bg-white dark:bg-[#1e2433] border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 shadow-sm">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">{msg.chart.title}</p>
                            <ResponsiveContainer width="100%" height={200}>
                              {msg.chart.type === "pie" ? (
                                <PieChart>
                                  <Pie data={msg.chart.data.map(d=>({...d,name:d.label}))} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" stroke="none">
                                    {msg.chart.data.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]} />)}
                                  </Pie>
                                  <ReTooltip content={<PieTooltip dark={isDark} />} />
                                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}} />
                                </PieChart>
                              ) : msg.chart.type === "line" ? (
                                <LineChart data={msg.chart.data.map(d=>({label:d.label,Valor:d.value}))} margin={{top:4,right:8,left:0,bottom:0}}>
                                  <CartesianGrid stroke={gridColor} vertical={false} />
                                  <XAxis dataKey="label" tick={{fontSize:11,fill:tickColor}} tickLine={false} axisLine={false} />
                                  <YAxis tickFormatter={fmtK} tick={{fontSize:11,fill:tickColor}} tickLine={false} axisLine={false} width={48} />
                                  <ReTooltip content={<ChartTooltip dark={isDark} />} />
                                  <Line type="monotone" dataKey="Valor" stroke={gastosColor} strokeWidth={2.5} dot={{r:3,fill:gastosColor,strokeWidth:0}} />
                                </LineChart>
                              ) : (
                                <BarChart data={msg.chart.data.map(d=>({label:d.label,Valor:d.value}))} margin={{top:4,right:8,left:0,bottom:0}}>
                                  <CartesianGrid stroke={gridColor} vertical={false} />
                                  <XAxis dataKey="label" tick={{fontSize:11,fill:tickColor}} tickLine={false} axisLine={false} />
                                  <YAxis tickFormatter={fmtK} tick={{fontSize:11,fill:tickColor}} tickLine={false} axisLine={false} width={48} />
                                  <ReTooltip content={<ChartTooltip dark={isDark} />} />
                                  <Bar dataKey="Valor" radius={[4,4,0,0]}>
                                    {msg.chart.data.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]} />)}
                                  </Bar>
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* ── Acciones inline ── */}
                        {msg.actions && msg.actions.length > 0 && actionDone !== msg.id && (
                          <div className="space-y-2">
                            {msg.actions.map((action, idx) => {
                              const isOpen = actionForm?.msgId === msg.id && actionForm?.idx === idx;
                              return (
                                <div key={idx} className="bg-white dark:bg-[#1e2433] border border-[#165BC5]/30 rounded-2xl overflow-hidden shadow-sm">
                                  {!isOpen ? (
                                    <button onClick={() => openActionForm(msg.id, idx, action)}
                                      className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 transition">
                                      <span className="text-sm">{action.type === "budget" ? "📊" : "🎯"}</span>
                                      <span className="text-sm font-medium text-[#165BC5]">{action.label}</span>
                                      <ChevronRight className="w-4 h-4 text-[#165BC5] ml-auto shrink-0" />
                                    </button>
                                  ) : (
                                    <div className="p-4 space-y-3">
                                      <p className="text-xs font-bold text-[#165BC5] uppercase tracking-wide">
                                        {action.type === "budget" ? "Crear presupuesto" : "Crear meta"}
                                      </p>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-xs text-gray-500 dark:text-gray-400">Nombre</label>
                                          <input value={actionForm.values.name}
                                            onChange={e => setActionForm(f => f ? {...f, values: {...f.values, name: e.target.value}} : f)}
                                            className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                                        </div>
                                        {action.type === "budget" ? (
                                          <>
                                            <div>
                                              <label className="text-xs text-gray-500 dark:text-gray-400">Límite ($)</label>
                                              <input type="number" value={actionForm.values.amount ?? ""}
                                                onChange={e => setActionForm(f => f ? {...f, values: {...f.values, amount: Number(e.target.value)}} : f)}
                                                className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-500 dark:text-gray-400">Categoría</label>
                                              <select value={actionForm.values.category_id ?? ""}
                                                onChange={e => setActionForm(f => f ? {...f, values: {...f.values, category_id: e.target.value || null}} : f)}
                                                className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30">
                                                <option value="">Sin categoría</option>
                                                {labCats.filter(c => c.type === "expense").map(c => (
                                                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                                                ))}
                                              </select>
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-500 dark:text-gray-400">Frecuencia</label>
                                              <select value={actionForm.values.frequency ?? "monthly"}
                                                onChange={e => setActionForm(f => f ? {...f, values: {...f.values, frequency: e.target.value}} : f)}
                                                className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30">
                                                <option value="monthly">Mensual</option>
                                                <option value="biweekly">Quincenal</option>
                                                <option value="weekly">Semanal</option>
                                              </select>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div>
                                              <label className="text-xs text-gray-500 dark:text-gray-400">Meta ($)</label>
                                              <input type="number" value={actionForm.values.target_amount ?? ""}
                                                onChange={e => setActionForm(f => f ? {...f, values: {...f.values, target_amount: Number(e.target.value)}} : f)}
                                                className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                                            </div>
                                            <div>
                                              <label className="text-xs text-gray-500 dark:text-gray-400">Emoji</label>
                                              <input value={actionForm.values.emoji ?? "🎯"}
                                                onChange={e => setActionForm(f => f ? {...f, values: {...f.values, emoji: e.target.value}} : f)}
                                                className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                                            </div>
                                            <div className="col-span-2">
                                              <label className="text-xs text-gray-500 dark:text-gray-400">Fecha límite (opcional)</label>
                                              <input type="date" value={actionForm.values.deadline ?? ""}
                                                onChange={e => setActionForm(f => f ? {...f, values: {...f.values, deadline: e.target.value || undefined}} : f)}
                                                className="w-full mt-0.5 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-[#252d3d] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex gap-2 pt-1">
                                        <button onClick={() => setActionForm(null)}
                                          className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                          Cancelar
                                        </button>
                                        <button onClick={confirmAction} disabled={actionSaving}
                                          className="flex-1 py-2 bg-[#165BC5] hover:bg-[#0B3EA1] text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                                          {actionSaving ? "Creando..." : `Crear ${action.type === "budget" ? "presupuesto" : "meta"}`}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {actionDone === msg.id && (
                          <p className="text-xs text-emerald-500 font-medium px-1">✓ Creado exitosamente</p>
                        )}
                      </div>
                    </div>
                  )
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1e2433] px-4 py-3 shrink-0">
                {chatMsgs.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
                    <button onClick={loadRecommendations} disabled={aiLoading}
                      className="px-3 py-1 bg-gradient-to-r from-[#165BC5] to-[#0B3EA1] text-white rounded-full text-xs font-medium whitespace-nowrap hover:opacity-90 transition shrink-0 disabled:opacity-50">
                      ✨ Recomendaciones
                    </button>
                    {LAB_PILLS.map(pill => (
                      <button key={pill} onClick={() => sendMessage(pill)} disabled={aiLoading}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 rounded-full text-xs whitespace-nowrap hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-[#165BC5] transition shrink-0 disabled:opacity-50">
                        {pill}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  <textarea ref={labInputRef} value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                    placeholder="Escribe tu pregunta..."
                    rows={1}
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 resize-none max-h-32 leading-relaxed" />
                  <button onClick={() => sendMessage(chatInput)} disabled={!chatInput.trim() || aiLoading}
                    className="w-10 h-10 bg-[#165BC5] hover:bg-[#0B3EA1] disabled:opacity-40 rounded-xl flex items-center justify-center transition shrink-0">
                    {aiLoading
                      ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Enter para enviar · Shift+Enter para nueva línea</p>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

    </div>
  );
}
