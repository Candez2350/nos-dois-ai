'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Receipt, Bot, CalendarCheck, ShieldCheck, 
  Sparkles, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enquanto não monta, mostra um fundo neutro para evitar o flash branco
  if (!mounted) return <div className="min-h-screen bg-[#F5F5F5]" />;

  return (
    <main className="min-h-screen bg-[#F5F5F5] font-sans selection:bg-[#25D366] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F5]/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
              <MessageCircle className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-[#1C1C1C] tracking-tight">NósDois<span className="text-[#25D366]">.ai</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#como-funciona" className="hover:text-[#25D366] transition-colors">Como Funciona</a>
            <a href="#recursos" className="hover:text-[#25D366] transition-colors">Recursos</a>
            <a href="#preco" className="hover:text-[#25D366] transition-colors">Preço</a>
          </nav>
          <button className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#20bd5a] transition-all flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Testar Agora</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 text-[#1C1C1C] text-sm font-medium mb-8 border border-[#25D366]/20">
            <Sparkles className="w-4 h-4 text-[#25D366]" />
            O 1º assistente financeiro para casais no WhatsApp
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#1C1C1C] tracking-tight mb-8 leading-[1.1]">
            Fim das discussões por dinheiro. <br className="hidden md:block" />
            <span className="text-[#25D366]">Paz na sua relação.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Apenas envie a foto do cupom fiscal no grupo do WhatsApp. Nossa IA organiza tudo e gera o acerto no fim do mês. Sem planilhas, sem estresse.
          </p>
          <div className="flex flex-col sm:row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-10 py-5 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-all shadow-xl shadow-[#25D366]/30 text-lg flex items-center justify-center gap-3">
              <MessageCircle className="w-6 h-6" />
              Começar pelo WhatsApp
            </button>
          </div>
        </motion.div>
      </section>

      {/* O Problema */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { q: "Amor, quem pagou a luz?", d: "Confusão com contas básicas e pagamentos atrasados." },
              { q: "Esqueci de te transferir...", d: "A sensação chata de ter que cobrar quem você ama." },
              { q: "Preguiça de abrir planilha.", d: "A burocracia de anotar cada centavo em apps complexos." }
            ].map((item, i) => (
              <div key={i} className="bg-[#F5F5F5] p-8 rounded-3xl border border-gray-100 relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-lg font-medium italic mb-2">"{item.q}"</p>
                <p className="text-gray-600 text-sm">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 px-4 bg-[#1C1C1C] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Zero fricção. 100% automático.</h2>
            <p className="text-gray-400">Simples como mandar um "Oi".</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { icon: Receipt, t: "1. Foto", d: "Envie a foto do comprovante no grupo." },
              { icon: Bot, t: "2. IA", d: "A Tamiris lê, categoriza e anota quem pagou." },
              { icon: CalendarCheck, t: "3. Acerto", d: "Receba o resumo exato no fim do mês." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-20 h-20 bg-[#25D366] rounded-2xl flex items-center justify-center mb-6 rotate-3">
                  <step.icon className="w-10 h-10 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.t}</h3>
                <p className="text-gray-400">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="py-24 px-4 max-w-3xl mx-auto text-center">
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
          <div className="inline-block bg-[#1C1C1C] text-white px-4 py-1.5 rounded-full text-xs font-bold mb-8">PLANO CASAL</div>
          <div className="flex items-baseline justify-center gap-2 mb-8">
            <span className="text-2xl font-bold text-gray-300">R$</span>
            <span className="text-7xl font-bold text-[#1C1C1C]">19,90</span>
            <span className="text-xl text-gray-500">/mês</span>
          </div>
          <ul className="space-y-4 mb-10 text-left max-w-xs mx-auto">
            {["Acesso para os dois", "IA Google Gemini 1.5 Pro", "Notas ilimitadas", "Relatórios automáticos"].map((li, i) => (
              <li key={i} className="flex items-center gap-3 font-medium text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-[#25D366]" /> {li}
              </li>
            ))}
          </ul>
          <button className="w-full py-5 bg-[#25D366] text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform">
            Assinar agora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] text-gray-500 py-12 text-center text-sm border-t border-gray-800">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <span className="text-white font-bold">NósDois.ai</span>
        </div>
        <p>© 2026 NósDois.ai - Simplificando a vida de casais.</p>
      </footer>
    </main>
  );
}