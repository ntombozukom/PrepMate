import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, User, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import { Logo, LogoMark } from './Logo';

/**
 * The one sidebar (desktop) and top bar (mobile) for every signed-in page, so Dashboard,
 * CV Tools and Profile always match the landing page's logo and each other.
 */

const itemBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';

function NavLink({ to, icon, label, collapsed, badge }: {
  to: string; icon: React.ReactNode; label: string; collapsed: boolean; badge?: number;
}) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`${itemBase} ${collapsed ? 'justify-center' : ''} ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600">
          {badge}
        </span>
      )}
    </Link>
  );
}

function InterviewPrepItem({ collapsed, sessionCount }: { collapsed: boolean; sessionCount?: number }) {
  const { jobPrep } = useFeatures();
  const icon = <BookOpen className="h-4 w-4 shrink-0" />;
  if (jobPrep) {
    return <NavLink to="/dashboard" icon={icon} label="Sessions" collapsed={collapsed} badge={sessionCount || undefined} />;
  }
  return (
    <div title="Interview prep: coming soon"
      className={`${itemBase} cursor-default text-slate-400 ${collapsed ? 'justify-center' : ''}`}>
      {icon}
      {!collapsed && <span className="flex-1 truncate">Interview prep</span>}
      {!collapsed && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">Soon</span>}
    </div>
  );
}

export function AppSidebar({ sessionCount }: { sessionCount?: number }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const initial = user?.firstName?.[0]?.toUpperCase() ?? '?';
  const onProfile = pathname === '/profile';

  return (
    <aside className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className={`flex items-center border-b border-slate-100 h-16 ${collapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
        {collapsed ? <LogoMark to="/dashboard" /> : <Logo to="/dashboard" size="sm" />}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} title="Collapse sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>}
        <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4 shrink-0" />} label="Dashboard" collapsed={collapsed} />
        <NavLink to="/cv-tools" icon={<Wrench className="h-4 w-4 shrink-0" />} label="CV Tools" collapsed={collapsed} />
        <InterviewPrepItem collapsed={collapsed} sessionCount={sessionCount} />
      </nav>

      <div className="border-t border-slate-100 px-2 py-3 space-y-1">
        <Link to="/profile" aria-current={onProfile ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${collapsed ? 'justify-center' : ''} ${
            onProfile ? 'bg-indigo-50' : 'hover:bg-slate-50'
          }`}>
          <div className={`h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
            onProfile ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
        </Link>
        <button onClick={() => { logout(); navigate('/'); }} title="Sign out"
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} title="Expand sidebar"
            className="w-full flex items-center justify-center rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

/** Mobile top bar: logo plus the same destinations as icons. */
export function AppMobileBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const link = (to: string, label: string, icon: React.ReactNode) => (
    <Link to={to} title={label} aria-label={label} aria-current={pathname === to ? 'page' : undefined}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        pathname === to ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
      }`}>
      {icon}
    </Link>
  );

  return (
    <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <Logo to="/dashboard" size="sm" />
      <div className="flex items-center gap-1">
        {link('/dashboard', 'Dashboard', <LayoutDashboard className="h-4 w-4" />)}
        {link('/cv-tools', 'CV Tools', <Wrench className="h-4 w-4" />)}
        {link('/profile', 'Profile', <User className="h-4 w-4" />)}
        <button onClick={() => { logout(); navigate('/'); }} title="Sign out" aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
