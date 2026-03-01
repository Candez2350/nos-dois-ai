'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Users, Percent, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [couple, setCouple] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    split_type: 'EQUAL',
    split_percentage_partner_1: 50,
    split_percentage_partner_2: 50,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [settRes, sessRes] = await Promise.all([
          fetch('/api/couples/settings'),
          fetch('/api/auth/session')
        ]);
        const settData = await settRes.json();
        const sessData = await sessRes.json();
        
        if (settData.couple) {
          setCouple(settData.couple);
          setForm({
            name: settData.couple.name || '',
            split_type: settData.couple.split_type || 'EQUAL',
            split_percentage_partner_1: settData.couple.split_percentage_partner_1 || 50,
            split_percentage_partner_2: settData.couple.split_percentage_partner_2 || 50,
          });
        }
        setSession(sessData);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/couples/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert('Configurações salvas com sucesso!');
      } else {
        const d = await res.json();
        alert(d.error || 'Erro ao salvar.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
      </div>
    );
  }

  const isP1 = session?.partner === 1;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12">
      <h1 className="text-2xl font-bold text-[#1C1C1C] mb-6">Configurações do Casal</h1>

      {!isP1 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Apenas o <strong>Parceiro 1 (assinante)</strong> pode alterar as configurações globais do casal.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-bold text-gray-800">Identidade</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Casal</label>
            <input
              disabled={!isP1}
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-bold text-gray-800">Divisão de Contas</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={!isP1}
                onClick={() => setForm({ ...form, split_type: 'EQUAL' })}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  form.split_type === 'EQUAL'
                    ? 'border-[#25D366] bg-[#25D366]/5'
                    : 'border-gray-100 hover:border-gray-200'
                } disabled:opacity-60`}
              >
                <span className="block font-bold text-gray-800">50% / 50%</span>
                <span className="text-xs text-gray-500">Divisão igualitária</span>
              </button>
              <button
                disabled={!isP1}
                onClick={() => setForm({ ...form, split_type: 'PROPORTIONAL' })}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  form.split_type === 'PROPORTIONAL'
                    ? 'border-[#25D366] bg-[#25D366]/5'
                    : 'border-gray-100 hover:border-gray-200'
                } disabled:opacity-60`}
              >
                <span className="block font-bold text-gray-800">Proporcional</span>
                <span className="text-xs text-gray-500">Baseada na renda</span>
              </button>
            </div>

            {form.split_type === 'PROPORTIONAL' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parceiro 1 (%)</label>
                  <input
                    disabled={!isP1}
                    type="number"
                    value={form.split_percentage_partner_1}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setForm({
                        ...form,
                        split_percentage_partner_1: v,
                        split_percentage_partner_2: 100 - v,
                      });
                    }}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parceiro 2 (%)</label>
                  <input
                    disabled={!isP1}
                    type="number"
                    value={form.split_percentage_partner_2}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setForm({
                        ...form,
                        split_percentage_partner_2: v,
                        split_percentage_partner_1: 100 - v,
                      });
                    }}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#25D366] outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {isP1 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Configurações
          </button>
        )}
      </div>
    </div>
  );
}
