"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30 focus:border-[#165BC5] bg-white";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/panel");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  }

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
      <div className="flex-1 flex items-center justify-center p-8 pt-20 bg-[#f5f7fa]">
        <div className="w-full max-w-md">

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Accede a tu cuenta</h1>
          <p className="text-gray-500 mb-8">Introduce tus datos para continuar</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg mb-5 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com" className={INPUT} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••" className={INPUT} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#165BC5] hover:bg-[#0B3EA1] text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 mt-2">
                {loading ? "Entrando..." : "Iniciar sesión"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-[#165BC5] hover:underline font-medium">Regístrate gratis</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — imagen ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#0c1e45]">
        {/* Imagen centrada con contain */}
        <div className="flex-1 flex items-center justify-center px-10 pt-16 pb-4">
          <img src="/auth-hero.png" alt="Finanzas personales"
            className="w-full max-h-[65vh] object-contain" />
        </div>
        {/* Texto al fondo */}
        <div className="px-12 pb-12 text-white">
          <h2 className="text-2xl font-bold leading-tight mb-2">
            Toma el control<br />de tus finanzas
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Registra gastos, planifica presupuestos y alcanza tus metas de ahorro.
          </p>
        </div>
      </div>
    </div>
  );
}
