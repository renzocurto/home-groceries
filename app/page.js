'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'general', label: 'General', emoji: '📦' },
  { value: 'verduras', label: 'Verduras', emoji: '🥦' },
  { value: 'frutas', label: 'Frutas', emoji: '🍎' },
  { value: 'lacteos', label: 'Lácteos', emoji: '🥛' },
  { value: 'carnes', label: 'Carnes', emoji: '🥩' },
  { value: 'limpieza', label: 'Limpieza', emoji: '🧹' },
  { value: 'higiene', label: 'Higiene', emoji: '🧴' },
  { value: 'panaderia', label: 'Panadería', emoji: '🍞' },
];

function getCategoryEmoji(cat) {
  return CATEGORIES.find((c) => c.value === cat)?.emoji || '📦';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBought, setShowBought] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/items');
    if (res.ok) {
      const data = await res.json();
      setItems(data);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      await fetchItems();
      setLoading(false);
    }
    init();
  }, [router, fetchItems]);

  async function handleAddItem(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [item, ...prev]);
      setForm({ name: '', quantity: '', category: 'general' });
      setShowForm(false);
    }
    setSubmitting(false);
  }

  async function toggleBought(item) {
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bought: !item.bought }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  async function deleteItem(id) {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-600 text-lg">Cargando...</div>
      </div>
    );
  }

  const pendingItems = items.filter((i) => !i.bought);
  const boughtItems = items.filter((i) => i.bought);

  const filteredPending = filter === 'all'
    ? pendingItems
    : pendingItems.filter((i) => i.category === filter);

  const pendingCategories = [...new Set(pendingItems.map((i) => i.category))];

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">La Lista</h1>
              <p className="text-xs text-gray-500">Hola, {user?.displayName}!</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-32">
        {/* Stats bar */}
        <div className="flex gap-3 py-4">
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{pendingItems.length}</p>
            <p className="text-xs text-gray-500">Para comprar</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{boughtItems.length}</p>
            <p className="text-xs text-gray-500">Comprados</p>
          </div>
        </div>

        {/* Category filter */}
        {pendingCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-amber-50'
              }`}
            >
              Todos
            </button>
            {pendingCategories.map((cat) => {
              const c = CATEGORIES.find((x) => x.value === cat);
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === cat ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-amber-50'
                  }`}
                >
                  {c?.emoji} {c?.label || cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Pending items */}
        {filteredPending.length === 0 && pendingItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-gray-600 font-medium">La lista está vacía</p>
            <p className="text-gray-400 text-sm mt-1">Agregá lo que falta con el botón +</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPending.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={() => toggleBought(item)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {/* Bought items toggle */}
        {boughtItems.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowBought(!showBought)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
            >
              <span className={`transition-transform ${showBought ? 'rotate-90' : ''}`}>▶</span>
              Comprados ({boughtItems.length})
            </button>
            {showBought && (
              <div className="space-y-2">
                {boughtItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => toggleBought(item)}
                    onDelete={() => deleteItem(item.id)}
                    dimmed
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add item modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Agregar ítem</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qué falta? *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Leche, Jabón, Tomates..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input
                    type="text"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="Ej: 2, 1kg, 500ml"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl py-3 font-semibold transition-colors"
                >
                  {submitting ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg text-2xl font-bold flex items-center justify-center transition-colors z-10 active:scale-95"
      >
        +
      </button>
    </div>
  );
}

function ItemCard({ item, onToggle, onDelete, dimmed }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.bought
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-amber-400'
        }`}
      >
        {item.bought && <span className="text-xs">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{getCategoryEmoji(item.category)}</span>
          <span className={`font-medium text-gray-900 truncate ${item.bought ? 'line-through text-gray-400' : ''}`}>
            {item.name}
          </span>
          {item.quantity && (
            <span className="text-sm text-gray-400 flex-shrink-0">({item.quantity})</span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <span>Agregó {item.added_by_name}</span>
          {item.bought && item.bought_by_name && (
            <>
              <span>·</span>
              <span>Compró {item.bought_by_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onDelete()}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg"
          >
            Sí
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg"
          >
            No
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
