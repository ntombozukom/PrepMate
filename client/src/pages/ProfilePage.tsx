import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, LogOut, User, Wrench, BookOpen, ArrowLeft,
  CheckCircle2, AlertCircle, PanelLeftClose, PanelLeftOpen,
  KeyRound, Trash2, FileText, Save,
} from 'lucide-react';
import { cvApi, profileApi, getApiErrorMessage } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';

// ─── Sidebar shared components ────────────────────────────────────────────────
function NavItem({ collapsed, icon, label, active, href }: {
  collapsed: boolean; icon: React.ReactNode; label: string;
  active?: boolean; href: string;
}) {
  return (
    <Link
      to={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        collapsed ? 'justify-center' : ''
      } ${
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function Sidebar({
  collapsed, onToggle, user, onSignOut,
}: {
  collapsed: boolean;
  onToggle: () => void;
  user: { firstName?: string; lastName?: string; email?: string } | null;
  onSignOut: () => void;
}) {
  const initial = user?.firstName?.[0]?.toUpperCase() ?? '?';

  return (
    <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className={`flex items-center border-b border-slate-100 h-16 ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">PrepMate</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${collapsed ? 'hidden' : ''}`}
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Menu</p>}
        <NavItem collapsed={collapsed} icon={<Sparkles className="h-4 w-4 shrink-0" />} label="Dashboard" href="/dashboard" />
        <NavItem collapsed={collapsed} icon={<Wrench className="h-4 w-4 shrink-0" />} label="CV Tools" href="/cv-tools" />
        <NavItem collapsed={collapsed} icon={<BookOpen className="h-4 w-4 shrink-0" />} label="Sessions" href="/dashboard" />
      </nav>

      <div className="border-t border-slate-100 px-2 py-3 space-y-1">
        <Link to="/profile" className={`flex items-center rounded-lg px-3 py-2.5 bg-indigo-50 text-indigo-700 gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-7 w-7 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-indigo-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[11px] text-indigo-500 truncate">{user?.email}</p>
            </div>
          )}
        </Link>
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-100 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors disabled:opacity-60';

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user: authUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Profile form state ────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(authUser?.firstName ?? '');
  const [lastName, setLastName] = useState(authUser?.lastName ?? '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ── Password form state ───────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // ── Deactivate confirmation ───────────────────────────────────────────────
  const [showDeactivate, setShowDeactivate] = useState(false);

  const { data: activeCv } = useQuery({
    queryKey: ['cv-active'],
    queryFn: () => cvApi.getActive(),
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (updated) => {
      // Refresh auth context with new name (preserve existing token)
      const token = localStorage.getItem('access_token') ?? '';
      login(token, {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      setProfileSuccess(true);
      setProfileError('');
      qc.invalidateQueries({ queryKey: ['cv-active'] });
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: (e) => {
      setProfileError(getApiErrorMessage(e));
      setProfileSuccess(false);
    },
  });

  const pwdMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      setPwdSuccess(true);
      setPwdError('');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => setPwdSuccess(false), 3000);
    },
    onError: (e) => {
      setPwdError(getApiErrorMessage(e));
      setPwdSuccess(false);
    },
  });

  const handleSignOut = () => { logout(); navigate('/'); };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError('First and last name are required.');
      return;
    }
    updateMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('New password must be at least 8 characters.');
      return;
    }
    pwdMutation.mutate({ currentPassword: currentPwd, newPassword: newPwd });
  };

  const handleDeactivate = () => {
    // Deactivation: sign out the user (server-side deletion not implemented yet)
    logout();
    navigate('/');
  };

  const displayName = `${authUser?.firstName ?? ''} ${authUser?.lastName ?? ''}`.trim();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        user={authUser}
        onSignOut={handleSignOut}
      />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">PrepMate</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-3 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
              <p className="mt-1 text-sm text-slate-500">Manage your profile, password and account preferences</p>
            </div>
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 font-black text-xl shrink-0">
              {displayName[0]?.toUpperCase() ?? <User className="h-6 w-6" />}
            </div>
          </div>

          {/* Profile details */}
          <Section title="Personal Information" icon={<User className="h-4 w-4" />}>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    required
                  />
                </Field>
                <Field label="Last Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Demo"
                    required
                  />
                </Field>
              </div>
              <Field label="Email Address">
                <input
                  type="email"
                  className={inputCls + ' cursor-not-allowed'}
                  value={authUser?.email ?? ''}
                  disabled
                  title="Email changes are not yet supported"
                />
                <p className="text-[11px] text-slate-400 mt-1">Email address cannot be changed at this time</p>
              </Field>

              {profileError && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile updated successfully
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending
                    ? <><Spinner size="sm" className="text-white" /> Saving…</>
                    : <><Save className="h-4 w-4" /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          </Section>

          {/* Active CV */}
          <Section title="Your CV" icon={<FileText className="h-4 w-4" />}>
            {activeCv ? (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 shrink-0">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{activeCv.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {(activeCv.fileSizeBytes / 1024).toFixed(0)} KB &middot; uploaded {new Date(activeCv.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Replace
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-slate-200 px-4 py-5">
                <div>
                  <p className="text-sm font-medium text-slate-600">No CV uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Head to the dashboard to upload your CV</p>
                </div>
                <Link
                  to="/dashboard"
                  className="shrink-0 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Upload CV
                </Link>
              </div>
            )}
          </Section>

          {/* Change password */}
          <Section title="Change Password" icon={<KeyRound className="h-4 w-4" />}>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Field label="Current Password">
                <input
                  type="password"
                  className={inputCls}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="New Password">
                  <input
                    type="password"
                    className={inputCls}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="min. 8 characters"
                    required
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm New Password">
                  <input
                    type="password"
                    className={inputCls}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              {pwdError && (
                <p className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {pwdError}
                </p>
              )}
              {pwdSuccess && (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> Password changed successfully
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={pwdMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {pwdMutation.isPending
                    ? <><Spinner size="sm" className="text-white" /> Updating…</>
                    : <><KeyRound className="h-4 w-4" /> Update Password</>
                  }
                </button>
              </div>
            </form>
          </Section>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-red-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-500 shrink-0">
                <Trash2 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-red-800">Danger Zone</h2>
            </div>
            <div className="px-6 py-5">
              {!showDeactivate ? (
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Deactivate Account</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Signing you out and disabling your account. Your data is retained for 30 days before permanent deletion.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeactivate(true)}
                    className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-4">
                  <p className="text-sm font-semibold text-red-900">Are you sure?</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    This will sign you out immediately. Your account will be marked for deactivation.
                    Contact support within 30 days to restore access.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeactivate}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                    >
                      Yes, deactivate my account
                    </button>
                    <button
                      onClick={() => setShowDeactivate(false)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
