import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiLayers, FiPlus, FiDownload, FiSearch, 
  FiFileText, FiCalendar, FiUser, FiActivity, 
  FiEdit, FiTrash2, FiPrinter, FiX, FiCheckCircle, 
  FiAlertCircle, FiAlertTriangle 
} from 'react-icons/fi';

const AssetDirectory = () => {
  const { user, API_URL } = useAuth();
  
  // States
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals
  const [registerModal, setRegisterModal] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, assetId: null, assetData: null });
  const [allocateModal, setAllocateModal] = useState({ open: false, asset: null });
  const [transferModal, setTransferModal] = useState({ open: false, asset: null, holder: null });

  // Forms
  const [assetForm, setAssetForm] = useState({
    name: '', serialNumber: '', category: '', customCategoryName: '', department: '', customDepartmentName: '', location: '',
    acquisitionCost: 0, acquisitionDate: '', warrantyExpiration: '', vendor: '',
    condition: 'Excellent', bookable: false, customFieldsData: {}
  });

  const [locationPreset, setLocationPreset] = useState('');
  const [vendorPreset, setVendorPreset] = useState('');

  const [allocationForm, setAllocationForm] = useState({ employeeId: '', expectedReturnDate: '', notes: '', customEmployeeName: '', customEmployeeEmail: '' });
  const [transferForm, setTransferForm] = useState({ toUserId: '', reason: '', customToEmployeeName: '', customToEmployeeEmail: '' });
  
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load baseline values
  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, catsRes, deptsRes, dirRes] = await Promise.all([
        axios.get(`${API_URL}/assets?search=${search}&category=${selectedCat}&status=${selectedStatus}&department=${selectedDept}`),
        axios.get(`${API_URL}/org/categories`),
        axios.get(`${API_URL}/org/departments`),
        axios.get(`${API_URL}/auth/directory`)
      ]);
      if (assetsRes.data.success) setAssets(assetsRes.data.data);
      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
      if (dirRes.data.success) setEmployees(dirRes.data.data.filter(u => u.status === 'Active'));
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve asset data index');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCat, selectedStatus, selectedDept, API_URL]);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // Helper: Get custom field structures for selected category in registration form
  const getSelectedCatFields = () => {
    const cat = categories.find(c => c._id === assetForm.category);
    return cat ? cat.customFields : [];
  };

  // Handle asset registration form field edits
  const handleCustomFieldChange = (fieldName, val) => {
    setAssetForm({
      ...assetForm,
      customFieldsData: { ...assetForm.customFieldsData, [fieldName]: val }
    });
  };

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

  // ==========================================
  // Register Asset
  // ==========================================
  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Package dynamic form data
      const data = {
        ...assetForm,
        customData: JSON.stringify(assetForm.customFieldsData)
      };

      const res = await axios.post(`${API_URL}/assets`, data);
      if (res.data.success) {
        triggerAlert('success', 'Asset successfully registered into database');
        setRegisterModal(false);
        // Reset form
        setLocationPreset('');
        setVendorPreset('');
        setAssetForm({
          name: '', serialNumber: '', category: '', customCategoryName: '', department: '', customDepartmentName: '', location: '',
          acquisitionCost: 0, acquisitionDate: '', warrantyExpiration: '', vendor: '',
          condition: 'Excellent', bookable: false, customFieldsData: {}
        });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Asset registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Detail Modal & View History
  // ==========================================
  const openDetailModal = async (assetId) => {
    try {
      const res = await axios.get(`${API_URL}/assets/${assetId}`);
      if (res.data.success) {
        setDetailModal({ open: true, assetId, assetData: res.data.data });
      }
    } catch (err) {
      triggerAlert('error', 'Could not retrieve asset history trace');
    }
  };

  // ==========================================
  // Direct Allocation Flow
  // ==========================================
  const handleOpenAllocate = (asset) => {
    if (asset.status !== 'Available') {
      // Conflict rules logic: trigger double allocation block and load holder
      axios.post(`${API_URL}/allocations`, { assetId: asset._id })
        .catch((err) => {
          if (err.response?.data?.conflict) {
            setTransferModal({
              open: true,
              asset,
              holder: err.response.data.heldBy
            });
          }
        });
    } else {
      setAllocationForm({ employeeId: '', expectedReturnDate: '', notes: '', customEmployeeName: '', customEmployeeEmail: '' });
      setAllocateModal({ open: true, asset });
    }
  };

  const submitAllocation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        assetId: allocateModal.asset._id,
        employeeId: allocationForm.employeeId,
        customEmployeeName: allocationForm.customEmployeeName,
        customEmployeeEmail: allocationForm.customEmployeeEmail,
        expectedReturnDate: allocationForm.expectedReturnDate,
        notes: allocationForm.notes
      };
      const res = await axios.post(`${API_URL}/allocations`, data);
      if (res.data.success) {
        triggerAlert('success', `Asset allocated to employee successfully.`);
        setAllocateModal({ open: false, asset: null });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to allocate asset');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Direct Transfer Requests Flow
  // ==========================================
  const submitTransferRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        assetId: transferModal.asset._id,
        toUserId: transferForm.toUserId,
        customToEmployeeName: transferForm.customToEmployeeName,
        customToEmployeeEmail: transferForm.customToEmployeeEmail,
        reason: transferForm.reason
      };
      const res = await axios.post(`${API_URL}/allocations/transfers`, data);
      if (res.data.success) {
        triggerAlert('success', `Transfer request successfully routed to Admin/Asset Manager.`);
        setTransferModal({ open: false, asset: null, holder: null });
        setTransferForm({ toUserId: '', reason: '' });
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to submit transfer request');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Return Asset Flow
  // ==========================================
  const handleReturnAsset = async (assetId) => {
    try {
      // Find active allocation for this asset
      const allocationsRes = await axios.get(`${API_URL}/allocations`);
      const activeAlloc = (allocationsRes.data?.data || []).find(
        (a) => a.asset?._id === assetId && ['Active', 'Overdue'].includes(a.status)
      );

      if (!activeAlloc) {
        return triggerAlert('error', 'Active allocation record not found');
      }

      // Execute return
      const res = await axios.post(`${API_URL}/allocations/${activeAlloc._id}/return`, {
        returnConditionCheck: 'Excellent',
        returnNotes: 'Returned via asset directory direct trigger.'
      });

      if (res.data.success) {
        triggerAlert('success', 'Asset checked back in. Status reverted to Available.');
        fetchData();
        if (detailModal.open) {
          openDetailModal(detailModal.assetId); // Refresh history panel
        }
      }
    } catch (err) {
      triggerAlert('error', 'Failed to process return');
    }
  };

  // ==========================================
  // QR Print utility
  // ==========================================
  const handlePrintLabel = (asset) => {
    const printWindow = window.open('', '_blank', 'width=300,height=350');
    printWindow.document.write(`
      <div style="text-align: center; font-family: sans-serif; padding: 20px;">
        <h3>AssetFlow ERP</h3>
        <img src="${asset.qrCodeUrl}" style="width: 150px; height: 150px;" />
        <h4 style="margin: 5px 0;">${asset.name}</h4>
        <code style="font-weight: bold; font-size: 14px;">${asset.assetTag}</code>
        <p style="font-size: 10px; color: #555;">Location: ${asset.location}</p>
      </div>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ==========================================
  // CSV Export utility
  // ==========================================
  const handleExportCSV = () => {
    const headers = ['Asset Tag', 'Asset Name', 'Serial Number', 'Category', 'Department', 'Location', 'Cost', 'Condition', 'Status'];
    const rows = assets.map((a) => [
      a.assetTag,
      a.name,
      a.serialNumber || 'N/A',
      a.category?.name || 'N/A',
      a.department?.name || 'Unassigned',
      a.location,
      `$${a.acquisitionCost}`,
      a.condition,
      a.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assetflow_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm max-w-2xl ${
          alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
        }`}>
          {alert.type === 'success' ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Directory Title and Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white">
            Asset Inventory Directory
          </h1>
          <p className="text-xs text-secondary-400">Search, trace lifecycles, assign hardware, and print QR labels.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-750 text-secondary-800 dark:text-secondary-100 rounded-lg text-xs font-semibold border border-secondary-200/30 dark:border-secondary-700/30 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          {['Admin', 'Asset Manager'].includes(user?.role) && (
            <button
              onClick={() => setRegisterModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary-500/10 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span>Register Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Search Term</label>
          <div className="relative">
            <FiSearch className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-secondary-400 w-4 h-4 mt-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tag, serial or name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 placeholder-secondary-400"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Category</label>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 text-xs bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
          >
            <option value="">All Statuses</option>
            {['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'].map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs bg-secondary-50/50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table Display */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                <th className="p-4 font-semibold">Asset Tag</th>
                <th className="p-4 font-semibold">Asset Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Condition</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Allocations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
              {assets.map((asset) => (
                <tr key={asset._id} className="text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100/10 transition-colors">
                  <td className="p-4 font-bold text-primary-600">
                    <button onClick={() => openDetailModal(asset._id)} className="hover:underline text-left">
                      {asset.assetTag}
                    </button>
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="font-semibold block text-secondary-900 dark:text-white">{asset.name}</span>
                      <span className="text-[10px] text-secondary-400 block">{asset.serialNumber || 'No SN'}</span>
                    </div>
                  </td>
                  <td className="p-4">{asset.category?.name || asset.customCategoryName || 'Uncategorized'}</td>
                  <td className="p-4">{asset.location}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asset.condition === 'Excellent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                      asset.condition === 'Good' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                    }`}>
                      {asset.condition}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      asset.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      asset.status === 'Allocated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                      asset.status === 'Under Maintenance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {['Admin', 'Asset Manager'].includes(user?.role) && (
                        <button
                          onClick={() => handleOpenAllocate(asset)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                            asset.status === 'Available' 
                              ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm'
                              : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400'
                          }`}
                        >
                          {asset.status === 'Available' ? 'Allocate' : 'Transfer'}
                        </button>
                      )}
                      
                      {asset.status === 'Allocated' && ['Admin', 'Asset Manager'].includes(user?.role) && (
                        <button
                          onClick={() => handleReturnAsset(asset._id)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-700 dark:bg-secondary-900 dark:text-secondary-300 hover:bg-secondary-150 border border-secondary-200/50"
                        >
                          Check-in
                        </button>
                      )}

                      <button
                        onClick={() => handlePrintLabel(asset)}
                        className="p-1 rounded text-secondary-400 hover:text-slate-100 hover:bg-secondary-100 dark:hover:bg-secondary-850"
                        title="Print QR label"
                      >
                        <FiPrinter className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          REGISTER ASSET MODAL
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
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Category Name</label>
                  <input
                    type="text" required
                    value={assetForm.customCategoryName || ''}
                    onChange={(e) => setAssetForm({ ...assetForm, customCategoryName: e.target.value })}
                    placeholder="e.g. Virtual Reality Gear"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Department Scope</label>
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
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Register
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

      {/* ==========================================
          ASSET DETAIL & HISTORY MODAL
          ========================================== */}
      {detailModal.open && detailModal.assetData && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-secondary-900 dark:text-white">
                  Asset Details: {detailModal.assetData.asset?.assetTag}
                </h3>
              </div>
              <button type="button" onClick={() => setDetailModal({ open: false, assetId: null, assetData: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* QR and image panel */}
              <div className="flex flex-col items-center gap-4 text-center border-r border-secondary-100 dark:border-secondary-800/40 pr-6">
                <img src={detailModal.assetData.asset?.qrCodeUrl} className="w-36 h-36 bg-slate-100 rounded-lg p-2 border" />
                <button
                  onClick={() => handlePrintLabel(detailModal.assetData.asset)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 text-xs font-bold rounded-lg"
                >
                  <FiPrinter /> Print Label
                </button>
              </div>

              {/* Specifications details */}
              <div className="sm:col-span-2 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-secondary-900 dark:text-white">{detailModal.assetData.asset?.name}</h4>
                  <span className="text-xs text-secondary-400">Condition: <span className="font-semibold">{detailModal.assetData.asset?.condition}</span> • Status: <span className="font-semibold text-primary-500">{detailModal.assetData.asset?.status}</span></span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-secondary-400 font-medium block">Serial Number</span>
                    <span className="font-semibold">{detailModal.assetData.asset?.serialNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-secondary-400 font-medium block">Category</span>
                    <span className="font-semibold">{detailModal.assetData.asset?.category?.name || detailModal.assetData.asset?.customCategoryName || 'Uncategorized'}</span>
                  </div>
                  <div>
                    <span className="text-secondary-400 font-medium block">Location</span>
                    <span className="font-semibold">{detailModal.assetData.asset?.location}</span>
                  </div>
                  <div>
                    <span className="text-secondary-400 font-medium block">Department</span>
                    <span className="font-semibold">{detailModal.assetData.asset?.department?.name || detailModal.assetData.asset?.customDepartmentName || 'Corporate'}</span>
                  </div>
                  <div>
                    <span className="text-secondary-400 font-medium block">Acquisition Cost</span>
                    <span className="font-semibold">${detailModal.assetData.asset?.acquisitionCost}</span>
                  </div>
                  <div>
                    <span className="text-secondary-400 font-medium block">Acquisition Date</span>
                    <span className="font-semibold">{new Date(detailModal.assetData.asset?.acquisitionDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Custom Specs */}
                {detailModal.assetData.asset?.customData && Object.keys(detailModal.assetData.asset.customData).length > 0 && (
                  <div className="bg-secondary-50 dark:bg-secondary-950/20 p-3 rounded-lg space-y-1.5 text-xs">
                    <span className="text-[9px] uppercase font-bold text-secondary-400 block tracking-wider">Custom Fields Specifications</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(detailModal.assetData.asset.customData).map((key) => (
                        <div key={key}>
                          <span className="text-secondary-400 font-medium">{key}: </span>
                          <span className="font-semibold">{String(detailModal.assetData.asset.customData[key])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History Timelines */}
            <div className="border-t border-secondary-100 dark:border-secondary-800/40 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Allocation History */}
              <div className="space-y-3">
                <span className="font-bold text-secondary-800 dark:text-secondary-200 block border-b pb-2">Allocation Timeline</span>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {detailModal.assetData.history?.allocations?.length === 0 ? (
                    <span className="text-secondary-400 italic">No allocations logged</span>
                  ) : (
                    detailModal.assetData.history.allocations.map((alloc) => (
                      <div key={alloc._id} className="border-l-2 border-primary-500 pl-3 py-0.5 space-y-0.5">
                        <span className="font-semibold block">{alloc.allocatedTo?.name || alloc.customEmployeeName || 'Department Assignment'}</span>
                        <span className="text-[10px] text-secondary-400 block">
                          Assigned: {new Date(alloc.allocationDate).toLocaleDateString()} • Status: {alloc.status}
                        </span>
                        {alloc.notes && <p className="text-[10px] text-secondary-400 italic">"{alloc.notes}"</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Maintenance History */}
              <div className="space-y-3">
                <span className="font-bold text-secondary-800 dark:text-secondary-200 block border-b pb-2">Maintenance History</span>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {detailModal.assetData.history?.maintenance?.length === 0 ? (
                    <span className="text-secondary-400 italic">No maintenance tickets reported</span>
                  ) : (
                    detailModal.assetData.history.maintenance.map((maint) => (
                      <div key={maint._id} className="border-l-2 border-amber-500 pl-3 py-0.5 space-y-0.5">
                        <span className="font-semibold block">{maint.issueDescription}</span>
                        <span className="text-[10px] text-secondary-400 block">
                          Reported: {new Date(maint.createdAt).toLocaleDateString()} • Priority: {maint.priority} • Status: {maint.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ALLOCATE MODAL
          ========================================== */}
      {allocateModal.open && allocateModal.asset && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitAllocation} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Allocate: {allocateModal.asset.assetTag}</h3>
              <button type="button" onClick={() => setAllocateModal({ open: false, asset: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Assign To Employee</label>
              <select
                required
                value={allocationForm.employeeId}
                onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                ))}
                <option value="other">Other (Enter custom name...)</option>
              </select>
            </div>

            {allocationForm.employeeId === 'other' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Employee Name</label>
                  <input
                    type="text" required
                    value={allocationForm.customEmployeeName || ''}
                    onChange={(e) => setAllocationForm({ ...allocationForm, customEmployeeName: e.target.value })}
                    placeholder="e.g. John Miller"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Employee Email</label>
                  <input
                    type="email" required
                    value={allocationForm.customEmployeeEmail || ''}
                    onChange={(e) => setAllocationForm({ ...allocationForm, customEmployeeEmail: e.target.value })}
                    placeholder="e.g. john.miller@partner.com"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Expected Return Date</label>
              <input
                type="date"
                value={allocationForm.expectedReturnDate}
                onChange={(e) => setAllocationForm({ ...allocationForm, expectedReturnDate: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Notes</label>
              <textarea
                value={allocationForm.notes}
                onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                placeholder="Details of assignment context..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 h-20 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Assign
              </button>
              <button
                type="button" onClick={() => setAllocateModal({ open: false, asset: null })}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          CONFLICT DOUBLE-ALLOCATION / TRANSFER MODAL
          ========================================== */}
      {transferModal.open && transferModal.asset && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitTransferRequest} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Double Allocation Conflict</h3>
              <button type="button" onClick={() => setTransferModal({ open: false, asset: null, holder: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
              <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-bold block mb-0.5">Asset is currently allocated.</span>
                <span>Currently held by <span className="font-bold">{transferModal.holder?.name || 'department head'}</span> ({transferModal.holder?.email}). You cannot double-assign. Please raise a Transfer Request instead.</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Target Recipient Employee</label>
              <select
                required
                value={transferForm.toUserId}
                onChange={(e) => setTransferForm({ ...transferForm, toUserId: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              >
                <option value="">Select Target Employee</option>
                {employees
                  .filter((emp) => emp._id !== transferModal.holder?.id)
                  .map((emp) => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                  ))}
                <option value="other">Other (Enter custom name...)</option>
              </select>
            </div>

            {transferForm.toUserId === 'other' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Recipient Name</label>
                  <input
                    type="text" required
                    value={transferForm.customToEmployeeName || ''}
                    onChange={(e) => setTransferForm({ ...transferForm, customToEmployeeName: e.target.value })}
                    placeholder="e.g. John Miller"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Recipient Email</label>
                  <input
                    type="email" required
                    value={transferForm.customToEmployeeEmail || ''}
                    onChange={(e) => setTransferForm({ ...transferForm, customToEmployeeEmail: e.target.value })}
                    placeholder="e.g. john.miller@partner.com"
                    className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Transfer Reason</label>
              <textarea
                required
                value={transferForm.reason}
                onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                placeholder="Provide reason for corporate handover..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 h-20 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Request Transfer
              </button>
              <button
                type="button" onClick={() => setTransferModal({ open: false, asset: null, holder: null })}
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

export default AssetDirectory;
