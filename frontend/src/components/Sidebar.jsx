import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiGrid, FiCpu, FiLayers, FiCalendar, 
  FiSettings, FiActivity, FiLogOut, FiMoon, 
  FiSun, FiCheckSquare, FiAlertCircle, FiTrendingUp, 
  FiUsers, FiBell 
} from 'react-icons/fi';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Base items visible to everyone
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: FiGrid },
    { name: 'Asset Directory', path: '/assets', icon: FiLayers },
    { name: 'Resource Booking', path: '/bookings', icon: FiCalendar },
    { name: 'Maintenance', path: '/maintenance', icon: FiAlertCircle },
    { name: 'Asset Allocation', path: '/allocations', icon: FiUsers },
    { name: 'Asset Audits', path: '/audits', icon: FiCheckSquare },
    { name: 'Org Setup', path: '/org-setup', icon: FiSettings },
    { name: 'Reports & Analytics', path: '/reports', icon: FiTrendingUp },
    { name: 'Activity Logs', path: '/logs', icon: FiActivity }
  ];

  return (
    <aside className="w-64 glass-card border-r border-secondary-200/50 dark:border-secondary-800/40 h-screen fixed left-0 top-0 flex flex-col justify-between z-30 transition-all duration-300">
      <div>
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 px-6 py-6 border-b border-secondary-100/50 dark:border-secondary-800/20">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-500/20">
            A
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              AssetFlow
            </h1>
            <span className="text-[10px] text-secondary-400 font-semibold tracking-wider uppercase block -mt-1">
              Enterprise ERP
            </span>
          </div>
        </div>

        {/* User Badge */}
        <div className="px-6 py-4 border-b border-secondary-100/50 dark:border-secondary-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center font-bold text-secondary-600 dark:text-secondary-300 border border-secondary-200/60 dark:border-secondary-700/60">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-secondary-800 dark:text-secondary-200 truncate">
                {user?.name}
              </h4>
              <p className="text-[11px] text-primary-600 dark:text-primary-400 font-medium capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 shadow-sm border-l-2 border-primary-600'
                    : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100/50 dark:hover:bg-secondary-800/30 hover:text-secondary-900 dark:hover:text-secondary-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-4 border-t border-secondary-100/50 dark:border-secondary-800/20 space-y-2">
        {/* Notifications Shortcut */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'
                : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100/50 dark:hover:bg-secondary-800/30'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <FiBell className="w-5 h-5" />
            <span>Alerts</span>
          </div>
        </NavLink>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100/50 dark:hover:bg-secondary-800/30 transition-all text-left"
        >
          {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-left"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
