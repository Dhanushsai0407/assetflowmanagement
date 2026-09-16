import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiBell, FiChevronRight, FiUser } from 'react-icons/fi';
import CommandPalette from './CommandPalette';

const Navbar = () => {
  const location = useLocation();
  const { user, API_URL } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Trigger search with Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch unread notification counts periodically
  useEffect(() => {
    if (!user) return;
    const fetchNotificationCount = async () => {
      try {
        const res = await axios.get(`${API_URL}/notifications`);
        if (res.data.success) {
          const unread = res.data.data.filter((n) => n.status === 'Unread').length;
          setUnreadNotifications(unread);
        }
      } catch (err) {
        console.error('Notification counts fetch failed:', err);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [user, API_URL]);

  // Breadcrumbs assembly
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    if (pathnames.length === 0) {
      return (
        <span className="text-secondary-400 font-medium text-sm">Dashboard</span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Link to="/" className="text-secondary-400 hover:text-primary-600 transition-colors">
          Home
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = value.replace('-', ' ');

          return (
            <div key={to} className="flex items-center gap-1.5 capitalize">
              <FiChevronRight className="w-3.5 h-3.5 text-secondary-400" />
              {isLast ? (
                <span className="text-secondary-800 dark:text-secondary-200">{label}</span>
              ) : (
                <Link to={to} className="text-secondary-400 hover:text-primary-600 transition-colors">
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <header className="h-16 border-b border-secondary-200/50 dark:border-secondary-800/40 px-8 flex items-center justify-between sticky top-0 bg-white/70 dark:bg-[#090D16]/60 backdrop-blur-md z-20">
      {/* Breadcrumbs */}
      <div>{generateBreadcrumbs()}</div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Mock Search Trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-3 px-3 py-1.5 bg-secondary-100/50 dark:bg-secondary-800/30 hover:bg-secondary-200/40 dark:hover:bg-secondary-800/60 border border-secondary-200/30 dark:border-secondary-800/30 rounded-lg text-secondary-400 text-xs w-48 text-left transition-all"
        >
          <FiSearch className="w-4 h-4 shrink-0" />
          <span className="grow">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-secondary-400 bg-secondary-200 dark:bg-secondary-800 border border-secondary-300 dark:border-secondary-700 rounded shadow-sm leading-none select-none">
            Ctrl K
          </kbd>
        </button>

        {/* Notifications Shortcut Link */}
        <Link
          to="/notifications"
          className="p-2 text-secondary-500 hover:text-primary-500 rounded-lg hover:bg-secondary-100/50 dark:hover:bg-secondary-800/40 transition-all relative"
        >
          <FiBell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-[#090D16] text-[9px] text-white flex items-center justify-center font-bold">
              {unreadNotifications}
            </span>
          )}
        </Link>

        {/* Mini profile avatar */}
        <Link
          to="/profile"
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100/50 dark:hover:bg-secondary-800/40 transition-all text-secondary-600 dark:text-secondary-300"
        >
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center font-semibold text-primary-600 dark:text-primary-400 text-xs border border-primary-200/50 dark:border-primary-800/40">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
};

export default Navbar;
