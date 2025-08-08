import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function DashboardPage() {
  const supabase = await supabaseServer(); // <-- await the async helper
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Hello {user.email}</p>
      <form action="/api/signout" method="post">
        <button>Sign out</button>
      </form>
    </main>
  );
}