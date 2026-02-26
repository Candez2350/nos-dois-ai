'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Receipt, Bot, CalendarCheck, 
  ShieldCheck, Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Isso impede que o React 19 tente renderizar animações antes da hora
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#F5F5F5]" />;
  }

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
          <a href="#comecar" className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#20bd5a] transition-all flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>Testar Agora</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 text-[#1C1C1C] text-sm font-medium mb-8 border border-[#25D366]/20">
            <Sparkles className="w-4 h-4 text-[#25D366]" />
            O 1º assistente financeiro para casais no WhatsApp
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#1C1C1C] mb-8 leading-[1.1]">
            Fim das discussões por dinheiro. <br />
            <span className="text-[#25D366]">Paz na sua relação.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Envie fotos de cupons no grupo do WhatsApp. Nossa IA organiza tudo e gera o acerto no fim do mês. Sem planilhas.
          </p>
          <button className="px-8 py-4 bg-[#25D366] text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto text-lg">
            <MessageCircle className="w-6 h-6" />
            Começar agora pelo WhatsApp
          </button>
        </motion.div>
      </section>

      {/* Seção de Preço Rápida */}
      <section className="py-24 bg-white px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-[#F5F5F5] rounded-[3rem] p-12 border border-gray-100 shadow-sm">
            <h2 className="text-3xl font-bold mb-8">Plano Casal</h2>
            <div className="flex items-baseline justify-center gap-2 mb-8">
              <span className="text-2xl font-bold text-gray-400">R$</span>
              <span className="text-7xl font-bold text-[#1C1C1C]">19,90</span>
              <span className="text-xl text-gray-500">/mês</span>
            </div>
            <ul className="space-y-4 mb-10 text-left max-w-xs mx-auto text-gray-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#25D366]" /> Acesso para o casal</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#25D366]" /> IA com Google Gemini</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#25D366]" /> Leitura de notas ilimitada</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] text-gray-400 py-12 text-center border-t border-gray-800">
        <p>© 2026 NósDois.ai - Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}