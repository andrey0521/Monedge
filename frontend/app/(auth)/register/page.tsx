"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, login, createAccount } from "@/lib/api";

const DEFAULT_CATS = [
  "🍽️ Alimentación", "🚗 Transporte", "🏠 Vivienda", "🏥 Salud",
  "🎬 Entretenimiento", "📚 Educación", "💡 Servicios", "☕ Cafetería",
  "🛒 Supermercado", "💼 Salario", "💻 Freelance", "📈 Inversiones",
];

const ACCOUNT_TYPES = [
  { value: "checking", label: "Débito / Corriente", emoji: "🏦" },
  { value: "savings",  label: "Ahorro",             emoji: "💰" },
  { value: "cash",     label: "Efectivo",            emoji: "💵" },
  { value: "credit",   label: "Crédito / Tarjeta",  emoji: "💳" },
];

const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 focus:border-[#165BC5] bg-white";

function getStrength(p: string): number {
  if (p.length < 1) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s; // 0–4
}
const STRENGTH_LABEL = ["", "Muy débil", "Débil", "Media", "Fuerte"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1
  const [form, setForm]       = useState({ email: "", full_name: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);

  // Paso 2
  const [useDefault, setUseDefault] = useState<boolean | null>(null);

  // Paso 3
  const [accForm, setAccForm] = useState({
    name: "", bank: "", type: "checking", balance: "0", credit_limit: "",
  });

  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);
  const passwordsMatch = form.password === form.confirm && form.confirm !== "";

  // ── Paso 1 → 2 ─────────────────────────────────────────────────────────────
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setError("La contraseña debe tener mínimo 8 caracteres"); return; }
    if (!passwordsMatch)          { setError("Las contraseñas no coinciden"); return; }
    setError(""); setStep(2);
  }

  // ── Paso 2 → 3: solo avanza, sin llamadas API ──────────────────────────────
  function handleStep2() {
    if (useDefault === null) { setError("Elige una opción para continuar"); return; }
    setError(""); setStep(3);
  }

  // ── Paso 3 → /panel: aquí se hace TODO de una sola vez ─────────────────────
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!accForm.name.trim()) { setError("El nombre de la cuenta es requerido"); return; }
    setError(""); setLoading(true);
    try {
      await register(form.email, form.full_name, form.password, useDefault ?? true);
      await login(form.email, form.password);
      await createAccount({
        name:         accForm.name.trim(),
        bank:         accForm.bank.trim() || null,
        type:         accForm.type,
        balance:      parseFloat(accForm.balance) || 0,
        credit_limit: accForm.type === "credit" && accForm.credit_limit
                        ? parseFloat(accForm.credit_limit) : null,
      });
      router.push("/panel");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  }

  const stepLabels = ["Tus datos", "Categorías", "Primera cuenta"];

  return (
    <div className="min-h-screen flex relative">

      {/* Logo fijo arriba izquierda */}
      <div className="absolute top-6 left-8 z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-lg flex items-center justify-center shadow-md">
            <span className="text-base">💎</span>
          </div>
          <span className="text-base font-bold text-gray-900">Monedge</span>
        </Link>
      </div>

      {/* ── Panel izquierdo — formulario ── */}
      <div className="flex-1 flex items-center justify-center p-8 pt-20 bg-[#f5f7fa] overflow-y-auto">
        <div className="w-full max-w-md py-6">

          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
            {step === 1 ? "Crea tu cuenta" : step === 2 ? "Configura tus categorías" : "Agrega tu primera cuenta"}
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            Paso {step} de 3 — {stepLabels[step - 1]}
          </p>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-[#165BC5]" : s < step ? "w-8 bg-[#165BC5]/50" : "w-4 bg-gray-200"
              }`} />
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-7">
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg mb-5 text-sm">{error}</div>
            )}

            {/* ── Paso 1: datos + contraseña ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                  <input type="text" required value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Tu nombre" className={INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="tu@email.com" className={INPUT} />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className={INPUT + " pr-12"} />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium px-1 py-0.5">
                      {showPass ? "Ocultar" : "Ver"}
                    </button>
                  </div>

                  {/* Barra de fuerza */}
                  {form.password.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex gap-1 mb-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{ backgroundColor: strength >= i ? STRENGTH_COLOR[strength] : "#e5e7eb" }} />
                        ))}
                      </div>
                      <p className="text-xs font-medium transition-colors" style={{ color: STRENGTH_COLOR[strength] }}>
                        {STRENGTH_LABEL[strength]}
                        {form.password.length < 8 && <span className="text-gray-400 font-normal"> — mínimo 8 caracteres</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
                  <input
                    type={showPass ? "text" : "password"}
                    required value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="••••••••"
                    className={INPUT + (form.confirm && !passwordsMatch ? " border-red-400 focus:border-red-400 focus:ring-red-400/30" : "")} />
                  {form.confirm && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                  {form.confirm && passwordsMatch && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Las contraseñas coinciden</p>
                  )}
                </div>

                <button type="submit"
                  disabled={form.password.length < 8 || !passwordsMatch}
                  className="w-full bg-[#165BC5] hover:bg-[#0B3EA1] text-white py-3 rounded-xl text-sm font-semibold transition mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  Continuar →
                </button>
              </form>
            )}

            {/* ── Paso 2: categorías ── */}
            {step === 2 && (
              <div className="space-y-4">
                <button type="button" onClick={() => setUseDefault(true)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    useDefault === true ? "border-[#165BC5] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${useDefault === true ? "border-[#165BC5] bg-[#165BC5]" : "border-gray-300"}`}>
                      {useDefault === true && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">Categorías predeterminadas</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#165BC5] text-white rounded-full">Recomendado</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">18 categorías listas para usar. Puedes cambiarlas después.</p>
                      <div className="flex flex-wrap gap-1">
                        {DEFAULT_CATS.map(c => (
                          <span key={c} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                        <span className="text-[10px] text-gray-400 px-1 py-0.5">+6 más...</span>
                      </div>
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => setUseDefault(false)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    useDefault === false ? "border-[#165BC5] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${useDefault === false ? "border-[#165BC5] bg-[#165BC5]" : "border-gray-300"}`}>
                      {useDefault === false && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Empezar en blanco</p>
                      <p className="text-xs text-gray-500">Sin categorías. Las configuras tú desde Categorías.</p>
                    </div>
                  </div>
                </button>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep(1); setError(""); }}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                    ← Volver
                  </button>
                  <button type="button" onClick={handleStep2} disabled={useDefault === null}
                    className="flex-1 py-2.5 bg-[#165BC5] hover:bg-[#0B3EA1] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    Continuar →
                  </button>
                </div>
              </div>
            )}

            {/* ── Paso 3: primera cuenta ── */}
            {step === 3 && (
              <form onSubmit={handleStep3} className="space-y-3">

                {/* Tipo — 4 pills en fila */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ACCOUNT_TYPES.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setAccForm(f => ({ ...f, type: t.value }))}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-medium transition ${
                          accForm.type === t.value
                            ? "border-[#165BC5] bg-blue-50 text-[#165BC5]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}>
                        <span className="text-lg">{t.emoji}</span>
                        <span className="leading-tight text-center px-0.5" style={{fontSize:"10px"}}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre + Banco en grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                    <input required value={accForm.name}
                      onChange={e => setAccForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={
                        accForm.type === "checking" ? "BBVA Débito" :
                        accForm.type === "savings"  ? "Nu Ahorro"   :
                        accForm.type === "cash"     ? "Efectivo"    : "Amex Oro"
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 focus:border-[#165BC5] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Banco <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input value={accForm.bank}
                      onChange={e => setAccForm(f => ({ ...f, bank: e.target.value }))}
                      placeholder="BBVA, Nu..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 focus:border-[#165BC5] bg-white" />
                  </div>
                </div>

                {/* Balance + límite crédito */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {accForm.type === "credit" ? "Saldo disponible" : "Saldo inicial"}
                    </label>
                    <input type="number" min="0" step="0.01" value={accForm.balance}
                      onChange={e => setAccForm(f => ({ ...f, balance: e.target.value }))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 focus:border-[#165BC5] bg-white" />
                  </div>
                  {accForm.type === "credit" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Límite de crédito</label>
                      <input type="number" min="0" step="0.01" value={accForm.credit_limit}
                        onChange={e => setAccForm(f => ({ ...f, credit_limit: e.target.value }))}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 focus:border-[#165BC5] bg-white" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep(2); setError(""); }}
                    className="py-2.5 px-4 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                    ← Volver
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-2.5 bg-[#165BC5] hover:bg-[#0B3EA1] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {loading ? "Creando cuenta..." : "Entrar a Monedge →"}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#165BC5] hover:underline font-medium">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — imagen ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#0c1e45]">
        <div className="flex-1 flex items-center justify-center px-10 pt-16 pb-4">
          <img src="/auth-hero.png" alt="Finanzas personales"
            className="w-full max-h-[65vh] object-contain" />
        </div>
        <div className="px-12 pb-12 text-white">
          <h2 className="text-2xl font-bold leading-tight mb-2">
            Empieza a construir<br />tu libertad financiera
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Registra gastos, crea presupuestos y alcanza tus metas. Todo en un solo lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
