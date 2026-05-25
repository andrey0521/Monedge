"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Wallet, CreditCard, PiggyBank, Banknote, ArrowDownCircle } from "lucide-react";
import { getAccounts, createAccount, updateAccount, deleteAccount, payCredit } from "@/lib/api";
import type { Account } from "@/lib/types";
import { useToast, Toasts } from "@/lib/toast";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Cuenta Corriente", icon: CreditCard },
  { value: "savings", label: "Cuenta Ahorros", icon: PiggyBank },
  { value: "cash", label: "Efectivo", icon: Banknote },
  { value: "credit", label: "Cuenta de Crédito", icon: Wallet },
];

function fmt(n: number) {
  return "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmtSigned(n: number) {
  return (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const EMPTY_FORM = { name: "", bank: "", balance: "", type: "checking", credit_limit: "" };

const INPUT_CLS = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30";

export default function BilleteraPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [payTarget, setPayTarget] = useState<Account | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payFromId, setPayFromId] = useState("");
  const [paying, setPaying] = useState(false);
  const { toast, toasts } = useToast();

  useEffect(() => {
    getAccounts().then(setAccounts).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(acc: Account) {
    setEditing(acc);
    setForm({ name: acc.name, bank: acc.bank ?? "", balance: String(acc.balance), type: acc.type, credit_limit: String(acc.credit_limit ?? "") });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name, bank: form.bank || null,
        balance: parseFloat(form.balance) || 0,
        type: form.type,
        credit_limit: form.type === "credit" && form.credit_limit ? parseFloat(form.credit_limit) : null,
      };
      if (editing) {
        const updated = await updateAccount(editing.id, payload);
        setAccounts(prev => prev.map(a => a.id === editing.id ? updated : a));
        toast("Cuenta actualizada");
      } else {
        const created = await createAccount(payload);
        setAccounts(prev => [...prev, created]);
        toast("Cuenta creada");
      }
      setShowForm(false);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    try {
      await deleteAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast("Cuenta eliminada");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  const liquidBalance = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + parseFloat(String(a.balance)), 0);
  const totalCreditDebt = accounts.filter(a => a.type === "credit").reduce((s, a) => s + Math.max(0, Number(a.credit_limit ?? 0) - Number(a.balance)), 0);
  const liquidAccounts = accounts.filter(a => a.type !== "credit");

  function openPay(acc: Account) {
    setPayTarget(acc);
    setPayAmount("");
    setPayFromId(liquidAccounts[0]?.id ?? "");
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payTarget || !payFromId || !payAmount) return;
    setPaying(true);
    try {
      const updated = await payCredit(payTarget.id, payFromId, parseFloat(payAmount));
      setAccounts(prev => prev.map(a => {
        const u = updated.find(u => u.id === a.id);
        return u ?? a;
      }));
      setPayTarget(null);
      toast("Abono registrado");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-2xl p-6 text-white">
          <div className="text-sm opacity-75 mb-1">Balance líquido</div>
          <div className={`text-4xl font-bold ${liquidBalance < 0 ? "text-red-300" : ""}`}>{fmtSigned(liquidBalance)}</div>
          <div className="text-sm opacity-75 mt-1">
            {accounts.filter(a => a.type !== "credit").length} cuenta{accounts.filter(a => a.type !== "credit").length !== 1 ? "s" : ""} líquida{accounts.filter(a => a.type !== "credit").length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className={`rounded-2xl p-6 border-2 ${totalCreditDebt > 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50" : "bg-gray-50 dark:bg-[#1e2433] border-gray-200 dark:border-gray-700/60"}`}>
          <div className={`text-sm font-medium mb-1 ${totalCreditDebt > 0 ? "text-red-500" : "text-gray-400"}`}>Deuda pendiente en crédito</div>
          <div className={`text-4xl font-bold ${totalCreditDebt > 0 ? "text-red-500" : "text-gray-400"}`}>{fmt(totalCreditDebt)}</div>
          <div className="text-sm text-gray-400 mt-1">
            {accounts.filter(a => a.type === "credit").length} cuenta{accounts.filter(a => a.type === "credit").length !== 1 ? "s" : ""} de crédito
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mis cuentas</h3>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#165BC5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B3EA1] transition">
          <Plus className="w-4 h-4" /> Nueva cuenta
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1e2433] rounded-xl h-36 border border-gray-200 dark:border-gray-700/60 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 p-12 text-center">
          <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Sin cuentas registradas</p>
          <button onClick={openCreate} className="mt-3 text-sm text-[#165BC5] hover:underline">Agregar primera cuenta</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const typeInfo = ACCOUNT_TYPES.find(t => t.value === acc.type) ?? ACCOUNT_TYPES[0];
            const Icon = typeInfo.icon;
            return (
              <div key={acc.id} className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${
                acc.type === "credit"
                  ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700/40"
                  : "bg-white dark:bg-[#1e2433] border-gray-200 dark:border-gray-700/60"
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${acc.type === "credit" ? "bg-red-100 dark:bg-red-900/30" : "bg-[#165BC5]/10"}`}>
                    <Icon className={`w-5 h-5 ${acc.type === "credit" ? "text-red-500" : "text-[#165BC5]"}`} />
                  </div>
                  <div className="flex gap-1">
                    {acc.type === "credit" && liquidAccounts.length > 0 && (
                      <button onClick={() => openPay(acc)} title="Abonar" className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-gray-400 hover:text-green-600">
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => openEdit(acc)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{acc.name}</div>
                <div className="text-xs text-gray-400 mb-3">{acc.bank ?? typeInfo.label}</div>
                {acc.type === "credit" && acc.credit_limit ? (() => {
                  const debt = acc.credit_limit - acc.balance;
                  const usePct = Math.min(100, (debt / acc.credit_limit) * 100);
                  return (
                    <>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fmt(acc.balance)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">disponible de {fmt(acc.credit_limit)}</div>
                      <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${usePct}%`, backgroundColor: usePct >= 80 ? "#ef4444" : usePct >= 50 ? "#f59e0b" : "#165BC5" }} />
                      </div>
                      <div className="text-xs mt-1 text-red-500 font-medium">{fmt(debt)} en deuda ({usePct.toFixed(0)}%)</div>
                    </>
                  );
                })() : (
                  <div className={`text-2xl font-bold ${Number(acc.balance) < 0 ? "text-red-500" : "text-gray-900 dark:text-gray-100"}`}>
                    {fmtSigned(Number(acc.balance))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{editing ? "Editar cuenta" : "Nueva cuenta"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Cuenta Nómina" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco (opcional)</label>
                <input value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))}
                  placeholder="Ej: Bancolombia" className={INPUT_CLS} />
              </div>
              {form.type === "credit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Límite de crédito</label>
                  <input type="number" step="0.01" min="0" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))}
                    placeholder="Ej: 50000" className={INPUT_CLS} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.type === "credit" ? "Crédito disponible actual" : "Balance actual"}
                </label>
                <input type="number" step="0.01" min="0" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                  placeholder={form.type === "credit" ? "Igual al límite si no hay deuda" : "0"} className={INPUT_CLS} />
                {form.type === "credit" && (
                  <p className="text-xs text-gray-400 mt-1">Si tienes deuda, ingresa el crédito que aún tienes disponible</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={INPUT_CLS}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Abonar a {payTarget.name}</h3>
              <button onClick={() => setPayTarget(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handlePay} className="p-5 space-y-4">
              {payTarget.credit_limit && (() => {
                const debt = Number(payTarget.credit_limit) - Number(payTarget.balance);
                const afterPay = Math.max(0, debt - (parseFloat(payAmount) || 0));
                const pct = Math.min(100, (afterPay / Number(payTarget.credit_limit)) * 100);
                return (
                  <div className="bg-gray-50 dark:bg-[#252d3d] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Deuda actual</span>
                      <span className="font-semibold text-red-500">{fmt(debt)}</span>
                    </div>
                    {parseFloat(payAmount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Después del abono</span>
                        <span className="font-semibold text-green-600">{fmt(afterPay)}</span>
                      </div>
                    )}
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#165BC5" }} />
                    </div>
                    <div className="text-xs text-gray-400">{fmt(Number(payTarget.balance))} disponible de {fmt(Number(payTarget.credit_limit))}</div>
                  </div>
                );
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto a abonar</label>
                <input required type="number" step="0.01" min="0.01" value={payAmount}
                  onChange={e => setPayAmount(e.target.value)} placeholder="0" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿De qué cuenta sale?</label>
                <select required value={payFromId} onChange={e => setPayFromId(e.target.value)} className={INPUT_CLS}>
                  {liquidAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} · {fmtSigned(Number(a.balance))}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setPayTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  Cancelar
                </button>
                <button type="submit" disabled={paying}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {paying ? "Procesando..." : "Registrar abono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toasts items={toasts} />
    </div>
  );
}
