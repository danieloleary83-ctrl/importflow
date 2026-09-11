import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-surface">
      <Nav email={user?.email ?? null} />
      <main className="md:pl-64">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
