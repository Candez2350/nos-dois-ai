import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AppNav from '@/components/AppNav';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <AppNav partnerName={session.partnerName} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
