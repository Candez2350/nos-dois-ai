'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  Calendar,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Wallet,
} from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto p-4 pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#1C1C1C]">Dashboard</h1>
        <div className="relative">
          <select
            value={monthParam}
            onChange={(e) => setMonthParam(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 text-[#1C1C1C] font-medium focus:border-[#25D366] outline-none"
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

      {/* Saldo do período */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-[#1C1C1C] mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#25D366]" />
          Saldo do período — {monthLabel}
        </h2>
        {loadingBalance ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
          </div>
        ) : balance ? (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#F5F5F5] rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Total gasto</p>
                <p className="text-2xl font-bold text-[#1C1C1C]">
                  R$ {balance.totalGeral.toFixed(2)}
                </p>
              </div>
              <div className="bg-[#F5F5F5] rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">{balance.p1Name}</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  R$ {balance.totalP1.toFixed(2)}
                </p>
              </div>
              <div className="bg-[#F5F5F5] rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">{balance.p2Name}</p>
                <p className="text-xl font-bold text-[#1C1C1C]">
                  R$ {balance.totalP2.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-4">
              <p className="text-sm text-gray-600 mb-1">Acerto</p>
              {balance.amountToTransfer > 0 ? (
                <p className="text-lg font-bold text-[#1C1C1C]">
                  {balance.payerName} deve enviar{' '}
                  <span className="text-[#25D366]">R$ {balance.amountToTransfer.toFixed(2)}</span>{' '}
                  para {balance.receiverName}
                </p>
              ) : (
                <p className="text-lg font-bold text-[#25D366]">Contas equilibradas ✅</p>
              )}
            </div>
            <button
              onClick={handleClosePeriod}
              disabled={closing || balance.amountToTransfer <= 0}
              className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {closing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              {closing ? 'Fechando...' : 'Fechar período e liquidar'}
            </button>
          </>
        ) : (
          <p className="text-gray-500 py-4">Nenhuma despesa no período.</p>
        )}
        {closeResult && (
          <div
            className={`mt-4 p-4 rounded-2xl ${
              closeResult.success ? 'bg-[#25D366]/10 text-[#1C1C1C]' : 'bg-red-50 text-red-700'
            }`}
          >
            {closeResult.message}
            {closeResult.settlement && closeResult.settlement.amountToTransfer > 0 && (
              <p className="mt-2 font-medium">
                PIX: R$ {closeResult.settlement.amountToTransfer.toFixed(2)} de{' '}
                {closeResult.settlement.payerName} para {closeResult.settlement.receiverName}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Lista de gastos */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-[#1C1C1C] p-6 pb-0 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#25D366]" />
          Gastos — {monthLabel}
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
              <li
                key={e.id}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#1C1C1C] truncate">{e.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(e.expense_date).toLocaleDateString('pt-BR')} · {e.payer} · {e.category}
                  </p>
                </div>
                <span className="font-bold text-[#1C1C1C] shrink-0">
                  R$ {e.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
