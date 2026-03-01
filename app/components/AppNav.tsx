'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, // Example icon for Dashboard
  History,         // Icon for History
  Settings,        // Example icon for Settings
  Users,           // Example icon for Profile/Couple
  LogOut,
  LucideIcon,
} from 'lucide-react';

// Assuming AppNav is a component that takes navigation items and renders them.
// If AppNav itself needs modification, please specify.

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
  partnerName?: string;
}

export default function AppNav({ partnerName }: AppNavProps) {
  const pathname = usePathname();

  // Placeholder for logout functionality
  const handleLogout = () => {
    // Implement logout logic here (e.g., clear session, redirect to login)
    console.log('Logout clicked');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo or App Name */}
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" /> {/* Replace with your app logo/icon */}
          <span className="text-lg font-semibold text-gray-800">NósDois.ai</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6 items-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <div
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                  pathname === item.href
                    ? 'text-primary bg-primary-light hover:bg-primary-lighter'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800',
                ].join(' ')}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4">
          <span className="text-gray-700 text-sm font-medium hidden sm:inline-block">
            Olá, {partnerName || 'Parceiro(a)'}
          </span>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-md hover:bg-red-50"
            title="Sair"
          >
            <LogOut className="h-6 w-6" />
          </button>
          {/* Mobile Menu Button would go here */}
        </div>
      </div>
    </nav>
  );
}
