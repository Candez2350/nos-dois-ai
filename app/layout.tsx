import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppNav from '@/components/AppNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NósDois.ai',
  description: 'Finanças para casais',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppNav partnerName={''} />
        {children}
      </body>
    </html>
  );
}