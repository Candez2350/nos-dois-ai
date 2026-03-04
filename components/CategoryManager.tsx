'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  user_id: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/custom-categories');
      if (!res.ok) throw new Error('Erro ao carregar categorias');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch('/api/custom-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Falha ao adicionar categoria');
      }

      const newCategory = await res.json();
      setCategories([...categories, newCategory.category]);
      setNewCategoryName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    const originalCategories = [...categories];
    setCategories(categories.filter(c => c.id !== id));
    setError(null);

    try {
      const res = await fetch(`/api/custom-categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Falha ao deletar categoria');
      }
    } catch (err: any) {
      setError(err.message);
      setCategories(originalCategories); // Revert on error
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Minhas Categorias Customizadas</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleAddCategory} className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Nome da nova categoria"
          className="flex-grow p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !newCategoryName.trim()}
          className="bg-[#25D366] text-white p-3 rounded-xl hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 font-bold disabled:bg-gray-300"
        >
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Adicionar
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-700 font-medium">{category.name}</span>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-500 hover:text-red-700 p-1 rounded-md transition-colors"
                aria-label={`Deletar ${category.name}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
          {categories.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-6">Nenhuma categoria customizada encontrada.</p>
          )}
        </ul>
      )}
    </div>
  );
}
