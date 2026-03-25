"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Users, Calendar, Megaphone, Clock, MapPin, RefreshCw, AlertTriangle, Send, BookOpen, Plus, X } from 'lucide-react';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'schedule' | 'students' | 'announce'>('schedule');
    const [rescheduleModal, setRescheduleModal] = useState<any>(null);
    const [rescheduleForm, setRescheduleForm] = useState({ rescheduledDate: '', rescheduledStartTime: '', rescheduledEndTime: '', rescheduledRoom: '', rescheduledReason: '' });
    const [announceForm, setAnnounceForm] = useState({ title: '', message: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sched, studs] = await Promise.all([
                api.get('/schedules/mine').catch(() => ({ data: [] })),
                api.get('/teacher/students').catch(() => ({ data: [] })),
            ]);
            setSchedules(sched.data);
            setStudents(studs.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
        try {
            const { data } = await api.post('/teacher/announce', announceForm);
            setMsg({ type: 'success', text: `Announcement sent to ${data.studentsNotified} students!` });
            setAnnounceForm({ title: '', message: '' });
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
    };

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
                                <input required className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Announcement title" value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Message</label>
                                <textarea required rows={4} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none" placeholder="Type your announcement..." value={announceForm.message} onChange={e => setAnnounceForm({ ...announceForm, message: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary px-6 py-3 text-sm flex items-center gap-2"><Send size={16} /> Send to Department</button>
                        </form>
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
