'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Corrigido de 'motion/react' para o pacote instalado
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

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // O 'mounted' garante que o Framer Motion só rode no navegador,
  // evitando o erro de "about:blank" ou tela branca no Next.js 15.
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              <button className="w-full sm:w-auto px-8 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/30 hover:scale-105 active:scale-95 text-lg">
                <MessageCircle className="w-6 h-6" />
                Começar agora pelo WhatsApp
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 font-medium">Teste grátis por 7 dias. Cancele quando quiser.</p>
          </motion.div>
        </div>
      </section>

      {/* O Problema (Agitação) */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-[#1C1C1C] mb-4">
              Você já passou por isso?
            </h2>
            <p className="text-gray-600">A rotina já é cansativa o suficiente para vocês brigarem por planilhas.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Amor, quem pagou a luz esse mês?",
                desc: "A perda de controle sobre as contas básicas da casa, gerando confusão e pagamentos duplicados ou atrasados."
              },
              {
                quote: "Esqueci de te transferir a metade do mercado...",
                desc: "Esquecimentos constantes e aquela sensação chata de ter que cobrar a pessoa que você ama."
              },
              {
                quote: "Que preguiça de abrir a planilha de gastos.",
                desc: "A fricção e burocracia de ter que anotar cada centavo em um app complexo ou planilha de Excel."
              }
            ].map((pain, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#F5F5F5] p-8 rounded-3xl border border-gray-100 relative"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-xl font-medium text-[#1C1C1C] italic mb-4 mt-2">&quot;{pain.quote}&quot;</p>
                <p className="text-gray-600 leading-relaxed">{pain.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* A Solução (Como Funciona) */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1C1C1C] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Zero fricção. 100% automático.
            </h2>
            <p className="text-gray-400">Veja como é simples organizar as finanças em 3 passos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#25D366]/0 via-[#25D366] to-[#25D366]/0 opacity-30" />

            {[
              {
                icon: Receipt,
                title: "1. Envie a foto",
                desc: "Pagou algo? Basta enviar a foto do comprovante ou nota fiscal no grupo do WhatsApp de vocês com o nosso bot."
              },
              {
                icon: Bot,
                title: "2. A IA processa",
                desc: "O bot lê os valores automaticamente, categoriza o gasto e anota quem foi que pagou. Sem você digitar nada."
              },
              {
                icon: CalendarCheck,
                title: "3. Fechamento Mensal",
                desc: "No dia combinado, vocês recebem um resumo claro e o valor exato do PIX para zerar as contas entre o casal."
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-[#25D366] rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-[#25D366]/20 rotate-3 hover:rotate-6 transition-transform">
                  <step.icon className="w-10 h-10 text-[#1C1C1C]" />
                </div>
                <h3 className="text-2xl font-bold font-display mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais Técnicos */}
      <section id="recursos" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-[#1C1C1C] mb-8">
              Tecnologia invisível que trabalha por vocês.
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: "Leitura Automática de Cupons (OCR)",
                  desc: "Nossa IA extrai os valores exatos de qualquer nota fiscal amassada ou print de tela."
                },
                {
                  title: "Conselheiro Financeiro Inteligente",
                  desc: "Powered by Google Gemini. Tire dúvidas financeiras e receba dicas de economia direto no chat."
                },
                {
                  title: "Zero apps para instalar",
                  desc: "Não ocupe a memória do celular. Tudo funciona 100% dentro do WhatsApp que vocês já usam todo dia."
                }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1">
                    <CheckCircle2 className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1C1C1C] mb-1">{feature.title}</h4>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#25D366]/20 to-transparent rounded-[3rem] blur-3xl" />
            <div className="bg-[#F5F5F5] border border-gray-200 rounded-[2.5rem] p-8 relative shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-[#1C1C1C]">Assistente NósDois</div>
                  <div className="text-sm text-[#25D366] font-medium">Online</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm max-w-[85%]">
                  <p className="text-gray-800">Acabei de ler a nota do Carrefour! 🛒</p>
                  <p className="text-gray-800 font-bold mt-2">Total: R$ 450,90</p>
                  <p className="text-sm text-gray-500 mt-1">Adicionado para: João</p>
                </div>
                <div className="bg-[#E7F8ED] p-4 rounded-2xl rounded-tr-none border border-[#25D366]/20 shadow-sm max-w-[85%] ml-auto">
                  <p className="text-gray-800">Perfeito! Como estamos pro fechamento?</p>
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm max-w-[85%]">
                  <p className="text-gray-800">Neste momento, a Maria deve <strong>R$ 125,45</strong> para o João para empatar as contas do mês. 📊</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Preço */}
      <section id="preco" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F5F5F5]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-[#1C1C1C] mb-4">
            Mais barato que um streaming.
          </h2>
          <p className="text-gray-600 mb-12">Invista na paz do seu relacionamento por menos de um lanche no fim de semana.</p>
          
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366] opacity-10 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="inline-block bg-[#1C1C1C] text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-8">
              PLANO CASAL
            </div>
            
            <div className="flex items-baseline justify-center gap-2 mb-8">
              <span className="text-2xl font-bold text-gray-400">R$</span>
              <span className="text-7xl font-bold font-display text-[#1C1C1C] tracking-tighter">19,90</span>
              <span className="text-xl text-gray-500 font-medium">/mês</span>
            </div>
            
            <ul className="space-y-4 mb-10 text-left max-w-sm mx-auto">
              {[
                "Acesso para 2 números de WhatsApp",
                "Leitura ilimitada de notas fiscais",
                "Relatórios mensais detalhados",
                "Conselheiro financeiro com IA",
                "Suporte prioritário"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            
            <button className="w-full md:w-auto px-12 py-5 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/30 hover:scale-105 active:scale-95 text-lg mx-auto">
              <MessageCircle className="w-6 h-6" />
              Assinar via WhatsApp
            </button>
            <p className="mt-4 text-sm text-gray-500 font-medium">7 dias grátis. Cancele com 1 clique.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-[#1C1C1C] mb-4">
              Dúvidas Frequentes
            </h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                q: "Meus dados financeiros estão seguros?",
                a: "Sim. Utilizamos criptografia de ponta a ponta. Não pedimos senhas de banco, não conectamos com sua conta bancária e seus dados nunca são compartilhados com terceiros."
              },
              {
                q: "Preciso instalar algum aplicativo?",
                a: "Não! Essa é a melhor parte. Tudo acontece diretamente no WhatsApp que você e seu parceiro(a) já utilizam todos os dias."
              },
              {
                q: "Como funciona o cancelamento e reembolso?",
                a: "Você tem 7 dias de garantia incondicional para testar. Se não gostar, devolvemos 100% do valor. Após isso, você pode cancelar a assinatura a qualquer momento, sem multas ou burocracia, direto pelo WhatsApp."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-[#F5F5F5] p-6 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold text-[#1C1C1C] mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#25D366]" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1C1C1C] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold font-display text-white mb-8">
            Prontos para parar de brigar por dinheiro?
          </h2>
          <button className="w-full sm:w-auto px-10 py-5 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#20bd5a] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/20 hover:scale-105 active:scale-95 text-xl mx-auto">
            <MessageCircle className="w-7 h-7" />
            Começar agora pelo WhatsApp
          </button>
        </div>
      </section>

      {/* Footer */}
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