"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Bienvenido a Monedge 👋
      </h1>
      <p className="text-gray-500 mb-8">Estás autenticado correctamente.</p>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
