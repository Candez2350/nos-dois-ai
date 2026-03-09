'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Loader2, Save, Users, Percent, Lock, LogOut, Bell, Sun, Moon, Laptop } from 'lucide-react';
import Link from 'next/link';

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    split_type: 'EQUAL',
    split_percentage_partner_1: 50,
    split_percentage_partner_2: 50,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function checkSubscription() {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    }
    checkSubscription();
  }, []);

  async function handleSubscribe() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        // Unsubscribe
        await existingSubscription.unsubscribe();
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: existingSubscription.endpoint }),
        });
        setIsSubscribed(false);
        alert('Notificações desativadas.');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Permissão para notificações não concedida.');
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID public key não encontrada.');
          alert('Erro na configuração do servidor de notificações.');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
        
        setIsSubscribed(true);
        alert('Notificações ativadas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao (des)inscrever notificações:', error);
      alert('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsSubscribing(false);
    }
  }


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

  const isP1 = session?.role === 'partner_1';

  return (
    <div className="max-w-2xl mx-auto p-4 pb-12">
      <h1 className="text-2xl font-bold text-[#1C1C1C] mb-6">Configurações</h1>

      {!isP1 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Apenas o <strong>Parceiro 1 (quem criou a conta)</strong> pode alterar as configurações globais do casal.
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
            <Sun className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-bold text-gray-800">Aparência</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                theme === 'light' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <Sun className="w-6 h-6" />
              <span className="text-sm font-medium">Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                theme === 'dark' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <Moon className="w-6 h-6" />
              <span className="text-sm font-medium">Escuro</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                theme === 'system' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <Laptop className="w-6 h-6" />
              <span className="text-sm font-medium">Sistema</span>
            </button>
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

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#25D366]" />
            <h2 className="font-bold text-gray-800">Notificações</h2>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
            <div>
              <p className="font-semibold text-gray-800">Avisos de Pendências</p>
              <p className="text-sm text-gray-500">Receba um alerta quando houver uma ação pendente.</p>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                isSubscribed
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-[#25D366]/20 text-[#006424] hover:bg-[#25D366]/30'
              }`}
            >
              {isSubscribing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubscribed ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#25D366]"><path d="M18 6.2c-1.5-1.5-3.5-2.2-5.5-2.2-4.9 0-9 4.1-9 9s4.1 9 9 9c2 0 4-0.7 5.5-2.2"/><path d="M15 6.8c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/><path d="M9.5 14.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/></svg>
            <h2 className="font-bold text-gray-800">Automações e Ajustes</h2>
          </div>
          <Link href="/settings/recurring" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-semibold text-gray-800">Despesas Recorrentes</p>
              <p className="text-sm text-gray-500">Gerencie assinaturas e contas fixas (ex: aluguel, Netflix).</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
          <div className="border-t border-gray-100 -mx-6 my-2"></div>
          <Link href="/settings/categories" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-semibold text-gray-800">Minhas Categorias</p>
              <p className="text-sm text-gray-500">Crie e gerencie suas próprias categorias de gastos.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
          <div className="border-t border-gray-100 -mx-6 my-2"></div>
          <Link href="/settings/balance" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-semibold text-gray-800">Ajuste Manual de Saldo</p>
              <p className="text-sm text-gray-500">Corrija o saldo devedor de um dos parceiros.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
          <div className="border-t border-gray-100 -mx-6 my-2"></div>
          <Link href="/settings/budgets" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-semibold text-gray-800">Orçamentos</p>
              <p className="text-sm text-gray-500">Defina limites de gastos mensais por categoria.</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>
          </Link>
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

        {/* Botão de Sair (Apenas Mobile) */}
        <div className="md:hidden pt-6 border-t border-gray-200 mt-8">
          <Link 
            href="/api/auth/logout"
            className="flex items-center justify-center gap-2 w-full p-4 text-red-500 font-bold bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da conta
          </Link>
        </div>
      </div>
    </div>
  );
}