'use client';

import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Receipt, 
  Bot, 
  CalendarCheck, 
  ShieldCheck, 
  Smartphone, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  // Estado para evitar erro de data entre servidor e cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="bg-[#F5F5F5] min-h-screen" />;

  return (
    <main className="min-h-screen bg-[#F5F5F5] font-sans selection:bg-[#25D366] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F5]/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
              <MessageCircle className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold font-display text-[#1C1C1C] tracking-tight">NósDois<span className="text-[#25D366]">.ai</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm font-medium text-gray-600 hover:text-[#25D366] transition-colors">Como Funciona</a>
            <a href="#recursos" className="text-sm font-medium text-gray-600 hover:text-[#25D366] transition-colors">Recursos</a>
            <a href="#preco" className="text-sm font-medium text-gray-600 hover:text-[#25D366] transition-colors">Preço</a>
          </nav>
          <a 
            href="#comecar"
            className="bg-[#25D366] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#20bd5a] transition-all shadow-md shadow-[#25D366]/20 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Testar Agora</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366]/10 text-[#1C1C1C] text-sm font-medium mb-8 border border-[#25D366]/20">
              <Sparkles className="w-4 h-4 text-[#25D366]" />
              O 1º assistente financeiro para casais no WhatsApp
            </div>
            <h1 className="text-5xl md:text-7xl font-bold font-display text-[#1C1C1C] tracking-tight mb-8 leading-[1.1]">
              Fim das discussões por dinheiro. <br className="hidden md:block" />
              <span className="text-[#25D366]">Paz na sua relação.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              Apenas envie a foto do cupom fiscal no grupo do WhatsApp. Nossa Inteligência Artificial organiza tudo e gera o acerto no fim do mês. Sem planilhas, sem apps novos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/30 text-lg">
                <MessageCircle className="w-6 h-6" />
                Começar agora pelo WhatsApp
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 font-medium">Teste grátis por 7 dias. Cancele quando quiser.</p>
          </motion.div>
        </div>
      </section>

      {/* O Problema - Simplificado para Teste */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-[#1C1C1C] mb-4">
              Você já passou por isso?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Amor, quem pagou a luz esse mês?",
                desc: "A perda de controle sobre as contas básicas da casa, gerando confusão."
              },
              {
                quote: "Esqueci de te transferir a metade...",
                desc: "Esquecimentos constantes e aquela sensação chata de ter que cobrar."
              },
              {
                quote: "Que preguiça de abrir a planilha.",
                desc: "A fricção e burocracia de ter que anotar cada centavo."
              }
            ].map((pain, i) => (
              <div 
                key={i}
                className="bg-[#F5F5F5] p-8 rounded-3xl border border-gray-100 relative"
              >
                <p className="text-xl font-medium text-[#1C1C1C] italic mb-4">&quot;{pain.quote}&quot;</p>
                <p className="text-gray-600 leading-relaxed">{pain.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Fixo */}
      <footer className="bg-[#111111] text-gray-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-[#25D366] w-6 h-6" />
            <span className="text-xl font-bold font-display text-white tracking-tight">NósDois<span className="text-[#25D366]">.ai</span></span>
          </div>
          <div className="text-sm">
            © 2026 NósDois.ai. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}