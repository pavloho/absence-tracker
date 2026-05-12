'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from '@/components/SessionProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconCalendarEvent, IconUsers, IconFolder, IconSettings, IconCalendar, IconLogout } from '@tabler/icons-react';

const NAV_ITEMS = [
  { label: 'Absences', href: '/admin/absences', icon: <IconCalendarEvent size={18} /> },
  { label: 'Employees', href: '/admin/employees', icon: <IconUsers size={18} /> },
  { label: 'Projects', href: '/admin/projects', icon: <IconFolder size={18} /> },
  { label: 'Settings', href: '/admin/settings', icon: <IconSettings size={18} /> },
];

function AdminInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="p-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <IconCalendar size={16} />
            </div>
            <span className="font-bold text-sm text-slate-900">Absence Tracker</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-slate-400 font-medium">{session.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1"
            >
              <IconLogout size={14} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminInner>{children}</AdminInner>
    </SessionProvider>
  );
}
