'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Calendar,
  Loader2,
  CheckCircle2,
  Wallet,
  Users,
  PieChart,
  ArrowRightLeft,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';

const CATEGORIAS = ['Alimentação', 'Lazer', 'Transporte', 'Casa', 'Saúde', 'Vestuário', 'Compras', 'Outros'];

type Balance = {
  totalGeral: number;
  totalP1: number;
  totalP2: number;
  p1Name: string;
  p2Name: string;
  amountToTransfer: number;
  payerName: string;
  receiverName: string;
  periodRef: string;
  splitType: string;
};

type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  expense_date: string;
  payer: string;
  created_at: string;
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function DashboardPage() {
  const [balance, setBalance] = useState<Balance | null | undefined>(undefined);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [monthParam, setMonthParam] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [closing, setClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<{ success: boolean; message?: string; settlement?: Balance } | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', description: '', category: '', expense_date: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<Array<{ id: string; transaction_id: string; transaction?: { amount: number; description: string; category: string; expense_date: string }; created_at: string }>>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      setLoadingBalance(true);
      try {
        const res = await fetch(`/api/dashboard/balance?month=${monthParam}`);
        const data = await res.json();
        if (res.ok) setBalance(data.balance ?? null);
        else setBalance(null);
      } catch {
        setBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    }
    fetchBalance();
  }, [monthParam]);

  useEffect(() => {
    async function fetchExpenses() {
      setLoadingExpenses(true);
      try {
        const [y, m] = monthParam.split('-').map(Number);
        const start = `${monthParam}-01`;
        const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
        const res = await fetch(`/api/dashboard/expenses?start=${start}&end=${end}`);
        const data = await res.json();
        if (res.ok) setExpenses(data.expenses ?? []);
        else setExpenses([]);
      } catch {
        setExpenses([]);
      } finally {
        setLoadingExpenses(false);
      }
    }
    fetchExpenses();
  }, [monthParam]);

  useEffect(() => {
    setLoadingRequests(true);
    fetch('/api/transactions/deletion-requests')
      .then((r) => r.json())
      .then((d) => { if (d.requests) setDeletionRequests(d.requests); })
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, [monthParam]);

  function openEdit(e: Expense) {
    setEditExpense(e);
    setEditForm({
      amount: String(e.amount),
      description: e.description,
      category: e.category,
      expense_date: e.expense_date,
    });
  }

  async function saveEdit() {
    if (!editExpense) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/transactions/${editExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount) || 0,
          description: editForm.description,
          category: editForm.category,
          expense_date: editForm.expense_date,
        }),
      });
      if (res.ok) {
        setEditExpense(null);
        const [y, m] = monthParam.split('-').map(Number);
        const start = `${monthParam}-01`;
        const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
        const r = await fetch(`/api/dashboard/expenses?start=${start}&end=${end}`);
        const data = await r.json();
        if (r.ok) setExpenses(data.expenses ?? []);
        setBalance(undefined);
        setLoadingBalance(true);
        const br = await fetch(`/api/dashboard/balance?month=${monthParam}`);
        const bd = await br.json();
        if (br.ok) setBalance(bd.balance ?? null);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function requestDeletion(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}/request-deletion`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) alert('Solicitação enviada. Aguarde seu parceiro(a) aprovar.');
      else alert(data.error || 'Erro.');
    } finally {
      setDeletingId(null);
    }
  }

  async function respondDeletion(requestId: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/transactions/deletion-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'approve' ? 'approve' : 'reject' }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeletionRequests((prev) => prev.filter((r) => r.id !== requestId));
        const [y, m] = monthParam.split('-').map(Number);
        const start = `${monthParam}-01`;
        const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
        const r = await fetch(`/api/dashboard/expenses?start=${start}&end=${end}`);
        const d = await r.json();
        if (r.ok) setExpenses(d.expenses ?? []);
        setBalance(undefined);
        setLoadingBalance(true);
        const br = await fetch(`/api/dashboard/balance?month=${monthParam}`);
        const bd = await br.json();
        if (br.ok) setBalance(bd.balance ?? null);
      } else alert(data.error || 'Erro.');
    } catch {
      alert('Erro ao responder.');
    } finally {
      setLoadingBalance(false);
    }
  }

  async function handleClosePeriod() {
    const [y, m] = monthParam.split('-').map(Number);
    const start = `${monthParam}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
    setClosing(true);
    setCloseResult(null);
    try {
      const res = await fetch('/api/dashboard/close-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end }),
      });
      const data = await res.json();
      if (res.ok) {
        setCloseResult({
          success: true,
          message: data.closed ? 'Período fechado! Transações liquidadas.' : data.message,
          settlement: data.settlement,
        });
        setBalance(undefined);
        setLoadingBalance(true);
        const r = await fetch(`/api/dashboard/balance?month=${monthParam}`);
        const d = await r.json();
        if (r.ok) setBalance(d.balance ?? null);
      } else {
        setCloseResult({ success: false, message: data.error || 'Erro ao fechar.' });
      }
    } catch {
      setCloseResult({ success: false, message: 'Erro de conexão.' });
    } finally {
      setClosing(false);
    }
  }

  const [year, month] = monthParam.split('-').map(Number);
  const monthLabel = `${MONTHS[month - 1]} ${year}`;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {balance ? `${balance.p1Name} e ${balance.p2Name}` : 'Seu casal'}
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <select
            value={monthParam}
            onChange={(e) => setMonthParam(e.target.value)}
            className="appearance-none w-full sm:w-[200px] pl-4 pr-10 py-3 rounded-xl bg-white border border-gray-200 text-[#1C1C1C] font-medium focus:border-[#25D366] outline-none shadow-sm"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const y = d.getFullYear();
              const m = d.getMonth() + 1;
              const v = `${y}-${String(m).padStart(2, '0')}`;
              return (
                <option key={v} value={v}>
                  {MONTHS[m - 1]} {y}
                </option>
              );
            })}
          </select>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Resumo do período — cards em destaque */}
      <section className="bg-gradient-to-br from-[#1C1C1C] to-[#2d2d2d] rounded-3xl border border-gray-800 shadow-xl p-6 sm:p-8 mb-8 text-white">
        <h2 className="text-lg font-semibold text-white/90 mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#25D366]" />
          {monthLabel}
        </h2>
        {loadingBalance ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
          </div>
        ) : balance ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">
                <p className="text-white/70 text-sm font-medium mb-1">Total gasto</p>
                <p className="text-3xl font-bold">R$ {balance.totalGeral.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">
                <p className="text-white/70 text-sm font-medium mb-1">{balance.p1Name}</p>
                <p className="text-2xl font-bold">R$ {balance.totalP1.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-5 backdrop-blur">
                <p className="text-white/70 text-sm font-medium mb-1">{balance.p2Name}</p>
                <p className="text-2xl font-bold">R$ {balance.totalP2.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-[#25D366]/20 border border-[#25D366]/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/30 flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-[#25D366]" />
                </div>
                <div>
                  {balance.amountToTransfer > 0 ? (
                    <>
                      <p className="text-white/80 text-sm">Acerto do período</p>
                      <p className="text-xl font-bold">
                        {balance.payerName} → R$ {balance.amountToTransfer.toFixed(2)} → {balance.receiverName}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/80 text-sm">Acerto</p>
                      <p className="text-xl font-bold text-[#25D366]">Contas equilibradas</p>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleClosePeriod}
                disabled={closing || balance.amountToTransfer <= 0}
                className="shrink-0 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {closing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {closing ? 'Fechando...' : 'Fechar período'}
              </button>
            </div>
            {closeResult && (
              <div className={`mt-4 p-4 rounded-2xl ${closeResult.success ? 'bg-[#25D366]/20' : 'bg-red-500/20'}`}>
                {closeResult.message}
                {closeResult.settlement?.amountToTransfer && (
                  <p className="mt-2 font-medium">PIX: R$ {closeResult.settlement.amountToTransfer.toFixed(2)}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-white/70 py-4">Nenhuma despesa no período.</p>
        )}
      </section>

      {/* Solicitações de exclusão pendentes */}
      {deletionRequests.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8">
          <h2 className="text-lg font-bold text-amber-900 mb-4">Solicitações de exclusão</h2>
          <p className="text-sm text-amber-800 mb-4">Seu parceiro(a) pediu para excluir estes lançamentos. Aprove ou rejeite.</p>
          <ul className="space-y-3">
            {deletionRequests.map((req) => (
              <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl p-4 border border-amber-100">
                <div>
                  <p className="font-medium text-[#1C1C1C]">{req.transaction?.description} — R$ {Number(req.transaction?.amount || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{req.transaction?.expense_date && new Date(req.transaction.expense_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondDeletion(req.id, 'reject')}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => respondDeletion(req.id, 'approve')}
                    className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bd5a]"
                  >
                    Aprovar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Gastos por categoria */}
      {!loadingExpenses && byCategory.length > 0 && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#25D366]" />
            Por categoria
          </h2>
          <div className="space-y-3">
            {byCategory.map(([cat, value]) => (
              <div key={cat} className="flex items-center justify-between gap-4">
                <span className="text-[#1C1C1C] font-medium">{cat}</span>
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#25D366] rounded-full"
                      style={{ width: `${totalExpenses ? (value / totalExpenses) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1C1C1C] w-20 text-right">R$ {value.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de gastos */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-[#1C1C1C] p-6 pb-0 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#25D366]" />
          Lançamentos — {monthLabel}
        </h2>
        {loadingExpenses ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-gray-500 p-6">Nenhum gasto registrado neste período.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1C1C1C] truncate">{e.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(e.expense_date).toLocaleDateString('pt-BR')} · {e.payer}
                    <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                      {e.category}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-[#1C1C1C]">R$ {e.amount.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#25D366] transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDeletion(e.id)}
                    disabled={deletingId === e.id}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Solicitar exclusão (parceiro aprova)"
                  >
                    {deletingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal Editar lançamento */}
      {editExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1C1C1C]">Editar lançamento</h3>
              <button type="button" onClick={() => setEditExpense(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Estabelecimento</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={editForm.expense_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, expense_date: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setEditExpense(null)} className="flex-1 py-3 rounded-xl border border-gray-200 font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={saveEdit} disabled={savingEdit} className="flex-1 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] disabled:opacity-50 flex items-center justify-center gap-2">
                {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
