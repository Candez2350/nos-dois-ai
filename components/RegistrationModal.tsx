'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, CheckCircle2, ArrowRight, Smartphone } from 'lucide-react';

export default function RegistrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'token'>('form');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      owner_phone: formData.get('phone'),
    };
    try {
      const res = await fetch('/api/couples/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setStep('token');
      } else {
        alert(data.error || 'Erro ao registrar.');
      }
    } catch (err) {
      alert('Erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 pt-12">
          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8 text-[#25D366]" />
                </div>
                <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Comece o teste grátis</h2>
                <p className="text-gray-600 mb-8">Crie sua conta e acesse o app para registrar gastos e ver o dashboard.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <input
                    name="name"
                    required
                    placeholder="Nome do Casal (ex: Roger e Tamiris)"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] outline-none transition-all"
                  />
                  <input
                    name="phone"
                    required
                    placeholder="Seu WhatsApp (ex: 5521999999999)"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] outline-none transition-all"
                  />
                  <button
                    disabled={loading}
                    className="w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Criando conta...' : 'Criar conta'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="token"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#25D366]/20">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Conta criada! 🚀</h2>
                <p className="text-gray-600 mb-6">Seu código do casal:</p>
                <div className="bg-gray-50 border-2 border-[#25D366]/30 p-5 rounded-2xl mb-6">
                  <span className="font-mono text-2xl font-bold text-[#1C1C1C]">{token}</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Compartilhe com seu parceiro(a). Os dois usam o mesmo código e escolhem &quot;Parceiro 1&quot; ou &quot;Parceiro 2&quot; ao entrar.
                </p>
                <Link
                  href={`/login?token=${encodeURIComponent(token)}`}
                  className="block w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] shadow-lg transition-all"
                >
                  Acessar o app
                </Link>
                <button onClick={onClose} className="mt-4 text-[#25D366] font-bold text-sm hover:underline">
                  Fechar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}