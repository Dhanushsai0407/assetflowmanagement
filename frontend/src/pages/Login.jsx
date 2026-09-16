import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#090D16] linear-grid p-6">
      <div className="w-full max-w-md p-8 glass-card rounded-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl"></div>

        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary-500/30">
            A
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-white mt-2">
            Sign in to AssetFlow
          </h2>
          <p className="text-xs text-secondary-400 font-medium">
            Centralized Asset & Resource ERP Platform
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <FiAlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">
              Corporate Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-400">
                <FiMail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">
                Account Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-primary-600 hover:text-primary-500 font-semibold"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 focus:outline-none transition-all flex items-center justify-center"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Tip */}
        <div className="p-3 rounded-lg bg-primary-500/5 border border-primary-500/10 text-[10px] text-secondary-500 dark:text-secondary-400 leading-normal">
          <span className="font-bold text-primary-600 dark:text-primary-400 block mb-0.5">Demo Admin Access:</span>
          Email: <code className="font-semibold text-secondary-800 dark:text-slate-100">admin@assetflow.com</code> / Pass: <code className="font-semibold text-secondary-800 dark:text-slate-100">AdminPassword123!</code>
        </div>

        {/* Links */}
        <div className="text-center text-xs text-secondary-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 hover:text-primary-500 font-semibold">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
