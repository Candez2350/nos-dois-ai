'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: MessageCircle, label: 'Chat', href: '/chat' },
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: History, label: 'Histórico', href: '/history' },
    { icon: User, label: 'Perfil', href: '/profile' },
    { icon: Settings, label: 'Ajustes', href: '/settings' },
  ];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-full fixed left-0 top-0 z-40">
        <div className="p-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-[#25D366] rounded-lg flex items-center justify-center">
            <MessageCircle className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">NósDois<span className="text-[#25D366]">.ai</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#25D366]/10 text-[#25D366]' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 md:ml-64 h-full overflow-y-auto relative bg-background">
        {children}
        {/* Espaço extra no final para não ficar escondido atrás da Bottom Nav no mobile */}
        <div className="h-24 md:h-0" />
      </main>

      {/* --- BOTTOM NAVIGATION (Mobile) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-6 py-3 z-50 flex justify-between items-center safe-area-bottom">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                isActive ? 'text-[#25D366]' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${
                isActive ? 'bg-[#25D366]/10' : 'bg-transparent'
              }`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
