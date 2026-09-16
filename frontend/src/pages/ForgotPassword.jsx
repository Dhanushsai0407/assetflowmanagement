import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { API_URL } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      if (res.data.success) {
        setSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#090D16] linear-grid p-6">
      <div className="w-full max-w-md p-8 glass-card rounded-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center gap-1">
          <h2 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white">
            Recover Account
          </h2>
          <p className="text-xs text-secondary-400 font-medium">
            Reset password details for your profile
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <FiAlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
            <FiCheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-500" />
            <div>
              <span className="font-bold block mb-0.5">Reset Triggered!</span>
              <span>{success}</span>
            </div>
          </div>
        )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-semibold shadow-md focus:outline-none transition-all flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-secondary-400">
          Remembered password?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
