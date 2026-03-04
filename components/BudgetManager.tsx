'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Loader2, Plus, Trash2, X, Target } from 'lucide-react';

interface Category {
  id: string; // Can be from default or custom categories
  name: string;
}

interface Budget {
  id: number;
  category: string;
  limit_amount: number;
  month_year: string;
}

// Helper to get current month in YYYY-MM format
const getCurrentMonthYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [amount, setAmount] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [budgetsRes, customCategoriesRes] = await Promise.all([
          fetch('/api/budgets'),
          fetch('/api/custom-categories'),
        ]);

        if (!budgetsRes.ok || !customCategoriesRes.ok) {
          throw new Error('Erro ao carregar dados.');
        }

        const budgetsData = await budgetsRes.json();
        const customCategoriesData = await customCategoriesRes.json();

        setBudgets(budgetsData.budgets || []);
        
        const combined = [...defaultCategories, ...(customCategoriesData.categories || []).map((c: any) => ({...c, id: c.name}))];
        setAllCategories(combined);
        if (combined.length > 0) {
            setSelectedCategory(combined[0].name);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  
  async function handleAddBudget(e: FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !amount) return;

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('O valor do orçamento deve ser um número positivo.');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category: selectedCategory, 
          limit_amount: numericAmount,
          month_year: getCurrentMonthYear(),
        }),
      });

      if (!res.ok) {
        const { error: resError } = await res.json();
        throw new Error(resError || 'Falha ao adicionar orçamento.');
      }

      const newBudget = await res.json();
      setBudgets([...budgets, newBudget.budget]);
      setAmount('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteBudget(id: number) {
    const originalBudgets = [...budgets];
    setBudgets(budgets.filter(b => b.id !== id));
    setError(null);

    try {
      const res = await fetch(`/api/budgets?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const { error: resError } = await res.json();
        throw new Error(resError || 'Falha ao deletar orçamento.');
      }
    } catch (err: any) {
      setError(err.message);
      setBudgets(originalBudgets);
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-[#25D366]" />
        <h2 className="text-lg font-bold text-gray-800">Meus Orçamentos</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleAddBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:border-[#25D366] outline-none"
            disabled={isAdding}
          >
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex: 500,00"
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
            disabled={isAdding}
          />
        </div>
        <div className="self-end">
          <button
            type="submit"
            disabled={isAdding || !selectedCategory || !amount}
            className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-2 disabled:bg-gray-300"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Adicionar
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
        </div>
      ) : (
        <ul className="space-y-3">
          {budgets.map((budget) => (
            <li
              key={budget.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <span className="font-semibold text-gray-800">{budget.category}</span>
              <div className="flex items-center gap-4">
                <span className="font-mono text-gray-700">
                  R$ {Number(budget.limit_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-md transition-colors"
                  aria-label={`Deletar orçamento para ${budget.category}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
          {budgets.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-8">Nenhum orçamento definido.</p>
          )}
        </ul>
      )}
    </div>
  );
}
