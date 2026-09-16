import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiSettings, FiBriefcase, FiUsers, FiPlus, 
  FiEdit3, FiCheck, FiX, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';

const OrgSetup = () => {
  const { user, API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('depts'); // depts, categories, directory
  
  // Data lists
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Messages
  const [alert, setAlert] = useState(null); // { type, text }

  // Modals state
  const [deptModal, setDeptModal] = useState({ open: false, mode: 'create', data: null });
  const [catModal, setCatModal] = useState({ open: false, mode: 'create', data: null });
  
  // Form fields
  const [deptForm, setDeptForm] = useState({ name: '', code: '', departmentHead: '', customHeadName: '', customHeadEmail: '', parentDepartment: '', customParentName: '', status: 'Active' });
  const [presetVal, setPresetVal] = useState('');
  const [catForm, setCatForm] = useState({ name: '', description: '', customFields: [] });
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Fetch all lists
  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsRes, catsRes, dirRes] = await Promise.all([
        axios.get(`${API_URL}/org/departments`),
        axios.get(`${API_URL}/org/categories`),
        axios.get(`${API_URL}/auth/directory`)
      ]);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (dirRes.data.success) setDirectory(dirRes.data.data);
    } catch (err) {
      triggerAlert('error', 'Failed to fetch directory configurations');
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

  // Helper: Employees filter (available heads/managers)
  const getEligibleHeads = () => {
    return directory.filter(u => u.status === 'Active');
  };

  const handlePresetSelect = (val) => {
    setPresetVal(val);
    if (val === 'ENG') {
      setDeptForm({ ...deptForm, name: 'Engineering', code: 'ENG' });
    } else if (val === 'HR') {
      setDeptForm({ ...deptForm, name: 'Human Resources', code: 'HR' });
    } else if (val === 'FAC') {
      setDeptForm({ ...deptForm, name: 'Facilities & Logistics', code: 'FAC' });
    } else if (val === 'FIN') {
      setDeptForm({ ...deptForm, name: 'Finance', code: 'FIN' });
    } else if (val === 'MKT') {
      setDeptForm({ ...deptForm, name: 'Marketing & Sales', code: 'MKT' });
    } else if (val === 'IT') {
      setDeptForm({ ...deptForm, name: 'IT & Technical Support', code: 'IT' });
    } else if (val === 'LEG') {
      setDeptForm({ ...deptForm, name: 'Legal & Compliance', code: 'LEG' });
    } else if (val === 'other') {
      setDeptForm({ ...deptForm, name: '', code: '' });
    }
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (deptModal.mode === 'create') {
        res = await axios.post(`${API_URL}/org/departments`, deptForm);
      } else {
        res = await axios.put(`${API_URL}/org/departments/${deptModal.data._id}`, deptForm);
      }
      if (res.data.success) {
        triggerAlert('success', `Department ${deptModal.mode === 'create' ? 'created' : 'updated'} successfully`);
        setDeptModal({ open: false, mode: 'create', data: null });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to save department');
    }
  };

  const openEditDept = (dept) => {
    setPresetVal('');
    setDeptForm({
      name: dept.name,
      code: dept.code,
      departmentHead: dept.departmentHead?._id || (dept.customHeadName ? 'other' : ''),
      customHeadName: dept.customHeadName || '',
      customHeadEmail: dept.customHeadEmail || '',
      parentDepartment: dept.parentDepartment?._id || (dept.customParentName ? 'other' : ''),
      customParentName: dept.customParentName || '',
      status: dept.status,
    });
    setDeptModal({ open: true, mode: 'edit', data: dept });
  };

  const openCreateDept = () => {
    setPresetVal('');
    setDeptForm({ name: '', code: '', departmentHead: '', customHeadName: '', customHeadEmail: '', parentDepartment: '', customParentName: '', status: 'Active' });
    setDeptModal({ open: true, mode: 'create', data: null });
  };

  // ==========================================
  // Category logic
  // ==========================================
  const addCustomField = () => {
    if (!newFieldName.trim()) return;
    setCatForm({
      ...catForm,
      customFields: [...catForm.customFields, { name: newFieldName, type: newFieldType, required: newFieldRequired }]
    });
    setNewFieldName('');
    setNewFieldRequired(false);
  };

  const removeCustomField = (index) => {
    const updated = [...catForm.customFields];
    updated.splice(index, 1);
    setCatForm({ ...catForm, customFields: updated });
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (catModal.mode === 'create') {
        res = await axios.post(`${API_URL}/org/categories`, catForm);
      } else {
        res = await axios.put(`${API_URL}/org/categories/${catModal.data._id}`, catForm);
      }
      if (res.data.success) {
        triggerAlert('success', `Category ${catModal.mode === 'create' ? 'created' : 'updated'} successfully`);
        setCatModal({ open: false, mode: 'create', data: null });
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to save category');
    }
  };

  const openEditCat = (cat) => {
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      customFields: cat.customFields || [],
    });
    setCatModal({ open: true, mode: 'edit', data: cat });
  };

  const openCreateCat = () => {
    setCatForm({ name: '', description: '', customFields: [] });
    setCatModal({ open: true, mode: 'create', data: null });
  };

  // ==========================================
  // Directory (Employee Directory) promotions
  // ==========================================
  const handleUpdateRole = async (employeeId, role) => {
    try {
      const res = await axios.put(`${API_URL}/auth/directory/${employeeId}`, { role });
      if (res.data.success) {
        triggerAlert('success', 'User role upgraded successfully');
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', 'Failed to update user role');
    }
  };

  const handleUpdateStatus = async (employeeId, status) => {
    try {
      const res = await axios.put(`${API_URL}/auth/directory/${employeeId}`, { status });
      if (res.data.success) {
        triggerAlert('success', `User account set to ${status}`);
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', 'Failed to change user status');
    }
  };

  const handleUpdateDept = async (employeeId, departmentId) => {
    try {
      const res = await axios.put(`${API_URL}/auth/directory/${employeeId}`, { departmentId });
      if (res.data.success) {
        triggerAlert('success', 'Employee department reassigned');
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', 'Failed to change employee department');
    }
  };

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

      {/* Tabs Menu Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-secondary-200/50 dark:border-secondary-800/40 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <FiSettings className="w-6 h-6 text-primary-500" />
          <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white">
            Organization Setup
          </h1>
        </div>

        <div className="flex bg-secondary-100 dark:bg-secondary-900 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('depts')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              activeTab === 'depts' ? 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-400 hover:text-secondary-600'
            }`}
          >
            Tab A: Departments
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              activeTab === 'categories' ? 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-400 hover:text-secondary-600'
            }`}
          >
            Tab B: Categories
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 rounded-md transition-all ${
              activeTab === 'directory' ? 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white shadow-sm' : 'text-secondary-400 hover:text-secondary-600'
            }`}
          >
            Tab C: Directory
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB A - DEPARTMENT MANAGEMENT
          ========================================== */}
      {activeTab === 'depts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-secondary-400">Configure corporate hierarchies and assign Department Heads.</p>
            <button
              onClick={openCreateDept}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Department</span>
            </button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                    <th className="p-4 font-semibold">Code</th>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Department Head</th>
                    <th className="p-4 font-semibold">Parent Department</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="text-secondary-700 dark:text-secondary-300">
                      <td className="p-4 font-bold text-primary-600">{dept.code}</td>
                      <td className="p-4 font-medium">{dept.name}</td>
                      <td className="p-4">{dept.departmentHead?.name || dept.customHeadName || <span className="text-secondary-400 italic">None Assigned</span>}</td>
                      <td className="p-4">{dept.parentDepartment?.name || dept.customParentName || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dept.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-900'
                        }`}>
                          {dept.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openEditDept(dept)}
                          className="p-1 rounded text-secondary-400 hover:text-primary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                        >
                          <FiEdit3 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB B - ASSET CATEGORIES
          ========================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-secondary-400">Manage categories and configure category-specific fields (e.g. warranty period for Electronics).</p>
            <button
              onClick={openCreateCat}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat._id} className="glass-card p-5 rounded-xl flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-secondary-900 dark:text-white">{cat.name}</h3>
                    <button
                      onClick={() => openEditCat(cat)}
                      className="p-1 text-secondary-400 hover:text-primary-500 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-secondary-400 leading-relaxed min-h-[32px]">{cat.description || 'No description provided.'}</p>
                </div>

                <div className="space-y-1.5 border-t border-secondary-100 dark:border-secondary-800/40 pt-3">
                  <span className="text-[9px] uppercase font-bold text-secondary-400 tracking-wider">Custom Schema Fields</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.customFields?.length === 0 ? (
                      <span className="text-[10px] text-secondary-400 italic">No custom fields defined</span>
                    ) : (
                      cat.customFields.map((f, index) => (
                        <span key={index} className="px-2 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800 text-[10px] text-secondary-600 dark:text-secondary-300">
                          {f.name} ({f.type}) {f.required && '*'}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB C - EMPLOYEE DIRECTORY
          ========================================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-secondary-400">Promote Employees to Department Heads or Asset Managers. This is the only place roles are assigned.</p>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-secondary-200/50 dark:border-secondary-800/40 text-secondary-400">
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Department</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200/30 dark:divide-secondary-800/30">
                  {directory.map((employee) => (
                    <tr key={employee._id} className="text-secondary-700 dark:text-secondary-300">
                      <td className="p-4 font-medium">{employee.name}</td>
                      <td className="p-4">{employee.email}</td>
                      <td className="p-4">
                        <select
                          value={employee.department?._id || ''}
                          onChange={(e) => handleUpdateDept(employee._id, e.target.value)}
                          className="bg-transparent border border-secondary-200 dark:border-secondary-800 rounded px-1.5 py-0.5 text-xs text-secondary-800 dark:text-secondary-100 outline-none"
                        >
                          <option value="">{employee.customDepartmentName ? `Custom: ${employee.customDepartmentName}` : 'No Department'}</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        {employee.role === 'Admin' ? (
                          <span className="font-bold text-red-500">Super Admin</span>
                        ) : (
                          <select
                            value={employee.role}
                            onChange={(e) => handleUpdateRole(employee._id, e.target.value)}
                            className="bg-transparent border border-secondary-250 dark:border-secondary-850 rounded px-1.5 py-0.5 text-xs text-secondary-800 dark:text-secondary-100 outline-none"
                          >
                            <option value="Employee">Employee</option>
                            <option value="Asset Manager">Asset Manager</option>
                            <option value="Department Head">Department Head</option>
                          </select>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          employee.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {employee.role !== 'Admin' && (
                          <button
                            onClick={() => handleUpdateStatus(employee._id, employee.status === 'Active' ? 'Inactive' : 'Active')}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                              employee.status === 'Active' ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:hover:bg-emerald-950/20'
                            }`}
                          >
                            {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DEPARTMENT EDIT/CREATE MODAL
          ========================================== */}
      {deptModal.open && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveDept} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white capitalize">{deptModal.mode} Department</h3>
              <button type="button" onClick={() => setDeptModal({ open: false, mode: 'create', data: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            {deptModal.mode === 'create' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Choose Department Preset</label>
                <select
                  value={presetVal}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                >
                  <option value="">-- Custom (Enter manually below) --</option>
                  <option value="ENG">Engineering (ENG)</option>
                  <option value="HR">Human Resources (HR)</option>
                  <option value="FAC">Facilities & Logistics (FAC)</option>
                  <option value="FIN">Finance (FIN)</option>
                  <option value="MKT">Marketing & Sales (MKT)</option>
                  <option value="IT">IT & Technical Support (IT)</option>
                  <option value="LEG">Legal & Compliance (LEG)</option>
                  <option value="other">Other (Enter manually...)</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Department Name</label>
              <input
                type="text"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="Engineering"
                className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Department Code</label>
              <input
                type="text"
                required
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                placeholder="ENG"
                className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 uppercase"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Department Head</label>
              <select
                value={deptForm.departmentHead}
                onChange={(e) => setDeptForm({ ...deptForm, departmentHead: e.target.value })}
                className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              >
                <option value="">None Assigned</option>
                {getEligibleHeads().map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
                <option value="other">Other (Enter manually...)</option>
              </select>
            </div>

            {deptForm.departmentHead === 'other' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Head Name</label>
                  <input
                    type="text" required
                    value={deptForm.customHeadName || ''}
                    onChange={(e) => setDeptForm({ ...deptForm, customHeadName: e.target.value })}
                    placeholder="e.g. David Smith"
                    className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Head Email</label>
                  <input
                    type="email" required
                    value={deptForm.customHeadEmail || ''}
                    onChange={(e) => setDeptForm({ ...deptForm, customHeadEmail: e.target.value })}
                    placeholder="e.g. david.smith@company.com"
                    className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Parent Department</label>
              <select
                value={deptForm.parentDepartment}
                onChange={(e) => setDeptForm({ ...deptForm, parentDepartment: e.target.value })}
                className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              >
                <option value="">None</option>
                {departments
                  .filter((d) => d._id !== deptModal.data?._id)
                  .map((d) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                <option value="other">Other (Enter manually...)</option>
              </select>
            </div>

            {deptForm.parentDepartment === 'other' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Parent Department Name</label>
                <input
                  type="text" required
                  value={deptForm.customParentName || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, customParentName: e.target.value })}
                  placeholder="e.g. Executive Board"
                  className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setDeptModal({ open: false, mode: 'create', data: null })}
                className="flex-1 py-2 bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 text-secondary-800 dark:text-secondary-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          CATEGORY EDIT/CREATE MODAL
          ========================================== */}
      {catModal.open && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCat} className="w-full max-w-lg bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white capitalize">{catModal.mode} Category</h3>
              <button type="button" onClick={() => setCatModal({ open: false, mode: 'create', data: null })} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Category Name</label>
              <input
                type="text"
                required
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="Electronics"
                className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Description</label>
              <textarea
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder="General description for category items..."
                className="px-3.5 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100 h-20 resize-none"
              />
            </div>

            {/* Custom Field Configurations */}
            <div className="border border-secondary-200 dark:border-secondary-800 rounded-xl p-4 space-y-3.5">
              <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide block">Configure Custom Fields</span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Field Name (e.g. Material)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                />
                
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Boolean">Boolean</option>
                </select>

                <button
                  type="button"
                  onClick={addCustomField}
                  className="px-3 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-500"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required_chk"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <label htmlFor="required_chk" className="text-xs text-secondary-500 cursor-pointer">Mark as Required field</label>
              </div>

              {/* Added items list */}
              <div className="divide-y divide-secondary-100 dark:divide-secondary-800/30 pt-1">
                {catForm.customFields.map((field, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 text-xs text-secondary-650 dark:text-secondary-350">
                    <span className="font-semibold">{field.name} <span className="font-normal text-secondary-400">({field.type})</span> {field.required && <span className="text-red-500">*</span>}</span>
                    <button type="button" onClick={() => removeCustomField(idx)} className="text-red-500 hover:text-red-600"><FiX className="w-4.5 h-4.5" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setCatModal({ open: false, mode: 'create', data: null })}
                className="flex-1 py-2 bg-secondary-100 dark:bg-secondary-805 hover:bg-secondary-200 text-secondary-800 dark:text-secondary-200 rounded-lg text-xs font-semibold"
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

export default OrgSetup;
