import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiPhone, FiGrid, FiAlertCircle } from 'react-icons/fi';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Employee',
    department: '',
    customDepartmentName: '',
    password: '',
    confirmPassword: '',
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { signup, API_URL } = useAuth();
  const navigate = useNavigate();

  // Load active departments for signup selection
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await axios.get(`${API_URL}/org/departments`);
        if (res.data.success) {
          setDepartments(res.data.data.filter((d) => d.status === 'Active'));
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepts();
  }, [API_URL]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setSubmitting(true);
    const { confirmPassword, ...signupData } = formData;
    
    if (signupData.department && signupData.department.startsWith('preset_')) {
      const presetName = signupData.department.replace('preset_', '');
      signupData.department = 'other';
      signupData.customDepartmentName = presetName;
    }

    const res = await signup(signupData);
    setSubmitting(false);

    if (res.success) {
      setSuccess('Account created successfully!');
      setTimeout(() => navigate('/'), 1500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#090D16] linear-grid p-6">
      <div className="w-full max-w-lg p-8 glass-card rounded-2xl flex flex-col gap-5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl"></div>

        {/* Brand logo header */}
        <div className="flex flex-col items-center text-center gap-1">
          <h2 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white">
            Create Employee Account
          </h2>
          <p className="text-xs text-secondary-400 font-medium">
            Join the AssetFlow platform directory
          </p>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <span>{success}</span>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiUser className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Corporate Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiMail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiPhone className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Account Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiUser className="w-4 h-4" />
              </span>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all appearance-none"
              >
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
                <option value="Department Head">Department Head</option>
                <option value="Asset Manager">Asset Manager</option>
              </select>
            </div>
          </div>

          {/* Department Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Department
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiGrid className="w-4 h-4" />
              </span>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all appearance-none"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
                {/* Fallback sample presets if database is empty or for quick selection */}
                <option disabled>-- Sample Presets --</option>
                <option value="preset_Engineering">Engineering (ENG)</option>
                <option value="preset_Human Resources">Human Resources (HR)</option>
                <option value="preset_Finance">Finance (FIN)</option>
                <option value="preset_IT Support">IT & Tech (IT)</option>
                <option value="preset_Marketing">Marketing (MKT)</option>
                <option value="other">Other (Enter manually...)</option>
              </select>
            </div>
          </div>

          {formData.department === 'other' && (
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
                Custom Department Name
              </label>
              <input
                type="text"
                name="customDepartmentName"
                required
                value={formData.customDepartmentName || ''}
                onChange={handleChange}
                placeholder="e.g. Sales, Marketing, Research"
                className="w-full px-3.5 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary-400">
                <FiLock className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 bg-secondary-50/50 dark:bg-secondary-950/30 border border-secondary-200 dark:border-secondary-800 rounded-lg text-sm text-secondary-800 dark:text-secondary-100 placeholder-secondary-400 outline-none focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 w-full mt-2 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 outline-none transition-all flex items-center justify-center"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-secondary-400">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 font-semibold">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
