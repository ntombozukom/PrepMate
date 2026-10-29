import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, ArrowRight, Briefcase } from 'lucide-react';
import { authApi, getApiErrorMessage } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const { mutate: loginMutate, isPending: loginPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => { login(data.accessToken, data.user); navigate('/dashboard'); },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const { mutate: googleMutate, isPending: googlePending } = useMutation({
    mutationFn: (idToken: string) => authApi.googleLogin(idToken),
    onSuccess: (data) => { login(data.accessToken, data.user); navigate('/dashboard'); },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const isPending = loginPending || googlePending;

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PrepMate</span>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="mt-1 text-sm text-gray-500">Ready to nail that interview?</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-100 p-8">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Google Sign-In — provides a real id_token via credentialResponse.credential */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                setError('');
                if (credentialResponse.credential) {
                  googleMutate(credentialResponse.credential);
                }
              }}
              onError={() => setError('Google sign-in failed. Please try again.')}
              width="368"
              text="signin_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setError(''); loginMutate(form); }}
            className="space-y-4"
          >
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={`${inputCls} pl-10`}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`${inputCls} pl-10`}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-md shadow-indigo-100"
            >
              {loginPending ? <Spinner size="sm" className="text-white" /> : <ArrowRight className="h-4 w-4" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
