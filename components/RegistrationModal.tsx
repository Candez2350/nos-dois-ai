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
      split_type: formData.get('split_type'),
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
                <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Cadastrar casal</h2>
                <p className="text-gray-600 mb-6">Um de vocês cria o casal. Depois, os dois entram com o mesmo código e escolhem &quot;Parceiro 1&quot; ou &quot;Parceiro 2&quot;.</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <input
                    name="name"
                    required
                    placeholder="Nome do casal (ex: Roger e Tamiris)"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] outline-none transition-all"
                  />
                  <input
                    name="phone"
                    required
                    type="tel"
                    placeholder="Seu WhatsApp (ex: 5521999999999)"
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-[#25D366] outline-none transition-all"
                  />
                  
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <p className="font-medium text-gray-700">Forma de Divisão de Contas:</p>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-[#25D366] transition-colors">
                      <input type="radio" name="split_type" value="EQUAL" defaultChecked className="accent-[#25D366] w-5 h-5" />
                      <div>
                        <span className="block font-medium text-gray-800">50% / 50%</span>
                        <span className="text-xs text-gray-500">Divisão igualitária para todas as contas</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-[#25D366] transition-colors">
                      <input type="radio" name="split_type" value="PROPORTIONAL" className="accent-[#25D366] w-5 h-5" />
                      <div>
                        <span className="block font-medium text-gray-800">Proporcional (Renda)</span>
                        <span className="text-xs text-gray-500">Defina a porcentagem de cada um</span>
                      </div>
                    </label>
                  </div>

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
                <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Casal criado 🚀</h2>
                <p className="text-gray-600 mb-3">Código do casal (guarde ou compartilhe):</p>
                <div className="bg-[#25D366]/10 border-2 border-[#25D366]/30 p-5 rounded-2xl mb-6">
                  <span className="font-mono text-2xl font-bold text-[#1C1C1C] tracking-wider">{token}</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Você é o <strong>Parceiro 1</strong>. Entre no app com o código acima. Seu parceiro(a) entra depois com o <strong>mesmo código</strong> e escolhe Parceiro 2.
                </p>
                <Link
                  href={`/login?token=${encodeURIComponent(token)}`}
                  className="block w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] shadow-lg transition-all text-center"
                >
                  Entrar no app agora
                </Link>
                <button type="button" onClick={onClose} className="mt-4 w-full text-[#25D366] font-bold text-sm hover:underline">
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