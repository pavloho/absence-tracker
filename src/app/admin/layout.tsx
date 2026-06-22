'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from '@/components/SessionProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IconCalendarEvent, IconUsers, IconFolder, IconSettings, IconCalendar, IconLogout, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from '@tabler/icons-react';

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('admin-sidebar-collapsed') === '1');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin-sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  };

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
      <aside className={`bg-white border-r border-slate-100 flex flex-col fixed inset-y-0 left-0 z-20 transition-[width] duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        <div className={`p-3 border-b border-slate-100 flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5 min-w-0 px-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
                <IconCalendar size={16} />
              </div>
              <span className="font-bold text-sm text-slate-900 truncate">Absence Tracker</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            {collapsed ? <IconLayoutSidebarLeftExpand size={18} /> : <IconLayoutSidebarLeftCollapse size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  collapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          {collapsed ? (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign out"
              aria-label="Sign out"
              className="w-full h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <IconLogout size={16} />
            </button>
          ) : (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-slate-400 font-medium truncate">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <IconLogout size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className={`flex-1 min-w-0 p-8 transition-[margin] duration-200 ${collapsed ? 'ml-16' : 'ml-60'}`}>{children}</main>
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
