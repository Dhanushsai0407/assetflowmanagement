import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  FiCalendar, FiPlus, FiX, FiCheckCircle, 
  FiAlertCircle, FiClock, FiMapPin, FiLayers 
} from 'react-icons/fi';

const ResourceBooking = () => {
  const { user, API_URL } = useAuth();
  
  // Data lists
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // States
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Forms
  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    customResourceName: '',
    title: '',
    startTime: '',
    endTime: '',
  });

  const [titlePreset, setTitlePreset] = useState('');

  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, bookRes] = await Promise.all([
        axios.get(`${API_URL}/assets?bookable=true`),
        axios.get(`${API_URL}/bookings`)
      ]);
      if (resRes.data.success) setResources(resRes.data.data);
      
      if (bookRes.data.success) {
        setBookings(bookRes.data.data);
        
        // Convert to FullCalendar events format
        const events = bookRes.data.data
          .filter((b) => b.status !== 'Cancelled')
          .map((b) => {
            const resourceName = b.resource?.name || b.customResourceName || 'Custom Resource';
            return {
              id: b._id,
              title: `${resourceName}: ${b.title}`,
              start: b.startTime,
              end: b.endTime,
              backgroundColor: b.status === 'Completed' ? '#10b981' : '#2563eb',
              borderColor: b.status === 'Completed' ? '#10b981' : '#2563eb',
              extendedProps: {
                resourceName: resourceName,
                bookedBy: b.bookedBy?.name,
                status: b.status,
                location: b.resource?.location || 'Manual / Custom'
              }
            };
          });
        setCalendarEvents(events);
      }
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve reservation ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  // ==========================================
  // Create Booking with Overlap checks
  // ==========================================
  const handleOpenBooking = () => {
    setTitlePreset('');
    setBookingForm({ resourceId: '', customResourceName: '', title: '', startTime: '', endTime: '' });
    setBookingModal(true);
  };

  const handleTitlePresetChange = (val) => {
    setTitlePreset(val);
    if (val !== 'other') {
      setBookingForm(prev => ({ ...prev, title: val }));
    } else {
      setBookingForm(prev => ({ ...prev, title: '' }));
    }
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorAlert(null);
    try {
      const res = await axios.post(`${API_URL}/bookings`, bookingForm);
      if (res.data.success) {
        triggerAlert('success', 'Resource slot booked successfully.');
        setTitlePreset('');
        setBookingModal(false);
        fetchData();
      }
    } catch (err) {
      setErrorAlert(err.response?.data?.message || 'Conflict. Slot overlaps with existing booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const [errorAlert, setErrorAlert] = useState(null);

  // ==========================================
  // Cancel Booking
  // ==========================================
  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await axios.put(`${API_URL}/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        triggerAlert('success', 'Booking cancelled successfully.');
        setSelectedEvent(null);
        fetchData();
      }
    } catch (err) {
      triggerAlert('error', 'Could not cancel booking');
    }
  };

  // Event Click Handler on Calendar
  const handleEventClick = (info) => {
    const booking = bookings.find(b => b._id === info.event.id);
    if (booking) {
      setSelectedEvent(booking);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/4 bg-secondary-200 dark:bg-secondary-800 rounded animate-pulse"></div>
        <div className="h-96 bg-secondary-100 dark:bg-secondary-850 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
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
            <FiCalendar className="text-primary-500" />
            <span>Shared Resource Booking Calendar</span>
          </h1>
          <p className="text-xs text-secondary-400">View real-time schedule grids and book rooms, projectors, or cars.</p>
        </div>

        <button
          onClick={handleOpenBooking}
          className="flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Booking Calendar Widget & List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Resource sidebar list */}
        <div className="glass-card p-5 rounded-xl space-y-4 h-fit">
          <span className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider block">Bookable Inventory</span>
          
          <div className="space-y-3">
            {resources.length === 0 ? (
              <span className="text-xs text-secondary-400 italic">No bookable resources registered</span>
            ) : (
              resources.map((res) => (
                <div key={res._id} className="p-3 bg-secondary-50 dark:bg-secondary-950/20 rounded-lg flex items-start gap-2.5">
                  <FiLayers className="text-primary-500 w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-xs text-secondary-800 dark:text-secondary-200">{res.name}</h4>
                    <span className="text-[9px] text-secondary-400 flex items-center gap-1 mt-0.5">
                      <FiMapPin /> {res.location}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FullCalendar Component */}
        <div className="lg:col-span-3 glass-card p-6 rounded-xl">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>
      </div>

      {/* ==========================================
          RESERVE NEW RESOURCE SLOT MODAL
          ========================================== */}
      {bookingModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveBooking} className="w-full max-w-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Reserve Resource Slot</h3>
              <button type="button" onClick={() => setBookingModal(false)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            {errorAlert && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-650 text-xs flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorAlert}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Select Resource</label>
              <select
                required
                value={bookingForm.resourceId}
                onChange={(e) => setBookingForm({ ...bookingForm, resourceId: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              >
                <option value="">Choose Asset Room / Vehicle...</option>
                {resources.map((res) => (
                  <option key={res._id} value={res._id}>{res.name} ({res.location})</option>
                ))}
                <option value="other">Other (Enter custom name...)</option>
              </select>
            </div>

            {bookingForm.resourceId === 'other' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Resource Name</label>
                <input
                  type="text" required
                  value={bookingForm.customResourceName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customResourceName: e.target.value })}
                  placeholder="e.g. Brainstorm Room, VR Kit, etc."
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
                />
              </div>
            )}

             <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Booking Purpose / Title Preset</label>
              <select
                required
                value={titlePreset}
                onChange={(e) => handleTitlePresetChange(e.target.value)}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
              >
                <option value="">-- Choose Purpose --</option>
                <option value="Weekly Sync Meeting">Weekly Sync Meeting</option>
                <option value="Client Presentation">Client Presentation</option>
                <option value="Brainstorm Session">Brainstorm Session</option>
                <option value="Design Review">Design Review</option>
                <option value="Board Meeting">Board Meeting</option>
                <option value="Code Sprint Planning">Code Sprint Planning</option>
                <option value="other">Other (Enter manually...)</option>
              </select>
            </div>

            {titlePreset === 'other' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Custom Booking Title / Event Name</label>
                <input
                  type="text" required
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  placeholder="e.g. Ad-hoc client workshop"
                  className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800 dark:text-secondary-100"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">Start Date & Time</label>
              <input
                type="datetime-local" required
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-wide">End Date & Time</label>
              <input
                type="datetime-local" required
                value={bookingForm.endTime}
                onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                className="px-3 py-2 text-sm bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-800 rounded-lg outline-none text-secondary-800"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                Confirm Booking
              </button>
              <button
                type="button" onClick={() => setBookingModal(false)}
                className="flex-1 py-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          VIEW RESERVATION DETAIL MODAL
          ========================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-secondary-100 dark:border-secondary-800/40 pb-3">
              <h3 className="font-bold text-sm text-secondary-900 dark:text-white">Reservation Details</h3>
              <button type="button" onClick={() => setSelectedEvent(null)} className="text-secondary-400 hover:text-secondary-600"><FiX className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3.5 text-xs text-secondary-650 dark:text-secondary-350">
              <div>
                <span className="text-[10px] text-secondary-400 uppercase font-semibold">Title</span>
                <span className="font-bold text-sm text-secondary-900 dark:text-white block mt-0.5">{selectedEvent.title}</span>
              </div>

              <div>
                <span className="text-[10px] text-secondary-400 uppercase font-semibold">Resource / Asset</span>
                <span className="font-semibold block">{selectedEvent.resource?.name || selectedEvent.customResourceName || 'Custom Resource'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-secondary-400 uppercase font-semibold">Reserved By</span>
                  <span className="font-semibold block">{selectedEvent.bookedBy?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-secondary-400 uppercase font-semibold">Location</span>
                  <span className="font-semibold block">{selectedEvent.resource?.location || 'Manual / Custom'}</span>
                </div>
              </div>

              <div className="p-3 bg-secondary-50 dark:bg-secondary-950/20 rounded-lg flex items-center gap-2">
                <FiClock className="text-primary-500 shrink-0" />
                <div>
                  <span className="font-semibold block">{new Date(selectedEvent.startTime).toLocaleString()}</span>
                  <span className="text-[10px] text-secondary-400 block">to {new Date(selectedEvent.endTime).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Cancel Actions */}
            <div className="flex gap-2 border-t border-secondary-100 dark:border-secondary-800/40 pt-4 mt-2">
              {(String(selectedEvent.bookedBy?._id || selectedEvent.bookedBy) === String(user?._id) || 
                ['Admin', 'Asset Manager'].includes(user?.role)) && (
                <button
                  onClick={() => handleCancelBooking(selectedEvent._id)}
                  className="w-full py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                  <FiX /> Cancel Reservation
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2 bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceBooking;
