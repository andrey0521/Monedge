"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory, seedCategories, aiSuggestCategoryDescription } from "@/lib/api";
import type { Category } from "@/lib/types";
import { useToast, Toasts } from "@/lib/toast";

const INPUT = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30";

const EMOJI_SUGGESTIONS = ["🍽️","🚗","🏠","🏥","🎬","📚","👗","💡","☕","🛒","📱","📦","💼","💻","📈","🏪","🎁","💰","🎮","✈️","🏋️","💊","🔧","📝","🎵","🐾","🌿","🍺"];

export default function CategoriasPage() {
  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [saving, setSaving]             = useState(false);
  const [form, setForm]                 = useState({ name: "", emoji: "📦", type: "expense" as "expense" | "income", description: "" });
  const [editForm, setEditForm]         = useState({ name: "", emoji: "", description: "" });
  const [suggestingDesc, setSuggestingDesc] = useState(false);
  const { toast, toasts }               = useToast();

  useEffect(() => {
    getCategories().then(setCategories).finally(() => setLoading(false));
  }, []);

  const expenses = categories.filter(c => c.type === "expense");
  const incomes  = categories.filter(c => c.type === "income");

  function openCreate(type: "expense" | "income") {
    setForm({ name: "", emoji: type === "expense" ? "📦" : "💰", type, description: "" });
    setShowForm(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setEditForm({ name: c.name, emoji: c.emoji ?? "📦", description: c.description ?? "" });
  }

  async function handleSuggestDesc(target: "form" | "edit") {
    const name = target === "form" ? form.name : editForm.name;
    const emoji = target === "form" ? form.emoji : editForm.emoji;
    const type = target === "form" ? form.type : (categories.find(c => c.id === editingId)?.type ?? "expense");
    if (!name.trim()) return;
    setSuggestingDesc(true);
    try {
      const r = await aiSuggestCategoryDescription(name, emoji, type);
      if (target === "form") setForm(f => ({ ...f, description: r.description }));
      else setEditForm(f => ({ ...f, description: r.description }));
    } catch { /* silencioso */ }
    finally { setSuggestingDesc(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const cat = await createCategory({ name: form.name, emoji: form.emoji, color: null, type: form.type, description: form.description || null } as Parameters<typeof createCategory>[0]);
      setCategories(prev => [...prev, cat]);
      setForm({ name: "", emoji: "📦", type: form.type });
      setShowForm(false);
      toast("Categoría creada");
    } catch (err) { toast((err as Error).message, "error"); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateCategory(id, { name: editForm.name, emoji: editForm.emoji, description: editForm.description || undefined });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      setEditingId(null);
      toast("Categoría actualizada");
    } catch (err) { toast((err as Error).message, "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(cat: Category) {
    try {
      await deleteCategory(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setDeleteTarget(null);
      toast("Categoría eliminada");
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function handleSeed() {
    try {
      await seedCategories();
      const fresh = await getCategories();
      setCategories(fresh);
      toast("Categorías predeterminadas restauradas");
    } catch (err) { toast((err as Error).message, "error"); }
  }

  function renderList(items: Category[], emptyLabel: string) {
    return (
      <div className="bg-white dark:bg-[#1e2433] rounded-2xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">Sin categorías de {emptyLabel}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {items.map(cat => (
              <li key={cat.id} className="px-4 py-3">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))}
                        className="w-12 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-center text-lg bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Escape") setEditingId(null); }}
                        autoFocus className={INPUT + " flex-1"} />
                      <button onClick={() => handleUpdate(cat.id)} disabled={saving}
                        className="p-1.5 bg-[#165BC5] text-white rounded-lg hover:bg-[#0B3EA1] transition flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Descripción (opcional)"
                        className={INPUT + " flex-1 text-xs"} />
                      <button type="button" onClick={() => handleSuggestDesc("edit")} disabled={suggestingDesc || !editForm.name.trim()}
                        title="Sugerir con IA"
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-[#165BC5] hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 flex-shrink-0">
                        {suggestingDesc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="text-xl w-7 text-center flex-shrink-0 mt-0.5">{cat.emoji ?? "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</span>
                      {cat.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{cat.description}</p>
                      )}
                    </div>
                    {cat.is_default && (
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full flex-shrink-0">predeterminada</span>
                    )}
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(cat)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(cat)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (loading) return <div className="text-sm text-gray-400 text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Categorías</h2>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} categorías en total</p>
        </div>
        <button onClick={handleSeed} title="Restaurar predeterminadas"
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar predeterminadas
        </button>
      </div>

      {/* Dos columnas: Gastos | Ingresos */}
      <div className="grid grid-cols-2 gap-5">

        {/* Gastos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Gastos</h3>
              <p className="text-xs text-gray-400">{expenses.length} categorías</p>
            </div>
            <button onClick={() => openCreate("expense")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#165BC5] hover:bg-[#0B3EA1] text-white rounded-lg text-xs font-medium transition">
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          </div>
          {renderList(expenses, "gastos")}
        </div>

        {/* Ingresos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ingresos</h3>
              <p className="text-xs text-gray-400">{incomes.length} categorías</p>
            </div>
            <button onClick={() => openCreate("income")}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#165BC5] hover:bg-[#0B3EA1] text-white rounded-lg text-xs font-medium transition">
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
          </div>
          {renderList(incomes, "ingresos")}
        </div>

      </div>

      {/* Modal: nueva categoría */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/40">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Nueva categoría</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Tipo</label>
                <div className="flex gap-2">
                  {(["expense","income"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.type === t ? (t === "expense" ? "bg-red-500 text-white" : "bg-green-500 text-white") : "bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300"}`}>
                      {t === "expense" ? "Gasto" : "Ingreso"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Emoji</label>
                <div className="flex gap-2 mb-2">
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    className="w-14 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-center text-lg bg-white dark:bg-[#252d3d] focus:outline-none focus:ring-2 focus:ring-[#165BC5]/30" />
                  <div className="flex flex-wrap gap-1 flex-1">
                    {EMOJI_SUGGESTIONS.map(e => (
                      <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
                        className={`w-8 h-8 rounded-lg text-base hover:bg-gray-100 dark:hover:bg-gray-700/50 transition ${form.emoji === e ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Mandado, Gasolina..." className={INPUT} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                  <button type="button" onClick={() => handleSuggestDesc("form")}
                    disabled={suggestingDesc || !form.name.trim()}
                    className="flex items-center gap-1 text-xs text-[#165BC5] hover:text-[#0B3EA1] disabled:opacity-40 disabled:cursor-not-allowed">
                    {suggestingDesc
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
                      : <><Sparkles className="w-3 h-3" /> Sugerir con IA</>}
                  </button>
                </div>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ej: Compras de despensa y mercado..."
                  className={INPUT} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#165BC5] text-white rounded-lg text-sm font-medium hover:bg-[#0B3EA1] disabled:opacity-50">
                  {saving ? "..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: confirmar eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 overflow-y-auto flex items-start justify-center pr-4 pb-6"
          style={{ paddingLeft: "calc(var(--sb-w, 15rem) + 1rem)", paddingTop: "calc(4.75rem + 1.5rem)" }}>
          <div className="bg-white dark:bg-[#1e2433] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar categoría?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              <span className="font-medium text-gray-800 dark:text-gray-200">{deleteTarget.emoji} {deleteTarget.name}</span> se eliminará permanentemente. Las transacciones existentes no se ven afectadas.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toasts items={toasts} />
    </div>
  );
}
