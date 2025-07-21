import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/supabase/server';
import { UserRole } from "@/contexts/auth-context";
import { MembersNav } from '@/components/members/members-nav';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/actions/auth';

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
  const { data: profile } = await getSupabaseClient()
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', session.user.id)
    .single();

  const userRole = profile?.role as UserRole;
  const userName = profile?.full_name || session.user.email?.split('@')[0] || 'User';

  // Redirect to unauthorized if user doesn't have member or donor role
  if (!['donor', 'member'].includes(userRole)) {
    redirect('/(members)/unauthorized');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r">
          <div className="flex h-16 flex-shrink-0 items-center px-4 bg-primary text-primary-foreground">
            <h1 className="text-xl font-bold">Members Portal</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 space-y-4 p-4">
              <MembersNav />
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </p>
                </div>
                <form action={signOut}>
                  <Button type="submit" variant="ghost" size="sm">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
