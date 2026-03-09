
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  History,
  Settings,
  Users,
  LogOut,
  LucideIcon,
  Sun,
  Moon,
} from 'lucide-react';



interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  {
    href: '/app/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/app/history',
    label: 'Histórico',
    icon: History,
  },
  {
    href: '/app/settings',
    label: 'Configurações',
    icon: Settings,
  },
  // Add other navigation items as needed
];

interface AppNavProps {
  // partnerName prop is removed, AppNav will fetch it internally
}

export default function AppNav(props: AppNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoadingSession(true);
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session?.partnerName) {
            setPartnerName(session.partnerName);
          } else {
            setPartnerName('Parceiro(a)');
          }
        } else {
          setPartnerName('Parceiro(a)');
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setPartnerName('Parceiro(a)'); // Fallback
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchSession();
  }, []);

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <nav className="bg-background border-b border-gray-200 dark:border-gray-800 shadow-sm py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold text-foreground">NósDois.ai</span>
        </div>

        <div className="hidden md:flex space-x-6 items-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <div
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                  pathname === item.href
                    ? 'text-primary bg-primary-light hover:bg-primary-lighter'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100',
                ].join(' ')}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Mudar tema"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6 text-yellow-500" /> : <Moon className="h-6 w-6 text-gray-700" />}
          </button>
          <span className="text-foreground text-sm font-medium hidden sm:inline-block">
            {isLoadingSession ? 'Carregando...' : `Olá, ${partnerName || 'Parceiro(a)'}`}
          </span>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Sair"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}

