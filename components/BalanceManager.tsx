'use client';

import { useState, FormEvent } from 'react';
import { Loader2, Save, X, Scale } from 'lucide-react';

export default function BalanceManager() {
  const [amount, setAmount] = useState('');
  const [debtor, setDebtor] = useState<'partner_1' | 'partner_2'>('partner_1');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('O valor do ajuste deve ser um número positivo.');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/balance/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          debtor,
          reason,
        }),
      });

      if (!res.ok) {
        const { error: resError } = await res.json();
        throw new Error(resError || 'Falha ao fazer o ajuste de saldo.');
      }

      setSuccess('Ajuste de saldo realizado com sucesso! O dashboard será atualizado em breve.');
      setAmount('');
      setReason('');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Scale className="w-6 h-6 text-[#25D366]" />
        <h2 className="text-lg font-bold text-gray-800">Novo Ajuste de Saldo</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Esta operação cria uma transação de "ajuste" para corrigir o saldo devedor entre o casal.
        Use com cuidado, apenas para zerar dívidas antigas ou corrigir erros passados.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quem ficou devendo?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDebtor('partner_1')}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                debtor === 'partner_1'
                  ? 'border-[#25D366] bg-[#25D366]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="block font-bold text-gray-800">Parceiro(a) 1</span>
            </button>
            <button
              type="button"
              onClick={() => setDebtor('partner_2')}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                debtor === 'partner_2'
                  ? 'border-[#25D366] bg-[#25D366]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="block font-bold text-gray-800">Parceiro(a) 2</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Valor do Ajuste (R$)</label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex: 50,00"
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo do Ajuste</label>
          <input
            id="reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Dívida antiga do aluguel"
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none"
            disabled={isSaving}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving || !amount || !reason}
            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Ajuste
          </button>
        </div>
      </form>
    </div>
  );
}
