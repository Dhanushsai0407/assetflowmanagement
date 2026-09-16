import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiLayers, FiUser, FiCalendar, FiActivity, FiX } from 'react-icons/fi';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { API_URL } = useAuth();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Perform multi-indexes search
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        // Fetch index datasets
        const [assetsRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/assets?search=${query}`),
          axios.get(`${API_URL}/auth/directory`)
        ]);

        const assets = (assetsRes.data?.data || []).map((a) => ({
          id: a._id,
          title: `${a.name} (${a.assetTag})`,
          subtitle: `Category: ${a.category?.name || 'Asset'} • Status: ${a.status}`,
          type: 'asset',
          path: `/assets`,
          icon: FiLayers,
        }));

        const users = (usersRes.data?.data || [])
          .filter(
            (u) =>
              u.name.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase())
          )
          .map((u) => ({
            id: u._id,
            title: u.name,
            subtitle: `Email: ${u.email} • Role: ${u.role}`,
            type: 'employee',
            path: `/org-setup`,
            icon: FiUser,
          }));

        // Quick page link suggestions
        const pages = [
          { title: 'Go to Dashboard', subtitle: 'View main statistics and KPI cards', type: 'page', path: '/', icon: FiCalendar },
          { title: 'Go to Asset Directory', subtitle: 'Manage company hardware and resources', type: 'page', path: '/assets', icon: FiLayers },
          { title: 'Go to Resource Booking', subtitle: 'Book meeting rooms, cars, or equipment', type: 'page', path: '/bookings', icon: FiCalendar },
          { title: 'Go to Maintenance Requests', subtitle: 'Raise issues and inspect repairs', type: 'page', path: '/maintenance', icon: FiActivity },
        ].filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

        setResults([...pages, ...assets, ...users].slice(0, 10));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, API_URL]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    onClose();
    navigate(item.path);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]">
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <FiSearch className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
            placeholder="Type command, asset tag, page, or employee name..."
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">Searching indexes...</div>
          ) : query && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No matching search records found.</div>
          ) : !query ? (
            <div className="p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                Quick Commands
              </span>
              <div className="space-y-1">
                {[
                  { title: 'Asset Registry', path: '/assets', icon: FiLayers },
                  { title: 'Book Resource', path: '/bookings', icon: FiCalendar },
                  { title: 'Raise Repair request', path: '/maintenance', icon: FiActivity },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-sm font-medium transition-all"
                  >
                    <item.icon className="w-4 h-4 text-primary-500" />
                    <span>Go to {item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-slate-700 dark:text-slate-300 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <item.icon className="w-4.5 h-4.5 text-slate-400 group-hover:text-primary-500 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-sm font-medium block text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 select-none">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footnotes */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search directories, assets, tags</span>
          <div className="flex items-center gap-1.5 font-medium">
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
