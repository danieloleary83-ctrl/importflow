"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Package,
  ClipboardList,
  Ship,
  Sparkles,
  Search,
  AlertTriangle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-import", label: "AI Import", icon: Sparkles, highlight: true },
  { href: "/orders", label: "Purchase Orders", icon: ClipboardList },
  { href: "/shipments", label: "Shipments", icon: Ship },
  { href: "/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/products", label: "Products", icon: Package },
  { href: "/problems", label: "Problems", icon: AlertTriangle },
  { href: "/search", label: "Search", icon: Search },
];

export function Nav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const NavLinks = (
    <nav className="flex-1 space-y-1 px-3">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-ink text-white"
                : link.highlight
                ? "text-gold-dark hover:bg-gold/10"
                : "text-neutral-700 hover:bg-surface"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink text-sm">
            IA
          </span>
          Inch Autos
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-white p-2"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-ink/95 pt-16 flex flex-col">
          {NavLinks}
          <div className="p-3 border-t border-white/10 mt-4">
            <button
              onClick={signOut}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 w-full"
            >
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-line">
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-gold font-bold">
            IA
          </span>
          <div>
            <div className="font-bold leading-tight">Inch Autos</div>
            <div className="text-xs text-neutral-500 leading-tight">Purchase Tracker</div>
          </div>
        </div>
        {NavLinks}
        <div className="p-3 mt-4 border-t border-line">
          {email && (
            <div className="px-3 py-1 text-xs text-neutral-500 truncate">{email}</div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-surface w-full"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
