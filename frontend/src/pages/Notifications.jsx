import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FiBell, FiCheck, FiTrash2, FiClock, 
  FiInfo, FiAlertCircle, FiCheckCircle, FiInbox 
} from 'react-icons/fi';

const Notifications = () => {
  const { API_URL } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [API_URL]);

  const triggerAlert = (text) => {
    setAlert(text);
    setTimeout(() => setAlert(null), 3000);
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/notifications/${id}/read`);
      if (res.data.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      const res = await axios.put(`${API_URL}/notifications/read-all`);
      if (res.data.success) {
        triggerAlert('All notifications marked as read');
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/notifications/${id}/archive`);
      if (res.data.success) {
        triggerAlert('Notification archived');
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/4 bg-secondary-200 dark:bg-secondary-800 rounded animate-pulse"></div>
        <div className="h-32 bg-secondary-100 dark:bg-secondary-850 rounded animate-pulse"></div>
      </div>
    );
  }

  const unread = notifications.filter((n) => n.status === 'Unread');
  const read = notifications.filter((n) => n.status === 'Read');

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Success': return <FiCheckCircle className="text-emerald-500 w-5 h-5" />;
      case 'Warning': return <FiAlertCircle className="text-amber-500 w-5 h-5" />;
      case 'Error': return <FiAlertCircle className="text-red-500 w-5 h-5" />;
      default: return <FiInfo className="text-primary-500 w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert pop */}
      {alert && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 text-xs max-w-md">
          {alert}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-secondary-900 dark:text-white flex items-center gap-2">
            <FiBell className="text-primary-500" />
            <span>Alerts & Notifications Center</span>
          </h1>
          <p className="text-xs text-secondary-400 font-medium">Trace allocations, updates, and maintenance requests.</p>
        </div>

        {unread.length > 0 && (
          <button
            onClick={handleReadAll}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-750 text-secondary-800 dark:text-secondary-100 rounded-lg text-xs font-semibold"
          >
            <FiCheck />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Main Box */}
      <div className="max-w-3xl glass-card rounded-xl overflow-hidden divide-y divide-secondary-150 dark:divide-secondary-850">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-secondary-400 flex flex-col items-center gap-2">
            <FiInbox className="w-10 h-10 opacity-40" />
            <span className="font-semibold">Your alert inbox is completely clear!</span>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              className={`p-5 flex items-start gap-4 hover:bg-secondary-100/10 transition-colors ${
                item.status === 'Unread' ? 'border-l-2 border-primary-500' : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">{getAlertIcon(item.type)}</div>
              
              <div className="grow space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-xs font-bold ${item.status === 'Unread' ? 'text-secondary-900 dark:text-white' : 'text-secondary-600 dark:text-secondary-400'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[9px] text-secondary-400 flex items-center gap-1 font-medium">
                    <FiClock /> {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-xs text-secondary-400 leading-normal">{item.message}</p>
                
                <div className="flex gap-2 pt-2 text-[10px] font-bold">
                  {item.status === 'Unread' && (
                    <button
                      onClick={() => handleMarkRead(item._id)}
                      className="text-primary-600 hover:text-primary-500"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(item._id)}
                    className="text-secondary-400 hover:text-red-500 flex items-center gap-1 ml-auto"
                  >
                    <FiTrash2 /> Archive
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
