import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiUser, FiMail, FiPhone, FiLock, 
  FiCheckCircle, FiAlertCircle, FiSettings, 
  FiMoon, FiSun 
} from 'react-icons/fi';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  
  // Forms
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await updateProfile({ name, phone });
    setSubmitting(false);
    if (res.success) {
      triggerAlert('success', 'Profile details updated successfully.');
    } else {
      triggerAlert('error', res.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return triggerAlert('error', 'Passwords do not match');
    }
    setSubmitting(true);
    const res = await updateProfile({ password });
    setSubmitting(false);
    if (res.success) {
      triggerAlert('success', 'Password changed successfully.');
      setPassword('');
      setConfirmPassword('');
    } else {
      triggerAlert('error', res.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Alert Header Banner */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm max-w-2xl ${
          alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
        }`}>
          {alert.type === 'success' ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
          <FiUser className="text-primary-500" />
          <span>My Profile Settings</span>
        </h1>
        <p className="text-xs text-secondary-400">Manage user configuration fields and password credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Summary Details */}
        <div className="md:col-span-1 glass-card p-6 rounded-xl flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 text-3xl border border-primary-200/50">
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="font-bold text-base text-secondary-900 dark:text-white">{user?.name}</h3>
            <span className="text-xs text-primary-500 font-semibold tracking-wide uppercase">{user?.role}</span>
          </div>

          <div className="w-full space-y-3.5 pt-4 border-t border-secondary-100 dark:border-secondary-800/40 text-left text-xs">
            <div>
              <span className="text-[10px] text-secondary-400 uppercase font-semibold">Corporate Email</span>
              <span className="font-medium block text-secondary-800 dark:text-secondary-100 mt-0.5">{user?.email}</span>
            </div>
            <div>
              <span className="text-[10px] text-secondary-400 uppercase font-semibold">Department</span>
              <span className="font-medium block text-secondary-800 dark:text-secondary-100 mt-0.5">{user?.department?.name || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Right Cards: forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Form A: Profile Information */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-secondary-900 dark:text-secondary-200 border-b pb-2 flex items-center gap-2">
              <FiSettings />
              <span>Personal Information</span>
            </h3>
            
            <form onSubmit={handleUpdateDetails} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text" required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 text-xs bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                    <FiPhone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={submitting}
                className="sm:col-span-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg shadow-sm w-fit self-end mt-2"
              >
                Save Details
              </button>
            </form>
          </div>

          {/* Form B: Security settings */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-secondary-900 dark:text-secondary-200 border-b pb-2 flex items-center gap-2">
              <FiLock />
              <span>Change Password</span>
            </h3>
            
            <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">New Password</label>
                <input
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-2 text-xs bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password" required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-2 text-xs bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                />
              </div>

              <button
                type="submit" disabled={submitting}
                className="sm:col-span-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg shadow-sm w-fit self-end mt-2"
              >
                Reset Password
              </button>
            </form>
          </div>

          {/* Preferences */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-sm text-secondary-900 dark:text-secondary-200 border-b pb-2 flex items-center gap-2">
              {darkMode ? <FiSun /> : <FiMoon />}
              <span>Interface Preferences</span>
            </h3>
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold block">Select theme preference</span>
                <span className="text-secondary-400">Toggle dark / light visuals across application pages</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-1.5 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-lg font-bold"
              >
                {darkMode ? 'Light Theme' : 'Dark Theme'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
