import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useFeatures } from './hooks/useFeatures';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CvToolsPage from './pages/CvToolsPage';
import ProfilePage from './pages/ProfilePage';
import UploadCvPage from './pages/UploadCvPage';
import NewSessionPage from './pages/NewSessionPage';
import SessionDetailPage from './pages/SessionDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Interview-prep pages are hidden while the feature is switched off.
function JobPrepRoute({ children }: { children: React.ReactNode }) {
  const { jobPrep, isLoading } = useFeatures();
  if (isLoading) return null;
  return jobPrep ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

// Account pages are hidden while accounts are switched off; the no-account check on the landing page takes their place.
function AccountsRoute({ children }: { children: React.ReactNode }) {
  const { accounts } = useFeatures();
  return accounts ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { accounts, isLoading } = useFeatures();
  const { isAuthenticated: hasToken } = useAuth();
  // A token left over from before accounts were switched off doesn't count.
  const isAuthenticated = accounts && hasToken;

  if (isLoading) return null;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/check" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<AccountsRoute>{isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}</AccountsRoute>} />
      <Route path="/register" element={<AccountsRoute>{isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}</AccountsRoute>} />
      <Route path="/dashboard" element={<AccountsRoute><ProtectedRoute><DashboardPage /></ProtectedRoute></AccountsRoute>} />
      <Route path="/cv-tools" element={<AccountsRoute><ProtectedRoute><CvToolsPage /></ProtectedRoute></AccountsRoute>} />
      <Route path="/profile" element={<AccountsRoute><ProtectedRoute><ProfilePage /></ProtectedRoute></AccountsRoute>} />
      <Route path="/cv/upload" element={<AccountsRoute><ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute></AccountsRoute>} />
      <Route path="/sessions/new" element={<AccountsRoute><ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute></AccountsRoute>} />
      <Route path="/sessions/:id" element={<AccountsRoute><ProtectedRoute><JobPrepRoute><SessionDetailPage /></JobPrepRoute></ProtectedRoute></AccountsRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
