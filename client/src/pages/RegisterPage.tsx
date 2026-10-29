import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, ArrowRight, Briefcase } from 'lucide-react';
import { authApi, getApiErrorMessage } from '../services/api';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');

  const { mutate: registerMutate, isPending: registerPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => { login(data.accessToken, data.user); navigate('/dashboard'); },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const { mutate: googleMutate, isPending: googlePending } = useMutation({
    mutationFn: (idToken: string) => authApi.googleLogin(idToken),
    onSuccess: (data) => { login(data.accessToken, data.user); navigate('/dashboard'); },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const isPending = registerPending || googlePending;

  const inputCls =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
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
            <h1 className="text-2xl font-bold text-gray-900">Let's get you interview-ready</h1>
            <p className="mt-1 text-sm text-gray-500">Start preparing. Upgrade when you're ready.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-xl shadow-gray-100 p-8">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Google Sign-Up */}
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
              text="signup_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or register with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setError(''); registerMutate(form); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className={`${inputCls} pl-10`}
                />
              </div>
              <div>
                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
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
                minLength={8}
                placeholder="Password (min 8 chars, 1 uppercase, 1 digit)"
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
              {registerPending ? <Spinner size="sm" className="text-white" /> : <ArrowRight className="h-4 w-4" />}
              Create account
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-400">
            By signing up you agree to our terms of service.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
