import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiCheckSquare, FiPlus, FiX, FiCheck, 
  FiAlertTriangle, FiCheckCircle, FiAlertCircle, 
  FiChevronRight, FiLock, FiBookOpen 
} from 'react-icons/fi';

const Audits = () => {
  const { user, API_URL } = useAuth();

  // Data lists
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inspector View
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [discrepancies, setDiscrepancies] = useState({ verified: 0, missing: 0, damaged: 0, pending: 0 });

  // Creation Form
  const [createModal, setCreateModal] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    title: '', scopeDepartment: '', scopeLocation: '', startDate: '', endDate: '', auditors: []
  });

  // Verification Item state
  const [verifyModal, setVerifyModal] = useState({ open: false, item: null });
  const [verifyForm, setVerifyForm] = useState({ status: 'Verified', notes: '' });

  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cycleRes, deptRes, dirRes] = await Promise.all([
        axios.get(`${API_URL}/audits`),
        axios.get(`${API_URL}/org/departments`),
        axios.get(`${API_URL}/auth/directory`)
      ]);
      if (cycleRes.data.success) setCycles(cycleRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (dirRes.data.success) setEmployees(dirRes.data.data.filter(u => u.status === 'Active'));
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve audits directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  // Load audit items when a cycle is selected
  const fetchAuditItems = async (cycleId) => {
    try {
      const res = await axios.get(`${API_URL}/audits/${cycleId}/items`);
      if (res.data.success) {
        setAuditItems(res.data.data);
        
        // Calculate stats
        const stats = { verified: 0, missing: 0, damaged: 0, pending: 0 };
        res.data.data.forEach((item) => {
          if (item.status === 'Verified') stats.verified++;
          else if (item.status === 'Missing') stats.missing++;
          else if (item.status === 'Damaged') stats.damaged++;
          else stats.pending++;
        });
        setDiscrepancies(stats);
      }
    } catch (err) {
      triggerAlert('error', 'Failed to load items in this cycle');
    }
  };

  const selectCycle = (cycle) => {
    setSelectedCycle(cycle);
    fetchAuditItems(cycle._id);
  };

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleAuditorSelect = (auditorId) => {
    const current = [...cycleForm.auditors];
    const idx = current.indexOf(auditorId);
    if (idx === -1) {
      current.push(auditorId);
    } else {
      current.splice(idx, 1);
    }
    setCycleForm({ ...cycleForm, auditors: current });
  };

  // ==========================================
  // Save Cycle
  // ==========================================
  const handleSaveCycle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/audits`, cycleForm);
      if (res.data.success) {
        triggerAlert('success', 'Audit cycle draft created.');
        setCreateModal(false);
        setCycleForm({ title: '', scopeDepartment: '', scopeLocation: '', startDate: '', endDate: '', auditors: [] });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to create audit cycle');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Start Audit
  // ==========================================
  const handleStartCycle = async (cycleId) => {
    try {
      const res = await axios.put(`${API_URL}/audits/${cycleId}/start`);
      if (res.data.success) {
        triggerAlert('success', `Cycle activated. Scoped ${res.data.itemsCount} assets into review tasks.`);
        fetchData();
        if (selectedCycle?._id === cycleId) {
          selectCycle({ ...selectedCycle, status: 'Active' });
        }
      }
    } catch (err) {
      triggerAlert('error', 'Failed to activate cycle');
    }
  };

  // ==========================================
  // Verify Item (Auditor checklist checkout)
  // ==========================================
  const handleOpenVerify = (item) => {
    setVerifyForm({ status: item.status === 'Pending' ? 'Verified' : item.status, notes: item.notes || '' });
    setVerifyModal({ open: true, item });
  };

  const submitVerifyItem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.put(`${API_URL}/audits/items/${verifyModal.item._id}`, verifyForm);
      if (res.data.success) {
        triggerAlert('success', 'Asset verification details logged.');
        setVerifyModal({ open: false, item: null });
        fetchAuditItems(selectedCycle._id);
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to write verification checklist');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Close Cycle (Auto-Discrepancy updates)
  // ==========================================
  const handleCloseCycle = async (cycleId) => {
    if (!window.confirm('Are you sure you want to close this cycle? This will lock findings and permanently flip Missing items to Lost.')) return;
    try {
      const res = await axios.put(`${API_URL}/audits/${cycleId}/close`);
      if (res.data.success) {
        triggerAlert('success', `Audit cycle closed. Missing items set to Lost.`);
        fetchData();
        setSelectedCycle(null);
      }
    } catch (err) {
      triggerAlert('error', 'Failed to close cycle');
    }
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
            <FiCheckSquare className="text-primary-500" />
            <span>Structured Verification Audits</span>
          </h1>
          <p className="text-xs text-secondary-400 font-medium">Verify physical assets conditions, check-out discrepancy lists, and lock audit cycles.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Audit Cycle</span>
          </button>
        )}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cycles listings */}
        <div className="space-y-4 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider block">Audit Campaigns</span>
          <div className="space-y-3.5">
            {cycles.length === 0 ? (
              <div className="p-6 text-center text-xs text-secondary-400 italic bg-white dark:bg-secondary-900 rounded-xl border border-secondary-200/50 dark:border-secondary-800/40">
                No audit campaigns configured.
              </div>
            ) : (
              cycles.map((cy) => (
                <div
                  key={cy._id}
                  onClick={() => selectCycle(cy)}
                  className={`p-5 glass-card rounded-xl cursor-pointer hover:border-primary-500/55 transition-all flex flex-col gap-3 border ${
                    selectedCycle?._id === cy._id ? 'border-primary-500 dark:border-primary-500/60 shadow-md ring-1 ring-primary-500/20' : 'border-secondary-200/40'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xs text-secondary-800 dark:text-secondary-100">{cy.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                      cy.status === 'Completed' ? 'bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400' :
                      cy.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-900'
                    }`}>
                      {cy.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-secondary-400 space-y-1">
                    <div>Department: <span className="font-medium text-secondary-650 dark:text-secondary-350">{cy.scopeDepartment?.name || 'All'}</span></div>
                    <div>Location: <span className="font-medium text-secondary-650 dark:text-secondary-350">{cy.scopeLocation || 'All'}</span></div>
                    <div>Ends: <span className="font-semibold">{new Date(cy.endDate).toLocaleDateString()}</span></div>
                  </div>

                  <div className="flex items-center justify-between border-t border-secondary-100 dark:border-secondary-800/20 pt-3">
                    {cy.status === 'Draft' && isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartCycle(cy._id); }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow-sm"
                      >
                        Activate Cycle
                      </button>
                    )}

                    {cy.status === 'Active' && isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCloseCycle(cy._id); }}
                        className="px-3 py-1 bg-red-650 hover:bg-red-600 text-white rounded text-[10px] font-bold shadow-sm flex items-center gap-1"
                      >
                        <FiLock /> Close & Lock
                      </button>
                    )}

                    <span className="text-[10px] font-bold text-primary-500 flex items-center gap-1 ml-auto">
                      <span>Inspect</span> <FiChevronRight />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected cycle items list & discrepancies */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedCycle ? (
            <div className="h-64 glass-card rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-6 text-secondary-400">
              <FiBookOpen className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs font-semibold">Select an audit campaign from the list to display details.</span>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-xl space-y-6">
              {/* Stats overview banner */}
              <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
                <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Review Board: {selectedCycle.title}</h3>
                <span className="text-[10px] font-bold text-secondary-400">Scope: {selectedCycle.scopeLocation || 'Company-wide'}</span>
              </div>

              {/* Counts metrics */}
              <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 bg-secondary-50 dark:bg-secondary-950/20 rounded-lg">
                  <span className="text-[10px] text-secondary-400 block font-bold">Verified</span>
                  <span className="text-base font-extrabold text-emerald-600 mt-1 block">{discrepancies.verified}</span>
                </div>
                <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                  <span className="text-[10px] text-red-500 block font-bold">Missing</span>
                  <span className="text-base font-extrabold text-red-500 mt-1 block">{discrepancies.missing}</span>
                </div>
                <div className="p-3 bg-orange-500/5 rounded-lg border border-orange-500/10">
                  <span className="text-[10px] text-orange-500 block font-bold">Damaged</span>
                  <span className="text-base font-extrabold text-orange-500 mt-1 block">{discrepancies.damaged}</span>
                </div>
                <div className="p-3 bg-secondary-100 dark:bg-secondary-800/40 rounded-lg">
                  <span className="text-[10px] text-secondary-400 block font-bold">Pending</span>
                  <span className="text-base font-extrabold text-secondary-650 dark:text-secondary-200 mt-1 block">{discrepancies.pending}</span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider block">Verification checklist items</span>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                        <th className="py-2 font-semibold">Asset</th>
                        <th className="py-2 font-semibold">Location</th>
                        <th className="py-2 font-semibold">Auditor Log</th>
                        <th className="py-2 font-semibold">Audit Check</th>
                        {selectedCycle.status === 'Active' && <th className="py-2 font-semibold">Verify</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800/20">
                      {auditItems.map((item) => (
                        <tr key={item._id} className="text-secondary-700 dark:text-secondary-300">
                          <td className="py-3">
                            <span className="font-semibold block text-secondary-900 dark:text-white">{item.asset?.name}</span>
                            <code className="text-[10px] text-primary-500">{item.asset?.assetTag}</code>
                          </td>
                          <td className="py-3">{item.asset?.location}</td>
                          <td className="py-3">
                            {item.auditor ? (
                              <div>
                                <span className="font-medium block">{item.auditor.name}</span>
                                {item.notes && <span className="text-[10px] text-secondary-400 italic">"{item.notes}"</span>}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="py-3 font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'Verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                              item.status === 'Missing' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                              item.status === 'Damaged' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                              'bg-secondary-100 text-secondary-500 dark:bg-secondary-850'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          {selectedCycle.status === 'Active' && (
                            <td className="py-3">
                              <button
                                onClick={() => handleOpenVerify(item)}
                                className="px-2 py-0.5 bg-primary-600 hover:bg-primary-500 text-white rounded text-[10px] font-bold"
                              >
                                Log Check
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          CREATE AUDIT CYCLE DRAFT MODAL
          ========================================== */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCycle} className="w-full max-w-lg bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Create Audit Campaign Draft</h3>
              <button type="button" onClick={() => setCreateModal(false)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Audit Title / Name</label>
              <input
                type="text" required
                value={cycleForm.title}
                onChange={(e) => setCycleForm({ ...cycleForm, title: e.target.value })}
                placeholder="Q3 Hardware Audit Cycle"
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Scope Department</label>
                <select
                  value={cycleForm.scopeDepartment}
                  onChange={(e) => setCycleForm({ ...cycleForm, scopeDepartment: e.target.value })}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                >
                  <option value="">All Departments (No filter)</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Scope Location</label>
                <input
                  type="text"
                  value={cycleForm.scopeLocation}
                  onChange={(e) => setCycleForm({ ...cycleForm, scopeLocation: e.target.value })}
                  placeholder="SF Office (No filter)"
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Start Date</label>
                <input
                  type="date" required
                  value={cycleForm.startDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">End Date</label>
                <input
                  type="date" required
                  value={cycleForm.endDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                />
              </div>
            </div>

            {/* Select Auditors Checklist */}
            <div className="border border-secondary-200 dark:border-secondary-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide block border-b pb-1">Assign Auditors</span>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto text-xs pr-1">
                {employees.map((emp) => (
                  <label key={emp._id} className="flex items-center gap-2 cursor-pointer py-1 font-medium text-secondary-750">
                    <input
                      type="checkbox"
                      checked={cycleForm.auditors.includes(emp._id)}
                      onChange={() => handleAuditorSelect(emp._id)}
                      className="w-3.5 h-3.5"
                    />
                    <span className="truncate">{emp.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Create Draft
              </button>
              <button
                type="button" onClick={() => setCreateModal(false)}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          LOG AUDIT ITEM VERIFICATION MODAL
          ========================================== */}
      {verifyModal.open && verifyModal.item && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitVerifyItem} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Log Asset Verification check</h3>
              <button type="button" onClick={() => setVerifyModal({ open: false, item: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-0.5 text-xs text-secondary-650 dark:text-secondary-350">
              <span>Checking asset:</span>
              <span className="font-bold text-secondary-900 dark:text-white block">{verifyModal.item.asset?.name} ({verifyModal.item.asset?.assetTag})</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Verification status</label>
              <select
                value={verifyForm.status}
                onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              >
                <option value="Verified">Verified & In-Place</option>
                <option value="Missing">Missing (Discrepancy)</option>
                <option value="Damaged">Damaged (Needs repair)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Auditor Notes</label>
              <textarea
                value={verifyForm.notes}
                onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
                placeholder="Include verification details or notes about missing/damaged state..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 h-24 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Save
              </button>
              <button
                type="button" onClick={() => setVerifyModal({ open: false, item: null })}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 rounded-lg text-xs font-semibold"
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

export default Audits;
