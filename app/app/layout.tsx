'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageCircle, 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut, 
  Menu 
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Definição dos itens do menu (Adicionados Histórico e Ajustes)
  const navItems = [
    { href: '/app/chat', label: 'Chat', icon: MessageCircle },
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/history', label: 'Histórico', icon: History },
    { href: '/app/settings', label: 'Ajustes', icon: Settings },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      {/* --- SIDEBAR (Apenas Desktop) --- */}
      {/* A classe 'hidden md:flex' garante que só apareça em telas médias ou maiores */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
            <MessageCircle className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-[#1C1C1C]">NósDois<span className="text-[#25D366]">.ai</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive(item.href)
                  ? 'bg-[#25D366]/10 text-[#25D366]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#1C1C1C]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link 
            href="/api/auth/logout" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </Link>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      {/* 'md:pl-64' empurra o conteúdo para a direita no desktop para não ficar embaixo da sidebar */}
      <main className="flex-1 md:pl-64 flex flex-col h-full overflow-hidden relative">
        {/* Header Mobile (Opcional, apenas se quiser mostrar logo no mobile) */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-center px-4 shrink-0">
           <span className="font-bold text-[#1C1C1C]">NósDois<span className="text-[#25D366]">.ai</span></span>
        </header>

        {/* Área de scroll do conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </div>
      </main>

      {/* --- BOTTOM NAVIGATION (Apenas Mobile) --- */}
      {/* A classe 'md:hidden' garante que suma em telas desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'text-[#25D366]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon className={`w-6 h-6 ${isActive(item.href) ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
