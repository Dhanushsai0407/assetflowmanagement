import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiTool, FiPlus, FiX, FiCheckCircle, 
  FiAlertCircle, FiClock, FiPlay, FiCheck, FiUser 
} from 'react-icons/fi';

const Maintenance = () => {
  const { user, API_URL } = useAuth();
  
  // Lists
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [requestModal, setRequestModal] = useState(false);
  const [processModal, setProcessModal] = useState({ open: false, request: null });

  // Forms
  const [requestForm, setRequestForm] = useState({ assetId: '', issueDescription: '', priority: 'Medium' });
  const [processForm, setProcessForm] = useState({ status: '', assignedTechnician: '', assetManagerNotes: '', resolutionNotes: '' });

  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqsRes, assetsRes] = await Promise.all([
        axios.get(`${API_URL}/maintenance`),
        axios.get(`${API_URL}/assets`)
      ]);
      if (reqsRes.data.success) setRequests(reqsRes.data.data);
      if (assetsRes.data.success) {
        setAssets(assetsRes.data.data);
      }
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve maintenance tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // ==========================================
  // Raise Maintenance Request
  // ==========================================
  const handleOpenRequest = () => {
    setRequestForm({ assetId: '', issueDescription: '', priority: 'Medium' });
    setRequestModal(true);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/maintenance`, requestForm);
      if (res.data.success) {
        triggerAlert('success', 'Maintenance request raised successfully.');
        setRequestModal(false);
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to file maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Process Ticket Status (Asset Managers / Admins)
  // ==========================================
  const handleOpenProcess = (req) => {
    setProcessForm({
      status: req.status,
      assignedTechnician: req.assignedTechnician || '',
      assetManagerNotes: req.assetManagerNotes || '',
      resolutionNotes: req.resolutionNotes || '',
    });
    setProcessModal({ open: true, request: req });
  };

  const submitProcess = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.put(`${API_URL}/maintenance/${processModal.request._id}`, processForm);
      if (res.data.success) {
        triggerAlert('success', `Ticket updated to state: ${processForm.status}`);
        setProcessModal({ open: false, request: null });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to update ticket status');
    } finally {
      setSubmitting(false);
    }
  };

  const isManager = ['Asset Manager', 'Admin'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Alert bar */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm max-w-2xl ${
          alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
        }`}>
          {alert.type === 'success' ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
            <FiTool className="text-primary-500" />
            <span>Equipment Maintenance Center</span>
          </h1>
          <p className="text-xs text-secondary-400">File issues, trace repairs timelines, and verify resolved statuses.</p>
        </div>

        <button
          onClick={handleOpenRequest}
          className="flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
        >
          <FiPlus className="w-4 h-4" />
          <span>Raise Request</span>
        </button>
      </div>

      {/* Tickets List Grid */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                <th className="p-4 font-semibold">Asset Tag</th>
                <th className="p-4 font-semibold">Asset Name</th>
                <th className="p-4 font-semibold">Issue / Description</th>
                <th className="p-4 font-semibold">Reported By</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Technician</th>
                {isManager && <th className="p-4 font-semibold">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 8 : 7} className="p-8 text-center text-secondary-400 italic">No maintenance tickets reported</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="text-secondary-700 dark:text-secondary-300">
                    <td className="p-4 font-bold text-primary-600">{req.asset?.assetTag}</td>
                    <td className="p-4 font-medium">{req.asset?.name}</td>
                    <td className="p-4 max-w-[180px] truncate" title={req.issueDescription}>{req.issueDescription}</td>
                    <td className="p-4">{req.reportedBy?.name || 'Anonymous'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                        req.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                        req.priority === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-900'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">{req.status}</td>
                    <td className="p-4">{req.assignedTechnician || <span className="text-secondary-400 italic">Unassigned</span>}</td>
                    {isManager && (
                      <td className="p-4">
                        <button
                          onClick={() => handleOpenProcess(req)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200"
                        >
                          Manage
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          RAISE REQUEST MODAL
          ========================================== */}
      {requestModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitRequest} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Raise Maintenance Request</h3>
              <button type="button" onClick={() => setRequestModal(false)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Select Asset</label>
              <select
                required
                value={requestForm.assetId}
                onChange={(e) => setRequestForm({ ...requestForm, assetId: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              >
                <option value="">Select Target Asset...</option>
                {assets.map((a) => (
                  <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Issue Priority</label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Description of the Issue</label>
              <textarea
                required
                value={requestForm.issueDescription}
                onChange={(e) => setRequestForm({ ...requestForm, issueDescription: e.target.value })}
                placeholder="Please describe the malfunction details clearly..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 h-24 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Submit Request
              </button>
              <button
                type="button" onClick={() => setRequestModal(false)}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MANAGE REQUEST WORKFLOW MODAL
          ========================================== */}
      {processModal.open && processModal.request && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitProcess} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Process Ticket: {processModal.request.asset?.assetTag}</h3>
              <button type="button" onClick={() => setProcessModal({ open: false, request: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-0.5 text-xs">
              <span className="text-secondary-400">Issue description:</span>
              <p className="font-medium text-secondary-800 dark:text-secondary-200">"{processModal.request.issueDescription}"</p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Update Status</label>
              <select
                value={processForm.status}
                onChange={(e) => setProcessForm({ ...processForm, status: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              >
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved (Flips Asset to Under Maintenance)</option>
                <option value="Rejected">Rejected</option>
                <option value="Technician Assigned">Technician Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved (Flips Asset to Available)</option>
                <option value="Closed">Closed & Locked</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Assign Technician</label>
              <input
                type="text"
                value={processForm.assignedTechnician}
                onChange={(e) => setProcessForm({ ...processForm, assignedTechnician: e.target.value })}
                placeholder="Technician Name or Vendor..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Asset Manager Notes</label>
              <textarea
                value={processForm.assetManagerNotes}
                onChange={(e) => setProcessForm({ ...processForm, assetManagerNotes: e.target.value })}
                placeholder="Internal notes..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 h-16 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Resolution Summary</label>
              <textarea
                value={processForm.resolutionNotes}
                onChange={(e) => setProcessForm({ ...processForm, resolutionNotes: e.target.value })}
                placeholder="What was fixed and parts replaced..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 h-16 resize-none"
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
                type="button" onClick={() => setProcessModal({ open: false, request: null })}
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

export default Maintenance;
