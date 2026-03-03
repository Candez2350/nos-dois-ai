'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Save, Trash2, Edit, X, AlertCircle } from 'lucide-react';

// Types based on our API responses
interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  day_of_month: number;
  category_id: string;
  category_name?: string; // Comes from the GET request join
  active: boolean;
}

interface Category {
  id: string;
  name: string;
}

const initialFormData = {
  description: '',
  amount: '',
  category_id: '',
  day_of_month: '',
  active: true,
};

export default function RecurringExpenseManager() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesRes, categoriesRes] = await Promise.all([
        fetch('/api/recurring-expenses'),
        fetch('/api/custom-categories'),
      ]);

      if (!expensesRes.ok || !categoriesRes.ok) {
        throw new Error('Falha ao carregar dados.');
      }

      const expensesData = await expensesRes.json();
      const categoriesData = await categoriesRes.json();
      
      setExpenses(expensesData.expenses || []);
      setCategories(categoriesData.categories || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModalForCreate = () => {
    setEditingExpense(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: String(expense.amount),
      category_id: expense.category_id,
      day_of_month: String(expense.day_of_month),
      active: expense.active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta despesa recorrente?')) {
      return;
    }
    try {
      const res = await fetch(`/api/recurring-expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao apagar.');
      // Refetch data to update the list
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const url = editingExpense ? `/api/recurring-expenses` : '/api/recurring-expenses';
    const method = editingExpense ? 'PUT' : 'POST';
    
    const body = {
      ...editingExpense,
      ...formData,
      amount: parseFloat(formData.amount),
      day_of_month: parseInt(formData.day_of_month, 10),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao salvar despesa.');
      }
      setIsModalOpen(false);
      fetchData(); // Refresh data on success
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-red-200 rounded-2xl p-4 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Minhas Despesas</h3>
        <button onClick={openModalForCreate} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold rounded-lg hover:bg-[#20bd5a] transition-colors text-sm">
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>
      {expenses.length === 0 ? (
        <p className="p-6 text-gray-500">Nenhuma despesa recorrente cadastrada.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {expenses.map(exp => (
            <li key={exp.id} className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold text-[#1C1C1C]">{exp.description}</p>
                <p className="text-sm text-gray-500">
                  Dia {exp.day_of_month} · R$ {exp.amount.toFixed(2)}
                  <span className={`ml-2 inline-block h-2 w-2 rounded-full ${exp.active ? 'bg-green-500' : 'bg-gray-400'}`} title={exp.active ? 'Ativa' : 'Inativa'}></span>
                </p>
              </div>
              <div className="text-sm text-gray-600 font-medium sm:text-right">
                {exp.category_name}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModalForEdit(exp)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(exp.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full">
            <form onSubmit={handleSubmit}>
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <h3 className="text-lg font-bold text-[#1C1C1C]">{editingExpense ? 'Editar Despesa' : 'Nova Despesa Recorrente'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input name="description" value={formData.description} onChange={handleFormChange} required className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                        <input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleFormChange} required className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dia do Mês</label>
                        <input name="day_of_month" type="number" min="1" max="31" value={formData.day_of_month} onChange={handleFormChange} required className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none" />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select name="category_id" value={formData.category_id} onChange={handleFormChange} required className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none appearance-none bg-white">
                    <option value="" disabled>Selecione...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <input name="active" type="checkbox" checked={formData.active} onChange={handleFormChange} id="active-checkbox" className="h-4 w-4 rounded border-gray-300 text-[#25D366] focus:ring-[#25D366]"/>
                    <label htmlFor="active-checkbox" className="text-sm font-medium text-gray-700">Ativa (gerar transações automaticamente)</label>
                </div>
              </div>
              <div className="p-6 bg-gray-50/70 rounded-b-3xl flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-100">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
