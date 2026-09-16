import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FiTrendingUp, FiDownload, FiAlertTriangle, FiLayers, FiCalendar } from 'react-icons/fi';

const Reports = () => {
  const { API_URL } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reports/analytics`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/4 bg-secondary-200 dark:bg-secondary-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
          <div className="h-80 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const utilization = data?.utilization || {};
  const heatmap = data?.bookingHeatmap || [];
  const maintByCategory = data?.maintenanceByCategory || [];
  const retiring = data?.retiringAssets || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
            <FiTrendingUp className="text-primary-500" />
            <span>Reports & System Analytics</span>
          </h1>
          <p className="text-xs text-secondary-400">Export utilization indices, check category maintenance loads, and audit retiring hardware.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-secondary-400 block tracking-wider">Asset Utilization Index</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-secondary-900 dark:text-white font-sans">{utilization.utilizationRate || 0}%</span>
            <span className="text-xs text-secondary-400">Allocated vs. Scanned</span>
          </div>
          <div className="w-full bg-secondary-100 dark:bg-secondary-800 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-primary-600 h-full rounded-full transition-all duration-500" style={{ width: `${utilization.utilizationRate || 0}%` }}></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-secondary-400 block tracking-wider">Total Scanned Assets</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-secondary-900 dark:text-white font-sans">{utilization.totalAssets || 0}</span>
            <span className="text-xs text-secondary-400">Units in service</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-secondary-400 block tracking-wider">Active Assignments</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-secondary-900 dark:text-white font-sans">{utilization.allocated || 0}</span>
            <span className="text-xs text-secondary-400">Held by Employees</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap of bookings */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-sm tracking-tight text-secondary-900 dark:text-secondary-200 flex items-center gap-1.5">
            <FiCalendar className="text-primary-500" />
            <span>Resource Booking Heatmap (Peak hours)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.1} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance frequency */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-sm tracking-tight text-secondary-900 dark:text-secondary-200 flex items-center gap-1.5">
            <FiLayers className="text-amber-500" />
            <span>Maintenance Frequency by Category</span>
          </h3>
          <div className="h-64">
            {maintByCategory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-secondary-400 italic">No tickets reported yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" opacity={0.1} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Assets Facing Retirement */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-secondary-900 dark:text-secondary-200 flex items-center gap-2">
          <FiAlertTriangle className="text-amber-500" />
          <span>Retirement & Decommission Candidates (Condition: Poor)</span>
        </h2>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                  <th className="p-4 font-semibold">Asset Tag</th>
                  <th className="p-4 font-semibold">Asset Name</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Cost</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Location</th>
                  <th className="p-4 font-semibold">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
                {retiring.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-secondary-400 italic">No assets currently marked as decommissioning candidates</td>
                  </tr>
                ) : (
                  retiring.map((a) => (
                    <tr key={a._id} className="text-secondary-700 dark:text-secondary-300">
                      <td className="p-4 font-bold text-red-500">{a.assetTag}</td>
                      <td className="p-4 font-semibold text-secondary-900 dark:text-white">{a.name}</td>
                      <td className="p-4">{a.category?.name}</td>
                      <td className="p-4">${a.acquisitionCost}</td>
                      <td className="p-4">{a.department?.name || 'Corporate'}</td>
                      <td className="p-4">{a.location}</td>
                      <td className="p-4 font-bold text-red-500">{a.condition}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
