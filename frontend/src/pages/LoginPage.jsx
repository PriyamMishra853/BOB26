import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

const DEMO_ACCOUNTS = [
  { label: 'Clinic Assistant', email: 'assistant@clinic.org', password: 'Assist@123' },
  { label: 'Doctor', email: 'doctor@clinic.org', password: 'Doctor@123' },
  { label: 'Administrator', email: 'admin@clinic.org', password: 'Admin@123' }
];

const HOME_BY_ROLE = {
  DOCTOR: '/doctor/queue',
  ADMIN: '/admin/dashboard',
  CLINIC_ASSISTANT: '/assistant/dashboard'
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { loginUser, loading, loginWithGoogle, completeGoogleSignIn } = useAuth();
  const navigate = useNavigate();

  // If we just returned from the Google OAuth redirect, finish the sign-in
  useEffect(() => {
    (async () => {
      try {
        const userProfile = await completeGoogleSignIn();
        if (userProfile) {
          navigate(HOME_BY_ROLE[userProfile.role] || '/assistant/dashboard');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Google sign-in is not available. Ask your administrator to enable the Google provider in Supabase Auth.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userProfile = await loginUser(email, password);
      navigate(HOME_BY_ROLE[userProfile.role] || '/assistant/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign-in failed. Check your email and password.');
    }
  };

  // One-click demo sign-in (backed by the backend's demo-mode accounts)
  const loginDemo = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    try {
      const userProfile = await loginUser(account.email, account.password);
      navigate(HOME_BY_ROLE[userProfile.role] || '/assistant/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Demo sign-in failed. Is the backend running?');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">

        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Staff Sign In</h2>
          <p className="text-xs text-slate-500">
            Sign in with your registered email and password. Your dashboard is determined by your registered role.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@clinic.org"
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Your password"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying credentials...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google sign-in */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">or</span></div>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold text-sm border border-slate-300 shadow-sm transition-colors flex items-center justify-center gap-2.5"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Demo accounts (one-click sign in)</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => loginDemo(acc)}
                className="px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-60 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          New staff member?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Create a staff account
          </Link>
        </div>
      </div>
    </div>
  );
}
