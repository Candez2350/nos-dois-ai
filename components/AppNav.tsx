'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, LayoutDashboard, LogOut } from 'lucide-react';

export default function AppNav({ partnerName }: { partnerName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/app/chat" className="flex items-center gap-2 text-[#1C1C1C]">
          <div className="w-9 h-9 bg-[#25D366] rounded-lg flex items-center justify-center">
            <MessageCircle className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg">NósDois<span className="text-[#25D366]">.ai</span></span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/app/chat"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              pathname === '/app/chat'
                ? 'bg-[#25D366]/10 text-[#25D366]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </Link>
          <Link
            href="/app/dashboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              pathname === '/app/dashboard'
                ? 'bg-[#25D366]/10 text-[#25D366]'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">{partnerName}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
