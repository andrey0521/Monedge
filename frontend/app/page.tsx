import Link from "next/link";
import {
  Sparkles, TrendingUp, Target, BarChart3, ArrowRight,
  Wallet, PieChart, BellRing, Shield, Zap, CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#0d1117]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-xl flex items-center justify-center shadow-lg shadow-[#165BC5]/30">
              <span className="text-base leading-none">💎</span>
            </div>
            <span className="text-base font-bold tracking-tight">Monedge</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#caracteristicas" className="text-sm text-gray-400 hover:text-white transition">Características</a>
            <a href="#como-funciona"   className="text-sm text-gray-400 hover:text-white transition">Cómo funciona</a>
            <a href="#ia"              className="text-sm text-gray-400 hover:text-white transition">IA incluida</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-sm text-gray-400 hover:text-white transition px-4 py-2 hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/register"
              className="text-sm bg-[#165BC5] hover:bg-[#0B3EA1] text-white px-4 py-2 rounded-lg transition font-medium flex items-center gap-1.5">
              Comenzar gratis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-[#165BC5]/10 rounded-full blur-3xl" />
        </div>
        {/* Grid lines decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#165BC5]/10 border border-[#165BC5]/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#165BC5]" />
            <span className="text-xs text-[#165BC5] font-medium">Impulsado por Gemini 2.5 Flash</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Tu dinero,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#165BC5] to-[#4d8ef0]">
              inteligente
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Registra ingresos y gastos, gestiona presupuestos y metas de ahorro,
            y recibe análisis personalizados con inteligencia artificial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register"
              className="flex items-center gap-2 bg-[#165BC5] hover:bg-[#0B3EA1] text-white px-7 py-3.5 rounded-xl font-semibold transition shadow-lg shadow-[#165BC5]/30">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="px-7 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition text-sm font-medium">
              Ya tengo cuenta
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-xs text-gray-500">
            {["100% gratuito", "Sin tarjeta de crédito", "Datos encriptados", "Cancela cuando quieras"].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CARACTERÍSTICAS ─── */}
      <section id="caracteristicas" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-[#165BC5] uppercase tracking-widest">Características</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Todo lo que necesitas</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Una plataforma completa para tomar el control de tus finanzas personales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Sparkles,
              title: "IA Auto-categoriza",
              desc: "Describe un gasto en lenguaje natural y Gemini lo categoriza al instante, sin configuración manual.",
              accent: "#165BC5",
            },
            {
              icon: Target,
              title: "Presupuestos y Metas",
              desc: "Define límites de gasto por categoría y establece metas de ahorro con seguimiento visual.",
              accent: "#165BC5",
            },
            {
              icon: BarChart3,
              title: "Análisis Visual",
              desc: "Gráficas de flujo mensual, distribución por categoría y comparativos de períodos.",
              accent: "#165BC5",
            },
            {
              icon: TrendingUp,
              title: "Recomendaciones",
              desc: "La IA analiza tus patrones de gasto y te sugiere acciones concretas para mejorar.",
              accent: "#165BC5",
            },
            {
              icon: Wallet,
              title: "Multi-cuenta",
              desc: "Gestiona cuentas de débito, ahorros, efectivo y tarjetas de crédito en un solo lugar.",
              accent: "#165BC5",
            },
            {
              icon: BellRing,
              title: "Recurrentes",
              desc: "Programa pagos recurrentes (semanal, quincenal, mensual) con alerta de cuotas próximas.",
              accent: "#165BC5",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition-all group">
              <div className="w-11 h-11 bg-[#165BC5]/15 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#165BC5]/25 transition">
                <Icon className="w-5 h-5 text-[#165BC5]" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section id="como-funciona" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-[#165BC5] uppercase tracking-widest">Proceso</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">Listo en minutos</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Sin configuraciones complicadas. Empiezas a usar Monedge de inmediato.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Crea tu cuenta",
                desc: "Regístrate gratis con tu correo. Elige si quieres categorías predefinidas o empezar en blanco.",
              },
              {
                step: "02",
                title: "Registra movimientos",
                desc: "Agrega ingresos y gastos. La IA los categoriza por ti o usa el botón ✨ para auto-categorizar.",
              },
              {
                step: "03",
                title: "Analiza y mejora",
                desc: "Consulta tus gráficas, revisa presupuestos y pregúntale a la IA cómo optimizar tus finanzas.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl border border-[#165BC5]/40 bg-[#165BC5]/10 flex items-center justify-center mb-5">
                  <span className="text-xl font-bold text-[#165BC5]">{step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── IA INCLUIDA ─── */}
      <section id="ia" className="max-w-5xl mx-auto px-6 py-24">
        <div className="rounded-3xl bg-gradient-to-br from-[#165BC5]/20 to-[#0B3EA1]/10 border border-[#165BC5]/20 p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-[#165BC5]/20 border border-[#165BC5]/30 rounded-full px-3 py-1 mb-5">
              <Zap className="w-3.5 h-3.5 text-[#4d8ef0]" />
              <span className="text-xs text-[#4d8ef0] font-medium">Gemini 2.5 Flash</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-snug">
              Pregúntale a tu<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#165BC5] to-[#4d8ef0]">
                asistente financiero
              </span>
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Escribe en lenguaje natural: <em>"¿En qué gasté más este mes?"</em> o
              <em>"¿Cuánto puedo ahorrar si reduzco restaurantes?"</em> y recibe
              respuestas contextuales con números reales de tu cuenta.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-[#165BC5] hover:bg-[#0B3EA1] text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg shadow-[#165BC5]/30 text-sm">
              Probarlo gratis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-shrink-0 w-full md:w-64 space-y-3">
            {[
              "¿Cuánto gasté en transporte este mes?",
              "Analiza mis patrones de ahorro",
              "¿En qué categoría gasto más?",
            ].map((q) => (
              <div key={q} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#165BC5] flex-shrink-0" />
                {q}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-5">
            Toma el control de tu dinero hoy
          </h2>
          <p className="text-gray-400 mb-8">
            Únete gratis, sin tarjeta de crédito. Empieza a entender tus finanzas en minutos.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-[#165BC5] hover:bg-[#0B3EA1] text-white px-8 py-4 rounded-xl font-semibold transition shadow-lg shadow-[#165BC5]/30">
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 bg-[#080c12]">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-xl flex items-center justify-center">
                  <span className="text-base leading-none">💎</span>
                </div>
                <span className="font-bold text-base">Monedge</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Gestor de finanzas personales con inteligencia artificial. Toma mejores decisiones con tus datos.
              </p>
            </div>

            {/* Producto */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Producto</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Características", href: "#caracteristicas" },
                  { label: "Cómo funciona", href: "#como-funciona" },
                  { label: "IA incluida", href: "#ia" },
                  { label: "Iniciar sesión", href: "/login" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-gray-500 hover:text-white transition">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Empresa</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Acerca de", href: "#" },
                  { label: "Privacidad", href: "#" },
                  { label: "Términos de uso", href: "#" },
                  { label: "Contacto", href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-gray-500 hover:text-white transition">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Monedge. Proyecto ATE2 — UABC. Todos los derechos reservados.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {[
                { label: "GitHub",    href: "#", svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg> },
                { label: "Twitter",   href: "#", svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { label: "Instagram", href: "#", svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                { label: "LinkedIn",  href: "#", svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
              ].map(({ label, href, svg }) => (
                <a key={label} href={href} aria-label={label}
                  className="text-gray-600 hover:text-white transition">
                  {svg}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
