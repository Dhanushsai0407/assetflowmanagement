import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiActivity, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ActivityLogs = () => {
  const { API_URL } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/logs?search=${search}&moduleFilter=${moduleFilter}&page=${page}&limit=20`
      );
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, moduleFilter, page, API_URL]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
          <FiActivity className="text-primary-500" />
          <span>Corporate Audit Trails</span>
        </h1>
        <p className="text-xs text-secondary-400">Complete historical logging of admin, manager, and employee actions.</p>
      </div>

      {/* Filter toolbar */}
      <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row gap-3.5 items-end justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:max-w-xl">
          {/* Search */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Search Log Details</span>
            <div className="relative">
              <FiSearch className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-400 w-4 h-4 mt-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search action or notes..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 placeholder-secondary-400"
              />
            </div>
          </div>

          {/* Module Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Module</span>
            <select
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 text-xs bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
            >
              <option value="">All Modules</option>
              {['Auth', 'Directory', 'Assets', 'Allocations', 'Transfers', 'Bookings', 'Maintenance', 'Audits', 'Database'].map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-secondary-400 animate-pulse">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Module</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Details</th>
                  <th className="p-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-secondary-400 italic">No activity logs recorded</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="text-secondary-750 dark:text-secondary-300">
                      <td className="p-4 font-medium text-secondary-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {log.user ? (
                          <div>
                            <span className="font-semibold block text-secondary-900 dark:text-white">{log.user.name}</span>
                            <span className="text-[10px] text-primary-500 font-semibold uppercase tracking-wider">{log.user.role}</span>
                          </div>
                        ) : (
                          <span className="text-secondary-400 italic">System Process</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold">{log.module}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800 font-mono text-[10px] text-secondary-700 dark:text-secondary-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 max-w-[200px] truncate" title={log.details}>{log.details}</td>
                      <td className="p-4 font-mono text-secondary-400">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary-50 dark:bg-secondary-850 hover:bg-secondary-150 disabled:opacity-50 text-xs font-semibold rounded-lg"
          >
            <FiChevronLeft /> Previous
          </button>
          <span className="text-xs text-secondary-500 font-medium">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary-50 dark:bg-secondary-850 hover:bg-secondary-150 disabled:opacity-50 text-xs font-semibold rounded-lg"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
