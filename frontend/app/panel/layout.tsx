"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  BarChart3,
  Settings,
  Menu,
  X,
  Moon,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Tag,
} from "lucide-react";
import { getMe, logout } from "@/lib/api";
import type { User as UserType } from "@/lib/types";

const menuItems = [
  { path: "/panel", label: "Inicio", icon: LayoutDashboard },
  { path: "/panel/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { path: "/panel/billetera", label: "Billetera", icon: Wallet },
  { path: "/panel/planificacion", label: "Planificación", icon: Target },
  { path: "/panel/analisis", label: "Análisis", icon: BarChart3 },
];

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full relative transition-colors ${value ? "bg-[#165BC5]" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? "left-[18px]" : "left-0.5"}`}
      />
    </button>
  );
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    const d = new Date();
    setDateLabel(`${d.getDate()} de ${MONTHS[d.getMonth()]} del ${d.getFullYear()}`);
    getMe()
      .then(setUser)
      .catch(() => router.push("/login"));
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    if (saved) document.documentElement.classList.add("dark");
    const savedCollapse = localStorage.getItem("sidebarCollapsed") === "true";
    setCollapsed(savedCollapse);
    const isDesktop = window.innerWidth >= 1024;
    document.documentElement.style.setProperty(
      "--sb-w",
      isDesktop ? (savedCollapse ? "4.5rem" : "11rem") : "0px",
    );
    const savedContrast = localStorage.getItem("highContrast") === "true";
    setHighContrast(savedContrast);
    if (savedContrast) document.documentElement.classList.add("contrast");
  }, [router]);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebarCollapsed", String(next));
    document.documentElement.style.setProperty("--sb-w", next ? "4.5rem" : "11rem");
  }

  function handleDarkMode(v: boolean) {
    setDarkMode(v);
    localStorage.setItem("darkMode", String(v));
    if (v) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  function handleHighContrast(v: boolean) {
    setHighContrast(v);
    localStorage.setItem("highContrast", String(v));
    if (v) document.documentElement.classList.add("contrast");
    else document.documentElement.classList.remove("contrast");
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const currentLabel =
    menuItems.find((m) =>
      m.path === "/panel" ? pathname === "/panel" : pathname.startsWith(m.path),
    )?.label ?? "Monedge";

  const sidebarW = collapsed ? "w-[4.5rem]" : "w-44";
  const contentML = collapsed ? "lg:ml-[4.5rem]" : "lg:ml-44";

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-[#111827] flex">
      {/* ─── Sidebar ─── */}
      <aside
        className={`
        ${sidebarW} bg-[#f0f4f8] dark:bg-[#0d1117]
        fixed left-0 top-0 h-full flex flex-col z-30
        transition-all duration-100
        lg:translate-x-0
        border-r border-gray-200 dark:border-white/5
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Logo */}
        <div
          className={`border-b border-gray-200 dark:border-white/10 flex items-center ${collapsed ? "justify-center py-5 px-3" : "px-5 py-5 justify-between"}`}
        >
          <Link href="/panel" className="flex items-center gap-3">
            <div className="logo-pulse w-9 h-9 bg-gradient-to-br from-[#165BC5] to-[#0B3EA1] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-lg">💎</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-gray-900 dark:text-white">Monedge</span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-white" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col">
          <ul className="space-y-1 flex-1">
            {menuItems.map(({ path, label, icon: Icon }) => {
              const isActive =
                path === "/panel"
                  ? pathname === "/panel"
                  : pathname.startsWith(path);
              return (
                <li key={path}>
                  <Link
                    href={path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                      ${collapsed ? "justify-center" : ""}
                      ${isActive
                        ? "bg-[#165BC5] text-white shadow-md shadow-[#165BC5]/30"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:translate-x-0.5"
                      }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Botón colapsar — fuera del sidebar, borde derecho centrado */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
            w-6 h-6 items-center justify-center rounded-full
            bg-[#f0f4f8] dark:bg-[#0d1117]
            border border-gray-200 dark:border-white/10
            text-gray-400 dark:text-gray-400
            hover:text-white hover:bg-[#165BC5] hover:border-[#165BC5]
            transition-colors duration-100 z-40 shadow-md"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Contenido ─── */}
      <div
        className={`${contentML} flex-1 flex flex-col w-full min-w-0 transition-all duration-100`}
      >
        {/* Header */}
        <header className="bg-white dark:bg-[#0d1117] border-b border-gray-300 dark:border-gray-800 px-4 md:px-6 h-[4.75rem] flex items-center sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {pathname === "/panel"
                    ? `Bienvenido, ${user?.full_name.split(" ")[0] ?? ""}`
                    : currentLabel}
                </h2>
                <p className="text-sm text-gray-400">{dateLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
            >
              <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </header>

        {/* Settings panel */}
        {showSettings && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setShowSettings(false)}
            />
            <div className="animate-slide-down absolute right-4 md:right-6 top-[56px] w-[300px] bg-white dark:bg-[#1e2433] rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-2xl z-40">
              <div className="p-3.5 border-b border-gray-100 dark:border-gray-700/40 flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  Configuración
                </span>
                <button onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="p-3.5 border-b border-gray-100 dark:border-gray-700/40">
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-[#252d3d] rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#165BC5] to-[#06308E] rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user?.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3.5 border-b border-gray-100 dark:border-gray-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Modo oscuro
                    </span>
                  </div>
                  <ToggleSwitch value={darkMode} onChange={handleDarkMode} />
                </div>
              </div>
              <div className="p-3.5 border-b border-gray-100 dark:border-gray-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Contrast className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Alto contraste
                    </span>
                  </div>
                  <ToggleSwitch value={highContrast} onChange={handleHighContrast} />
                </div>
              </div>
              <div className="p-3.5 border-b border-gray-100 dark:border-gray-700/40">
                <Link href="/panel/categorias" onClick={() => setShowSettings(false)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm text-gray-700 dark:text-gray-300">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Gestionar categorías
                </Link>
              </div>
              <div className="p-3.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-sm text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </>
        )}

        <main key={pathname} className="animate-fade-in-up flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
