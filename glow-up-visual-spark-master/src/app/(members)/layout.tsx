import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/supabase/server';
import { UserRole } from "@/contexts/auth-context";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  // If not authenticated, redirect to login
  if (!session) {
    redirect('/login');
  }

  // Get user role from session
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const userRole = profile?.role as UserRole;

  // Redirect to unauthorized if user doesn't have member or donor role
  if (!['donor', 'member'].includes(userRole)) {
    redirect('/(members)/unauthorized');
  }

  // Redirect to the appropriate dashboard based on role
  if (userRole === 'donor') {
    redirect('/(members)/donor/dashboard');
  } else if (userRole === 'member') {
    redirect('/(members)/member/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
