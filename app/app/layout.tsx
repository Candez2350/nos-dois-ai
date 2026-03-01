// app/app/layout.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AppNav from '@/components/AppNav'; // Ensure this path is correct

// Removed unused History import from here. It should be imported in AppNav.tsx if used there.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession(); // getSession is imported from '@/lib/session'
  if (!session) {
    redirect('/login'); // redirect is imported from 'next/navigation'
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5 flex flex-col">
      {/* Pass session data if needed by AppNav */}
      <AppNav partnerName={session.partnerName} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

