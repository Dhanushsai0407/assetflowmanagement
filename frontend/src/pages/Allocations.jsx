import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiUsers, FiLayers, FiRepeat, FiCheck, FiX, 
  FiClock, FiAlertTriangle, FiAlertCircle, FiCheckCircle 
} from 'react-icons/fi';

const Allocations = () => {
  const { user, API_URL } = useAuth();
  
  // Lists
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Return inspection Modal
  const [returnModal, setReturnModal] = useState({ open: false, allocation: null });
  const [returnForm, setReturnForm] = useState({ returnConditionCheck: 'Excellent', returnNotes: '' });
  
  // Transfer approval Modal
  const [approveModal, setApproveModal] = useState({ open: false, transfer: null, action: 'Approved' });
  const [approvalNotes, setApprovalNotes] = useState('');

  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, transfRes] = await Promise.all([
        axios.get(`${API_URL}/allocations`),
        axios.get(`${API_URL}/allocations/transfers`)
      ]);
      if (allocRes.data.success) setAllocations(allocRes.data.data);
      if (transfRes.data.success) setTransfers(transfRes.data.data);
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve allocations timeline logs');
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
  // Return Asset Execution
  // ==========================================
  const handleOpenReturn = (alloc) => {
    setReturnForm({ returnConditionCheck: alloc.asset?.condition || 'Excellent', returnNotes: '' });
    setReturnModal({ open: true, allocation: alloc });
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/allocations/${returnModal.allocation._id}/return`, returnForm);
      if (res.data.success) {
        triggerAlert('success', `Asset checked back in. Status reset to Available.`);
        setReturnModal({ open: false, allocation: null });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Check-in return processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Process Transfer (Approve/Reject)
  // ==========================================
  const handleOpenApprove = (transfer, action) => {
    setApprovalNotes('');
    setApproveModal({ open: true, transfer, action });
  };

  const submitProcessTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.put(`${API_URL}/allocations/transfers/${approveModal.transfer._id}`, {
        action: approveModal.action,
        approvalNotes
      });
      if (res.data.success) {
        triggerAlert('success', `Transfer request successfully ${approveModal.action === 'Approved' ? 'authorized' : 'rejected'}.`);
        setApproveModal({ open: false, transfer: null, action: 'Approved' });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to process transfer request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/4 bg-secondary-200 dark:bg-secondary-800 rounded animate-pulse"></div>
        <div className="h-64 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // Split listings
  const activeAllocations = allocations.filter(a => ['Active', 'Overdue'].includes(a.status));
  const completedAllocations = allocations.filter(a => a.status === 'Returned');
  const pendingTransfers = transfers.filter(t => t.status === 'Pending');
  const processedTransfers = transfers.filter(t => t.status !== 'Pending');

  return (
    <div className="space-y-8">
      {/* Alert Panel */}
      {alert && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm max-w-2xl ${
          alert.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400'
        }`}>
          {alert.type === 'success' ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiAlertCircle className="w-5 h-5 shrink-0" />}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
          <FiUsers className="text-primary-500" />
          <span>Asset Allocations & Transfers</span>
        </h1>
        <p className="text-xs text-secondary-400">Review employee holdings, audit overdue return lists, and manage handovers.</p>
      </div>

      {/* Section A: Pending Transfer Approvals */}
      {pendingTransfers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FiRepeat className="text-orange-500 w-5 h-5" />
            <h2 className="text-sm font-bold text-secondary-900 dark:text-secondary-200">
              Pending Transfer Authorization requests ({pendingTransfers.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTransfers.map((t) => (
              <div key={t._id} className="p-5 border border-orange-500/20 bg-orange-500/5 rounded-xl flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-secondary-900 dark:text-white">{t.asset?.name}</h4>
                      <code className="text-[10px] text-primary-500 font-bold">{t.asset?.assetTag}</code>
                    </div>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Pending Approval</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-secondary-400 block text-[10px]">From Holder</span>
                      <span className="font-semibold">{t.fromUser?.name || t.customFromEmployeeName || 'Custom Holder'}</span>
                    </div>
                    <div>
                      <span className="text-secondary-400 block text-[10px]">To Recipient</span>
                      <span className="font-semibold">{t.toUser?.name || t.customToEmployeeName || 'Custom Recipient'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-secondary-400 italic">"Reason: {t.reason}"</p>
                </div>

                <div className="flex gap-2 border-t border-secondary-200/50 dark:border-secondary-800/40 pt-3">
                  <button
                    onClick={() => handleOpenApprove(t, 'Approved')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <FiCheck className="w-4 h-4" /> Approve Handover
                  </button>
                  <button
                    onClick={() => handleOpenApprove(t, 'Rejected')}
                    className="flex-1 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                  >
                    <FiX className="w-4 h-4" /> Deny Transfer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section B: Active Allocations Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-secondary-900 dark:text-secondary-200 flex items-center gap-2">
          <FiLayers className="text-primary-500 w-5 h-5" />
          <span>Active Asset Assignments</span>
        </h2>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                  <th className="p-4 font-semibold">Asset Tag</th>
                  <th className="p-4 font-semibold">Asset Name</th>
                  <th className="p-4 font-semibold">Holder Employee</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Expected Return</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
                {activeAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-secondary-400 italic">No active assets allocated currently</td>
                  </tr>
                ) : (
                  activeAllocations.map((alloc) => (
                    <tr key={alloc._id} className="text-secondary-700 dark:text-secondary-300">
                      <td className="p-4 font-bold text-primary-600">{alloc.asset?.assetTag}</td>
                      <td className="p-4 font-medium">{alloc.asset?.name}</td>
                      <td className="p-4 font-medium">{alloc.allocatedTo?.name || alloc.customEmployeeName || <span className="text-secondary-400 italic">Custom Assignment</span>}</td>
                      <td className="p-4">{alloc.allocatedDepartment?.name || (alloc.customEmployeeName ? 'Partner / External' : 'Corporate')}</td>
                      <td className="p-4">{alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          alloc.status === 'Overdue' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 animate-pulse'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}>
                          {alloc.status === 'Overdue' && <FiClock />}
                          <span>{alloc.status}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleOpenReturn(alloc)}
                          className="px-3 py-1 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded text-xs font-semibold"
                        >
                          Check-in (Return)
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==========================================
          CHECK-IN RETURN MODAL WITH CONDITION INSPECTION
          ========================================== */}
      {returnModal.open && returnModal.allocation && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitReturn} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Process Asset Check-in</h3>
              <button type="button" onClick={() => setReturnModal({ open: false, allocation: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-0.5 text-xs">
              <span className="text-secondary-400">Returning Asset</span>
              <span className="font-bold text-sm block text-secondary-900 dark:text-white">{returnModal.allocation.asset?.name} ({returnModal.allocation.asset?.assetTag})</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Inspection Return Condition</label>
              <select
                value={returnForm.returnConditionCheck}
                onChange={(e) => setReturnForm({ ...returnForm, returnConditionCheck: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor (Flags Repair required)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Condition Notes</label>
              <textarea
                value={returnForm.returnNotes}
                onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })}
                placeholder="Details on returns inspection findings..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 h-24 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Process Return
              </button>
              <button
                type="button" onClick={() => setReturnModal({ open: false, allocation: null })}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-250 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          TRANSFER APPROVAL NOTES MODAL
          ========================================== */}
      {approveModal.open && approveModal.transfer && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={submitProcessTransfer} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white capitalize">{approveModal.action} Transfer Request</h3>
              <button type="button" onClick={() => setApproveModal({ open: false, transfer: null, action: 'Approved' })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Approval/Rejection Notes</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Include comments for the transition timeline log..."
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 h-24 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Confirm {approveModal.action}
              </button>
              <button
                type="button" onClick={() => setApproveModal({ open: false, transfer: null, action: 'Approved' })}
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

export default Allocations;
