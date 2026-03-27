"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import api, { getRealtimeStreamUrl } from '@/lib/api';
import { Users, Calendar, Megaphone, Clock, MapPin, AlertTriangle, Send, BookOpen, X, Coffee, ChevronRight, PlusCircle, Upload, ExternalLink, Pencil, Trash2 } from 'lucide-react';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [crowdData, setCrowdData] = useState<any[]>([]);
    const [campusMeta, setCampusMeta] = useState<any | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [promotionRequests, setPromotionRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'schedule' | 'students' | 'announce' | 'campus' | 'events'>('schedule');
    const [rescheduleModal, setRescheduleModal] = useState<any>(null);
    const [rescheduleForm, setRescheduleForm] = useState({ rescheduledDate: '', rescheduledStartTime: '', rescheduledEndTime: '', rescheduledRoom: '', rescheduledReason: '' });
    const [announceForm, setAnnounceForm] = useState({ title: '', message: '', attachmentUrl: '' });
    const [eventForm, setEventForm] = useState({ title: '', description: '', locationName: '', mapUrl: '', flyerUrl: '', startDate: '', startTime: '' });
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
    const [announceErrors, setAnnounceErrors] = useState<Record<string, string>>({});
    const [selectedBlock, setSelectedBlock] = useState<string>('ALL');
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = window.localStorage.getItem('token');
        if (!token) return;

        const streamUrl = getRealtimeStreamUrl(token);
        const es = new EventSource(streamUrl);

        const onSync = () => {
            fetchAll(true);
        };

        es.addEventListener('sync', onSync as EventListener);

        return () => {
            es.removeEventListener('sync', onSync as EventListener);
            es.close();
        };
    }, []);

    const fetchAll = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [sched, studs, crowd, meta, notifs, eventsRes] = await Promise.all([
                api.get('/schedules/mine').catch(() => ({ data: [] })),
                api.get('/teacher/students').catch(() => ({ data: [] })),
                api.get('/crowd/status').catch(() => ({ data: [] })),
                api.get('/campus/meta').catch(() => ({ data: null })),
                api.get('/notifications').catch(() => ({ data: [] })),
                api.get('/events').catch(() => ({ data: [] })),
            ]);
            setSchedules(sched.data);
            setStudents(studs.data);
            setCrowdData(crowd.data || []);
            setCampusMeta(meta.data || null);
            setPromotionRequests((notifs.data || []).filter((n: any) => String(n.title || '').startsWith('Promotion Request:')));
            setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        } catch (e) { console.error(e); }
        finally {
            if (!silent) setLoading(false);
        }
    };

    const uploadImageAndGetUrl = async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await api.post('/events/flyer-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.flyerUrl as string;
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        try {
            const { data } = await api.put(`/schedules/${rescheduleModal._id}/reschedule`, rescheduleForm);
            setMsg({ type: 'success', text: `Class rescheduled! ${data.emailsSent} students notified.` });
            setRescheduleModal(null);
            setRescheduleForm({ rescheduledDate: '', rescheduledStartTime: '', rescheduledEndTime: '', rescheduledRoom: '', rescheduledReason: '' });
            fetchAll();
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reschedule' });
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this class? Students will be notified.')) return;
        try {
            await api.put(`/schedules/${id}/cancel`, { reason: 'Cancelled by teacher' });
            setMsg({ type: 'success', text: 'Class cancelled and students notified.' });
            fetchAll();
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleAnnounce = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        const errors: Record<string, string> = {};
        if (!announceForm.title.trim()) errors.title = 'Title is required.';
        if (!announceForm.message.trim()) errors.message = 'Message is required.';
        setAnnounceErrors(errors);
        if (Object.keys(errors).length) return;
        try {
            const { data } = await api.post('/teacher/announce', announceForm);
            setMsg({ type: 'success', text: `Announcement sent to ${data.studentsNotified} students!` });
            setAnnounceForm({ title: '', message: '', attachmentUrl: '' });
            setAnnounceErrors({});
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        const errors: Record<string, string> = {};
        if (!eventForm.title.trim()) errors.title = 'Event title is required.';
        if (!eventForm.description.trim()) errors.description = 'Description is required.';
        if (!eventForm.locationName.trim()) errors.locationName = 'Location is required.';
        if (!eventForm.startDate || !eventForm.startTime) errors.startAt = 'Date and time are required.';
        if (eventForm.mapUrl.trim() && !/^https?:\/\//i.test(eventForm.mapUrl.trim())) errors.mapUrl = 'Map URL must start with http:// or https://';
        setEventErrors(errors);
        if (Object.keys(errors).length) return;

        try {
            const payload = {
                title: eventForm.title,
                description: eventForm.description,
                locationName: eventForm.locationName,
                mapUrl: eventForm.mapUrl || undefined,
                flyerUrl: eventForm.flyerUrl || undefined,
                startAt: new Date(`${eventForm.startDate}T${eventForm.startTime}`).toISOString(),
            };

            if (editingEventId) {
                await api.put(`/events/${editingEventId}`, payload);
                setMsg({ type: 'success', text: 'Event updated successfully.' });
            } else {
                await api.post('/events', payload);
                setMsg({ type: 'success', text: 'Event created successfully.' });
            }

            setEventForm({ title: '', description: '', locationName: '', mapUrl: '', flyerUrl: '', startDate: '', startTime: '' });
            setEditingEventId(null);
            setEventErrors({});
            fetchAll();
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create event' });
        }
    };

    const onEditEvent = (event: any) => {
        const d = event.startAt ? new Date(event.startAt) : null;
        setEventForm({
            title: event.title || '',
            description: event.description || '',
            locationName: event.locationName || '',
            mapUrl: event.mapUrl || '',
            flyerUrl: event.flyerUrl || '',
            startDate: d ? d.toISOString().slice(0, 10) : '',
            startTime: d ? d.toTimeString().slice(0, 5) : '',
        });
        setEditingEventId(event._id);
        setTab('events');
        setEventErrors({});
    };

    const onDeleteEvent = async (eventId: string) => {
        if (!confirm('Delete this event?')) return;
        try {
            await api.delete(`/events/${eventId}`);
            setMsg({ type: 'success', text: 'Event deleted successfully.' });
            fetchAll();
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete event' });
        }
    };

    const onRequestGlobal = async (eventId: string) => {
        try {
            await api.post(`/events/${eventId}/request-global`);
            setMsg({ type: 'success', text: 'Global visibility request sent to superadmin.' });
            fetchAll();
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to request global visibility' });
        }
    };

    const inferBlock = (name = '', location = '') => {
        const text = `${name} ${location}`.toUpperCase();
        const m = text.match(/\b(?:BLOCK\s+)?([A-L]|HE)\s*BLOCK\b|\bBLOCK\s+([A-L]|HE)\b|\bACADEMIC\s+BLOCK\s+([A-L]|HE)\b/i);
        const code = (m?.[1] || m?.[2] || m?.[3] || '').toUpperCase();
        if (code) return code;
        if (text.includes('GROUND')) return 'GROUND';
        return 'OTHER';
    };

    const sportsData = (campusMeta?.sportsAndGroundVenues || []).map((v: any, idx: number) => ({
        _id: `sports-${idx}`,
        peopleCount: v.peopleCount,
        crowdLevel: v.crowdLevel,
        foodCourtId: {
            name: v.venueName,
            location: v.zone,
            capacity: v.capacity,
        },
        block: v.blockCode,
    }));

    const mergedCrowd = [...crowdData, ...sportsData].map((d: any) => ({
        ...d,
        block: d.block || inferBlock(d.foodCourtId?.name, d.foodCourtId?.location),
    }));

    const blockKeys = ['ALL', ...Array.from(new Set(mergedCrowd.map((d: any) => d.block)))];
    const filteredCrowd = mergedCrowd.filter((d: any) => (selectedBlock === 'ALL' || d.block === selectedBlock) && (selectedLevel === 'ALL' || d.crowdLevel === selectedLevel));

    if (loading) {
        return <ProtectedRoute><div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /></div></ProtectedRoute>;
    }

    return (
        <ProtectedRoute>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Teacher Panel</h1>
                    <p className="text-slate-500 text-sm mt-1">Welcome, {user?.name}</p>
                </div>

                {msg.text && (
                    <div className={`mb-4 p-3 rounded-xl text-sm ${msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
                        {msg.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {([
                        { key: 'schedule', icon: Calendar, label: 'My Schedule' },
                        { key: 'students', icon: Users, label: `Students (${students.length})` },
                        { key: 'announce', icon: Megaphone, label: 'Announce' },
                        { key: 'campus', icon: Coffee, label: 'Campus Live' },
                        { key: 'events', icon: PlusCircle, label: 'Events' },
                    ] as const).map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-indigo-50 text-indigo-600 border border-indigo-300' : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Schedule Tab */}
                {tab === 'schedule' && (
                    <div className="space-y-3">
                        {schedules.length === 0 && <div className="glass-card rounded-xl p-6 text-center text-slate-400 text-sm">No schedules assigned yet</div>}
                        {schedules.map((s: any) => (
                            <div key={s._id} className={`glass-card rounded-xl p-5 ${s.isCancelled ? 'opacity-50' : ''}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${s.type === 'lab' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>{s.type.toUpperCase()}</span>
                                            <h3 className="text-sm font-semibold text-slate-800">{s.subject}</h3>
                                            {s.isCancelled && <span className="text-xs text-red-500 font-bold">CANCELLED</span>}
                                            {s.isRescheduled && !s.isCancelled && <span className="text-xs text-amber-600 font-bold">RESCHEDULED</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {s.dayOfWeek}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> {s.startTime} - {s.endTime}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {s.room || s.lab?.name || 'TBA'}</span>
                                            <span className="flex items-center gap-1"><BookOpen size={12} /> {s.department?.code}</span>
                                        </div>
                                    </div>
                                    {!s.isCancelled && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => setRescheduleModal(s)} className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">Reschedule</button>
                                            <button onClick={() => handleCancel(s._id)} className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Students Tab */}
                {tab === 'students' && (
                    <div className="glass-card rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left p-4 text-slate-500 font-medium">Name</th>
                                    <th className="text-left p-4 text-slate-500 font-medium hidden sm:table-cell">Roll No.</th>
                                    <th className="text-left p-4 text-slate-500 font-medium hidden md:table-cell">Course</th>
                                    <th className="text-left p-4 text-slate-500 font-medium hidden lg:table-cell">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s: any) => (
                                    <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 text-slate-700">{s.name}</td>
                                        <td className="p-4 text-slate-500 hidden sm:table-cell">{s.rollNumber || '—'}</td>
                                        <td className="p-4 text-slate-500 hidden md:table-cell">{s.courseName || '—'}</td>
                                        <td className="p-4 text-slate-400 hidden lg:table-cell">{s.email}</td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr><td colSpan={4} className="p-6 text-center text-slate-400">No students in your department yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Announce Tab */}
                {tab === 'announce' && (
                    <div className="glass-card rounded-xl p-6 max-w-xl">
                        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2"><Megaphone size={18} className="text-indigo-500" /> Department Announcement</h3>
                        <form onSubmit={handleAnnounce} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Title</label>
                                <input required className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${announceErrors.title ? 'border-red-300' : ''}`} placeholder="Announcement title" value={announceForm.title} onChange={e => { setAnnounceForm({ ...announceForm, title: e.target.value }); setAnnounceErrors(prev => ({ ...prev, title: '' })); }} />
                                {announceErrors.title ? <p className="text-xs text-red-500 mt-1">{announceErrors.title}</p> : null}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Message</label>
                                <textarea required rows={4} className={`glass-input w-full px-4 py-3 rounded-xl text-sm resize-none ${announceErrors.message ? 'border-red-300' : ''}`} placeholder="Type your announcement..." value={announceForm.message} onChange={e => { setAnnounceForm({ ...announceForm, message: e.target.value }); setAnnounceErrors(prev => ({ ...prev, message: '' })); }} />
                                {announceErrors.message ? <p className="text-xs text-red-500 mt-1">{announceErrors.message}</p> : null}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Attachment (optional)</label>
                                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50">
                                    <Upload size={14} /> Upload Flyer / Poster
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const url = await uploadImageAndGetUrl(file);
                                                setAnnounceForm((prev) => ({ ...prev, attachmentUrl: url }));
                                                setMsg({ type: 'success', text: 'Attachment uploaded successfully.' });
                                            } catch (err: any) {
                                                setMsg({ type: 'error', text: err.response?.data?.message || 'Attachment upload failed' });
                                            }
                                        }}
                                    />
                                </label>
                                {announceForm.attachmentUrl ? (
                                    <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden max-w-sm">
                                        <img src={announceForm.attachmentUrl} alt="Notice attachment" className="w-full h-36 object-cover" />
                                    </div>
                                ) : null}
                            </div>
                            <button type="submit" className="btn-primary px-6 py-3 text-sm flex items-center gap-2"><Send size={16} /> Send to Department</button>
                        </form>
                    </div>
                )}

                {tab === 'campus' && (
                    <div className="space-y-4">
                        <div className="glass-card rounded-xl p-4">
                            <h3 className="text-base font-semibold text-slate-800 mb-3">Campus Live Filters</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {blockKeys.map((b: string) => (
                                    <button key={b} onClick={() => setSelectedBlock(b)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${selectedBlock === b ? 'bg-indigo-50 text-indigo-600 border-indigo-300' : 'bg-white text-slate-500 border-slate-200'}`}>{b}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'].map((l) => (
                                    <button key={l} onClick={() => setSelectedLevel(l)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${selectedLevel === l ? 'bg-indigo-50 text-indigo-600 border-indigo-300' : 'bg-white text-slate-500 border-slate-200'}`}>{l}</button>
                                ))}
                                <button onClick={() => { setSelectedBlock('ALL'); setSelectedLevel('ALL'); }} className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white text-slate-500 border-slate-200">Reset</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredCrowd.map((d: any) => (
                                <div key={d._id} className="glass-card rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-semibold text-slate-800">{d.foodCourtId?.name}</p>
                                        <span className="text-[10px] font-bold text-indigo-600">{d.block}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">{d.foodCourtId?.location}</p>
                                    <p className="text-xs text-slate-500">People: <span className="font-semibold text-slate-700">{d.peopleCount}</span> / {d.foodCourtId?.capacity || '-'}</p>
                                    <p className="text-xs mt-1 font-semibold text-slate-600">Level: {d.crowdLevel}</p>
                                </div>
                            ))}
                            {filteredCrowd.length === 0 && <div className="text-sm text-slate-400">No areas match selected filters.</div>}
                        </div>
                    </div>
                )}

                {tab === 'events' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-base font-semibold text-slate-800 mb-4">{editingEventId ? 'Edit Event' : 'Create Event'}</h3>
                            <form onSubmit={handleCreateEvent} className="space-y-3">
                                <input required className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${eventErrors.title ? 'border-red-300' : ''}`} placeholder="Event title" value={eventForm.title} onChange={e => { setEventForm({ ...eventForm, title: e.target.value }); setEventErrors(prev => ({ ...prev, title: '' })); }} />
                                {eventErrors.title ? <p className="text-xs text-red-500 -mt-1">{eventErrors.title}</p> : null}

                                <textarea required rows={3} className={`glass-input w-full px-4 py-3 rounded-xl text-sm resize-none ${eventErrors.description ? 'border-red-300' : ''}`} placeholder="Description" value={eventForm.description} onChange={e => { setEventForm({ ...eventForm, description: e.target.value }); setEventErrors(prev => ({ ...prev, description: '' })); }} />
                                {eventErrors.description ? <p className="text-xs text-red-500 -mt-1">{eventErrors.description}</p> : null}

                                <input required className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${eventErrors.locationName ? 'border-red-300' : ''}`} placeholder="Location name" value={eventForm.locationName} onChange={e => { setEventForm({ ...eventForm, locationName: e.target.value }); setEventErrors(prev => ({ ...prev, locationName: '' })); }} />
                                {eventErrors.locationName ? <p className="text-xs text-red-500 -mt-1">{eventErrors.locationName}</p> : null}

                                <div className="grid grid-cols-2 gap-3">
                                    <input type="date" required className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${eventErrors.startAt ? 'border-red-300' : ''}`} value={eventForm.startDate} onChange={e => { setEventForm({ ...eventForm, startDate: e.target.value }); setEventErrors(prev => ({ ...prev, startAt: '' })); }} />
                                    <input type="time" required className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${eventErrors.startAt ? 'border-red-300' : ''}`} value={eventForm.startTime} onChange={e => { setEventForm({ ...eventForm, startTime: e.target.value }); setEventErrors(prev => ({ ...prev, startAt: '' })); }} />
                                </div>
                                {eventErrors.startAt ? <p className="text-xs text-red-500 -mt-1">{eventErrors.startAt}</p> : null}

                                <div>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-50">
                                        <Upload size={14} /> Upload Event Poster
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                    const url = await uploadImageAndGetUrl(file);
                                                    setEventForm((prev) => ({ ...prev, flyerUrl: url }));
                                                    setMsg({ type: 'success', text: 'Event poster uploaded successfully.' });
                                                } catch (err: any) {
                                                    setMsg({ type: 'error', text: err.response?.data?.message || 'Poster upload failed' });
                                                }
                                            }}
                                        />
                                    </label>
                                    {eventForm.flyerUrl ? <img src={eventForm.flyerUrl} alt="Poster preview" className="mt-3 h-36 w-full object-cover rounded-lg border border-slate-200" /> : null}
                                </div>

                                <input className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${eventErrors.mapUrl ? 'border-red-300' : ''}`} placeholder="Google map URL (optional)" value={eventForm.mapUrl} onChange={e => { setEventForm({ ...eventForm, mapUrl: e.target.value }); setEventErrors(prev => ({ ...prev, mapUrl: '' })); }} />
                                {eventErrors.mapUrl ? <p className="text-xs text-red-500 -mt-1">{eventErrors.mapUrl}</p> : null}

                                <div className="flex gap-2">
                                    <button type="submit" className="btn-primary px-6 py-3 text-sm flex items-center gap-2"><PlusCircle size={16} /> {editingEventId ? 'Update Event' : 'Publish Event'}</button>
                                    {editingEventId ? (
                                        <button type="button" onClick={() => { setEditingEventId(null); setEventForm({ title: '', description: '', locationName: '', mapUrl: '', flyerUrl: '', startDate: '', startTime: '' }); setEventErrors({}); }} className="btn-secondary px-4 py-3 text-sm">Cancel</button>
                                    ) : null}
                                </div>
                            </form>
                        </div>

                        <div className="glass-card rounded-xl p-6">
                            <h3 className="text-base font-semibold text-slate-800 mb-4">My Events</h3>
                            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                                {events
                                    .filter((event: any) => String(event.createdBy?._id || event.createdBy) === String(user?._id))
                                    .map((event: any) => (
                                        <div key={event._id} className="rounded-lg border border-slate-200 bg-white p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 mb-1">{event.title}</p>
                                                    <p className="text-xs text-slate-500">{event.locationName}</p>
                                                    {event.startAt ? <p className="text-xs text-slate-500 mt-1">{new Date(event.startAt).toLocaleString()}</p> : null}
                                                    <p className="text-[10px] mt-2 font-bold uppercase tracking-wider text-slate-400">Visibility: {event.visibilityScope || 'department'} • {event.approvalStatus || 'n/a'}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => onEditEvent(event)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"><Pencil size={14} /></button>
                                                    <button onClick={() => onDeleteEvent(event._id)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"><Trash2 size={14} /></button>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2">
                                                {(event.visibilityScope !== 'all' || event.approvalStatus !== 'approved') ? (
                                                    <button onClick={() => onRequestGlobal(event._id)} disabled={event.approvalStatus === 'pending'} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-indigo-200 text-indigo-600 bg-indigo-50 disabled:opacity-60">
                                                        {event.approvalStatus === 'pending' ? 'Pending Admin' : 'Request All Dept'}
                                                    </button>
                                                ) : null}
                                                {event.mapUrl ? (
                                                    <button onClick={() => window.open(event.mapUrl, '_blank', 'noopener,noreferrer')} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-200 text-slate-600 bg-white inline-flex items-center gap-1">
                                                        Map <ExternalLink size={10} />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                {events.filter((event: any) => String(event.createdBy?._id || event.createdBy) === String(user?._id)).length === 0 && <p className="text-sm text-slate-400">No events created yet.</p>}
                            </div>

                            <h3 className="text-base font-semibold text-slate-800 mb-4 mt-8">Student Promotion Requests</h3>
                            <div className="space-y-3 max-h-[240px] overflow-auto pr-1">
                                {promotionRequests.map((n: any) => (
                                    <div key={n._id} className="rounded-lg border border-slate-200 bg-white p-3">
                                        <p className="text-sm font-semibold text-slate-800 mb-1">{n.title}</p>
                                        <p className="text-xs text-slate-500">{n.message}</p>
                                    </div>
                                ))}
                                {promotionRequests.length === 0 && <p className="text-sm text-slate-400">No promotion requests yet.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reschedule Modal */}
                {rescheduleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                        <div className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md bg-white shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Reschedule: {rescheduleModal.subject}</h3>
                                <button onClick={() => setRescheduleModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleReschedule} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">New Date</label>
                                    <input type="date" required className="glass-input w-full px-4 py-3 rounded-xl text-sm" value={rescheduleForm.rescheduledDate} onChange={e => setRescheduleForm({ ...rescheduleForm, rescheduledDate: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
                                        <input type="time" required className="glass-input w-full px-4 py-3 rounded-xl text-sm" value={rescheduleForm.rescheduledStartTime} onChange={e => setRescheduleForm({ ...rescheduleForm, rescheduledStartTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">End Time</label>
                                        <input type="time" required className="glass-input w-full px-4 py-3 rounded-xl text-sm" value={rescheduleForm.rescheduledEndTime} onChange={e => setRescheduleForm({ ...rescheduleForm, rescheduledEndTime: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Room (optional)</label>
                                    <input className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="e.g. A-201" value={rescheduleForm.rescheduledRoom} onChange={e => setRescheduleForm({ ...rescheduleForm, rescheduledRoom: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Reason</label>
                                    <textarea required rows={2} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none" placeholder="Why is this class being rescheduled?" value={rescheduleForm.rescheduledReason} onChange={e => setRescheduleForm({ ...rescheduleForm, rescheduledReason: e.target.value })} />
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setRescheduleModal(null)} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                                    <button type="submit" className="btn-primary flex-1 py-3 text-sm">Reschedule & Notify</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
