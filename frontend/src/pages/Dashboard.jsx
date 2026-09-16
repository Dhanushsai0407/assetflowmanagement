import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  FiLayers, FiUserCheck, FiCalendar, 
  FiTool, FiAlertTriangle, FiArrowUpRight, 
  FiPlus, FiRepeat, FiCheckSquare, FiClock, FiX
} from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, API_URL } = useAuth();
  const navigate = useNavigate();

  // Registration modal states
  const [registerModal, setRegisterModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: '', serialNumber: '', category: '', customCategoryName: '', department: '', customDepartmentName: '', location: '',
    acquisitionCost: 0, acquisitionDate: '', warrantyExpiration: '', vendor: '',
    condition: 'Excellent', bookable: false, customFieldsData: {}
  });
  const [locationPreset, setLocationPreset] = useState('');
  const [vendorPreset, setVendorPreset] = useState('');
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submittingAsset, setSubmittingAsset] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/dashboard`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [API_URL]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [catRes, deptRes] = await Promise.all([
          axios.get(`${API_URL}/org/categories`),
          axios.get(`${API_URL}/org/departments`)
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (deptRes.data.success) setDepartments(deptRes.data.data.filter(d => d.status === 'Active'));
      } catch (err) {
        console.error('Failed to fetch modal details', err);
      }
    };
    fetchDropdownData();
  }, [API_URL]);

  const handleLocationPresetChange = (val) => {
    setLocationPreset(val);
    if (val !== 'other') {
      setAssetForm(prev => ({ ...prev, location: val }));
    } else {
      setAssetForm(prev => ({ ...prev, location: '' }));
    }
  };

  const handleVendorPresetChange = (val) => {
    setVendorPreset(val);
    if (val !== 'other') {
      setAssetForm(prev => ({ ...prev, vendor: val }));
    } else {
      setAssetForm(prev => ({ ...prev, vendor: '' }));
    }
  };

  const getSelectedCatFields = () => {
    const cat = categories.find(c => c._id === assetForm.category);
    return cat ? cat.customFields : [];
  };

  const handleCustomFieldChange = (fieldName, val) => {
    setAssetForm({
      ...assetForm,
      customFieldsData: { ...assetForm.customFieldsData, [fieldName]: val }
    });
  };

  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    setSubmittingAsset(true);
    try {
      const data = {
        ...assetForm,
        customData: JSON.stringify(assetForm.customFieldsData)
      };

      const res = await axios.post(`${API_URL}/assets`, data);
      if (res.data.success) {
        setRegisterModal(false);
        // Reset form
        setLocationPreset('');
        setVendorPreset('');
        setAssetForm({
          name: '', serialNumber: '', category: '', customCategoryName: '', department: '', customDepartmentName: '', location: '',
          acquisitionCost: 0, acquisitionDate: '', warrantyExpiration: '', vendor: '',
          condition: 'Excellent', bookable: false, customFieldsData: {}
        });
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register asset');
    } finally {
      setSubmittingAsset(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/4 bg-secondary-200 dark:bg-secondary-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
          <div className="h-80 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const charts = stats?.charts || {};
  const recent = stats?.recent || {};

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Role permissions checking for Quick Actions
  const isAdmin = user?.role === 'Admin';
  const isAssetMgr = user?.role === 'Asset Manager';
  const isDeptHead = user?.role === 'Department Head';

  const cards = [
    { title: 'Assets Available', count: kpis.assetsAvailable, icon: FiLayers, color: 'text-emerald-500 bg-emerald-500/10' },
    { title: 'Assets Allocated', count: kpis.assetsAllocated, icon: FiUserCheck, color: 'text-primary-500 bg-primary-500/10' },
    { title: 'Maintenance Today', count: kpis.assetsMaintenance, icon: FiTool, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Active Bookings', count: kpis.activeBookings, icon: FiCalendar, color: 'text-purple-500 bg-purple-500/10' },
  ];

  const alerts = [
    { title: 'Overdue Returns', count: kpis.overdueReturns, link: '/assets', color: 'text-red-500 border-red-500/20 bg-red-500/5' },
    { title: 'Upcoming Returns (7d)', count: kpis.upcomingReturns, link: '/assets', color: 'text-blue-500 border-blue-500/20 bg-blue-500/5' },
    { title: 'Pending Transfers', count: kpis.pendingTransfers, link: '/assets', color: 'text-orange-500 border-orange-500/20 bg-orange-500/5' },
    { title: 'Pending Maintenance', count: kpis.pendingMaintenance, link: '/maintenance', color: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5' },
  ];

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-secondary-900 dark:text-white">
            Operational Hub
          </h1>
          <p className="text-sm text-secondary-400">
            Real-time snapshot for <span className="font-semibold text-primary-500">{user?.name}</span> ({user?.role})
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary-500/10 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>

          <Link
            to="/bookings"
            className="flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-750 text-secondary-800 dark:text-secondary-100 rounded-lg text-xs font-semibold border border-secondary-200/30 dark:border-secondary-700/30 transition-all"
          >
            <FiCalendar className="w-4 h-4 text-primary-500" />
            <span>Book Resource</span>
          </Link>

          <Link
            to="/maintenance"
            className="flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-750 text-secondary-800 dark:text-secondary-100 rounded-lg text-xs font-semibold border border-secondary-200/30 dark:border-secondary-700/30 transition-all"
          >
            <FiTool className="w-4 h-4 text-amber-500" />
            <span>Raise Maintenance</span>
          </Link>

          <Link
            to="/audits"
            className="flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-750 text-secondary-800 dark:text-secondary-100 rounded-lg text-xs font-semibold border border-secondary-200/30 dark:border-secondary-700/30 transition-all"
          >
            <FiCheckSquare className="w-4 h-4 text-emerald-500" />
            <span>Create Audit</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="glass-card p-6 rounded-xl flex items-center justify-between relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-secondary-400 block">{card.title}</span>
              <span className="text-3xl font-bold text-secondary-900 dark:text-white block font-sans tracking-tight">
                {card.count || 0}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} group-hover:scale-105 transition-transform duration-300`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Critical Status Alerts & Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {alerts.map((alert, i) => (
          <Link
            key={i}
            to={alert.link}
            className={`p-4 border rounded-xl flex items-center justify-between hover:scale-[1.01] transition-all duration-200 ${alert.color}`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-secondary-500 dark:text-secondary-400 block">{alert.title}</span>
              <span className="text-lg font-extrabold block font-sans tracking-tight">{alert.count || 0}</span>
            </div>
            <FiArrowUpRight className="w-4 h-4 opacity-60" />
          </Link>
        ))}
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Split Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-tight text-secondary-900 dark:text-secondary-200">
              Inventory Allocation by Category
            </h3>
            <span className="text-[10px] bg-secondary-100 dark:bg-secondary-800 text-secondary-500 font-bold px-2 py-0.5 rounded uppercase">
              Units count
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.byCategory || []}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40}>
                  {(charts.byCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-sm tracking-tight text-secondary-900 dark:text-secondary-200">
            Lifecycle Status Distribution
          </h3>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.byStatus || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts.byStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-secondary-900 dark:text-white font-sans">
                {kpis.assetsAvailable + kpis.assetsAllocated + kpis.assetsReserved + kpis.assetsMaintenance || 0}
              </span>
              <span className="text-[10px] text-secondary-400 font-semibold uppercase tracking-wider">Scanned</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(charts.byStatus || []).filter(e => e.value > 0).map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-secondary-600 dark:text-secondary-400 truncate">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Allocations and Maintenance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Allocations */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-tight text-secondary-900 dark:text-secondary-200">
              Recent Allocations
            </h3>
            <Link to="/assets" className="text-xs text-primary-600 font-semibold flex items-center gap-1">
              <span>View All</span>
              <FiArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-secondary-100 dark:border-secondary-800 text-secondary-400">
                  <th className="py-2.5">Asset Tag</th>
                  <th className="py-2.5">Asset Name</th>
                  <th className="py-2.5">Allocated To</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100/50 dark:divide-secondary-800/30">
                {(recent.allocations || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-secondary-400">No recent allocations</td>
                  </tr>
                ) : (
                  recent.allocations.map((alloc) => (
                    <tr key={alloc._id} className="text-secondary-700 dark:text-secondary-300">
                      <td className="py-3 font-semibold text-primary-600">{alloc.asset?.assetTag}</td>
                      <td className="py-3">{alloc.asset?.name}</td>
                      <td className="py-3 font-medium">{alloc.allocatedTo?.name || 'Dept Assignment'}</td>
                      <td className="py-3 text-secondary-400">{new Date(alloc.allocationDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-tight text-secondary-900 dark:text-secondary-200">
              Active Repairs / Maintenance
            </h3>
            <Link to="/maintenance" className="text-xs text-primary-600 font-semibold flex items-center gap-1">
              <span>View All</span>
              <FiArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-secondary-100 dark:border-secondary-800 text-secondary-400">
                  <th className="py-2.5">Asset Tag</th>
                  <th className="py-2.5">Issue</th>
                  <th className="py-2.5">Priority</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100/50 dark:divide-secondary-800/30">
                {(recent.maintenance || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-secondary-400">No active maintenance issues</td>
                  </tr>
                ) : (
                  recent.maintenance.map((maint) => (
                    <tr key={maint._id} className="text-secondary-700 dark:text-secondary-300">
                      <td className="py-3 font-semibold text-primary-600">{maint.asset?.assetTag}</td>
                      <td className="py-3 truncate max-w-[120px]">{maint.issueDescription}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          maint.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                          maint.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}>
                          {maint.priority}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{maint.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==========================================
          REGISTER NEW ASSET MODAL
          ========================================== */}
      {registerModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterAsset} className="w-full max-w-2xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Register Physical Asset</h3>
              <button type="button" onClick={() => setRegisterModal(false)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Asset Name</label>
                <input
                  type="text" required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="Dell XPS 15 Laptop"
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Serial Number</label>
                <input
                  type="text"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  placeholder="SN-XXXXXX"
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Category</label>
                <select
                  required
                  value={assetForm.category}
                  onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value, customFieldsData: {} })}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                  <option value="other">Other (Enter manually...)</option>
                </select>
              </div>

              {assetForm.category === 'other' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Category Name</label>
                  <input
                    type="text" required
                    value={assetForm.customCategoryName}
                    onChange={(e) => setAssetForm({ ...assetForm, customCategoryName: e.target.value })}
                    placeholder="e.g. Server, Projector"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Scope / Assigned Department</label>
                <select
                  value={assetForm.department}
                  onChange={(e) => setAssetForm({ ...assetForm, department: e.target.value })}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                >
                  <option value="">Company-wide / Corporate</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                  <option value="other">Other / Custom Department</option>
                </select>
              </div>

              {assetForm.department === 'other' && (
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Department Name</label>
                  <input
                    type="text" required
                    value={assetForm.customDepartmentName || ''}
                    onChange={(e) => setAssetForm({ ...assetForm, customDepartmentName: e.target.value })}
                    placeholder="e.g. Research & Incubation"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Location / Floor</label>
                <select
                  required
                  value={locationPreset}
                  onChange={(e) => handleLocationPresetChange(e.target.value)}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                >
                  <option value="">-- Choose Location --</option>
                  <option value="HQ - Floor 1">HQ - Floor 1</option>
                  <option value="HQ - Floor 2">HQ - Floor 2</option>
                  <option value="HQ - Floor 3">HQ - Floor 3</option>
                  <option value="SF Office - Room 302">SF Office - Room 302</option>
                  <option value="Chicago Office - Room 105">Chicago Office - Room 105</option>
                  <option value="other">Other (Enter manually...)</option>
                </select>
              </div>

              {locationPreset === 'other' && (
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Location / Floor</label>
                  <input
                    type="text" required
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    placeholder="e.g. London Office - Suite 4A"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Vendor</label>
                <select
                  value={vendorPreset}
                  onChange={(e) => handleVendorPresetChange(e.target.value)}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                >
                  <option value="">-- Choose Vendor --</option>
                  <option value="Apple">Apple</option>
                  <option value="Dell">Dell</option>
                  <option value="Lenovo">Lenovo</option>
                  <option value="Logitech">Logitech</option>
                  <option value="Herman Miller">Herman Miller</option>
                  <option value="Cisco">Cisco Systems</option>
                  <option value="other">Other (Enter manually...)</option>
                </select>
              </div>

              {vendorPreset === 'other' && (
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Vendor Name</label>
                  <input
                    type="text" required
                    value={assetForm.vendor}
                    onChange={(e) => setAssetForm({ ...assetForm, vendor: e.target.value })}
                    placeholder="e.g. Custom supplier"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Acquisition Cost ($)</label>
                <input
                  type="number"
                  value={assetForm.acquisitionCost}
                  onChange={(e) => setAssetForm({ ...assetForm, acquisitionCost: Number(e.target.value) })}
                  placeholder="0.00"
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>
            </div>

            {/* Category Custom Fields rendering dynamically */}
            {getSelectedCatFields().length > 0 && (
              <div className="border border-secondary-200 dark:border-secondary-800 rounded-xl p-4 space-y-4">
                <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide block border-b pb-2">Category Custom Fields</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSelectedCatFields().map((field) => (
                    <div key={field._id} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-secondary-500 capitalize">{field.name} {field.required && '*'}</label>
                      <input
                        type={field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : field.type === 'Boolean' ? 'checkbox' : 'text'}
                        required={field.required}
                        value={assetForm.customFieldsData[field.name] || ''}
                        onChange={(e) => handleCustomFieldChange(field.name, field.type === 'Boolean' ? e.target.checked : e.target.value)}
                        className={`px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 ${field.type === 'Boolean' ? 'w-5 h-5 align-middle self-start' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 text-xs font-bold text-secondary-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assetForm.bookable}
                  onChange={(e) => setAssetForm({ ...assetForm, bookable: e.target.checked })}
                  className="w-4.5 h-4.5 rounded"
                />
                <span>Flag as Shared Bookable resource (for Conference rooms, vehicles, etc.)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submittingAsset}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                {submittingAsset ? 'Registering...' : 'Register'}
              </button>
              <button
                type="button" onClick={() => setRegisterModal(false)}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
