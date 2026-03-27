"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Users, BarChart3, Building, Megaphone, Trash2, ShieldCheck, GraduationCap,
    BookOpen, Send, ChevronDown, ArrowLeft, Settings, Coffee,
    Menu, X, Home, Bell, ChevronRight, AlertTriangle
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'approvals' | 'flags' | 'departments' | 'crowd' | 'broadcast';

export default function SuperAdminDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [foodCourts, setFoodCourts] = useState<any[]>([]);
    const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
    const [flaggedStudents, setFlaggedStudents] = useState<any[]>([]);
    const [tab, setTab] = useState<Tab>('overview');
    const [filterRole, setFilterRole] = useState('');
    const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', targetRole: 'all', targetDepartment: '' });
    const [crowdForm, setCrowdForm] = useState({ foodCourtId: '', peopleCount: '', crowdLevel: 'LOW' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [s, u, d, c, pt, fs] = await Promise.all([
                api.get('/admin/stats').catch(() => ({ data: {} })),
                api.get('/admin/users').catch(() => ({ data: [] })),
                api.get('/departments').catch(() => ({ data: [] })),
                api.get('/crowd/status').catch(() => ({ data: [] })),
                api.get('/admin/teachers/pending').catch(() => ({ data: [] })),
                api.get('/admin/students/flagged').catch(() => ({ data: [] })),
            ]);
            setStats(s.data);
            setUsers(u.data);
            setDepartments(d.data);
            setPendingTeachers(pt.data);
            setFlaggedStudents(fs.data);
            const courts = c.data.map((d: any) => d.foodCourtId);
            setFoodCourts(courts);
            if (courts.length > 0 && !crowdForm.foodCourtId) {
                setCrowdForm(f => ({ ...f, foodCourtId: courts[0]._id }));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try { await api.put(`/admin/users/${userId}/role`, { role: newRole }); setMsg({ type: 'success', text: 'Role updated!' }); fetchAll(); }
        catch (err: any) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    };

    const handleApproveTeacher = async (teacherId: string) => {
        try { 
            await api.put(`/admin/teachers/${teacherId}/approve`); 
            setMsg({ type: 'success', text: 'Teacher approved successfully!' }); 
            fetchAll(); 
        }
        catch (err: any) { setMsg({ type: 'error', text: err.response?.data?.message || 'Approval failed' }); }
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/users/${deleteModal.id}`);
            setMsg({ type: 'success', text: `${deleteModal.name} has been deleted.` });
            fetchAll();
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
        } finally {
            setDeleting(false);
            setDeleteModal(null);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault(); setMsg({ type: '', text: '' });
        try {
            const { data } = await api.post('/admin/broadcast', broadcastForm);
            setMsg({ type: 'success', text: `Broadcast sent to ${data.recipientCount} users!` });
            setBroadcastForm({ title: '', message: '', targetRole: 'all', targetDepartment: '' });
        } catch (err: any) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    };

    const handleCrowdUpdate = async (e: React.FormEvent) => {
        e.preventDefault(); setMsg({ type: '', text: '' });
        try {
            await api.post('/crowd/update', {
                foodCourtId: crowdForm.foodCourtId,
                peopleCount: Number(crowdForm.peopleCount),
                crowdLevel: crowdForm.crowdLevel
            });
            setMsg({ type: 'success', text: 'Crowd status updated!' });
        } catch (err: any) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    };

    const handleHodToggle = async (deptId: string) => {
        try { await api.put(`/departments/${deptId}/hod-toggle`); setMsg({ type: 'success', text: 'HOD availability toggled.' }); fetchAll(); }
        catch (err: any) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    };

    const filteredUsers = filterRole ? users.filter(u => u.role === filterRole) : users;

    const sidebarItems: { key: Tab; icon: any; label: string }[] = [
        { key: 'overview', icon: BarChart3, label: 'Overview' },
        { key: 'users', icon: Users, label: 'Users' },
        { key: 'approvals', icon: ShieldCheck, label: 'Approvals' },
        { key: 'flags', icon: AlertTriangle, label: 'Flagged Users' },
        { key: 'departments', icon: Building, label: 'Departments' },
        { key: 'crowd', icon: Coffee, label: 'Crowd Manager' },
        { key: 'broadcast', icon: Megaphone, label: 'Broadcast' },
    ];

    if (loading) {
        return <ProtectedRoute><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /></div></ProtectedRoute>;
    }

    if (user && user.role !== 'superadmin') {
        return (
            <ProtectedRoute>
                <div className="max-w-lg mx-auto mt-20 text-center">
                    <div className="glass-card rounded-2xl p-10">
                        <ShieldCheck size={48} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
                        <p className="text-slate-500 text-sm">SuperAdmin access required.</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const levelConfig: Record<string, { active: string; inactive: string }> = {
        LOW: { active: 'border-emerald-400 bg-emerald-50 text-emerald-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
        MEDIUM: { active: 'border-amber-400 bg-amber-50 text-amber-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
        HIGH: { active: 'border-orange-400 bg-orange-50 text-orange-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
        OVERCROWDED: { active: 'border-red-400 bg-red-50 text-red-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
    };

    return (
        <ProtectedRoute>
            <div className="flex min-h-screen">
                {/* ─── DELETE CONFIRMATION MODAL ─── */}
                {deleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-200">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={24} className="text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Delete User</h3>
                                <p className="text-sm text-slate-500 mb-1">
                                    Are you sure you want to permanently delete
                                </p>
                                <p className="text-sm font-semibold text-slate-700 mb-6">
                                    {deleteModal.name}?
                                </p>
                                <p className="text-xs text-slate-400 mb-6">This action cannot be undone.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal(null)}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition flex items-center justify-center gap-2"
                                >
                                    {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 size={14} /> Delete</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── SIDEBAR ─── */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                    <ShieldCheck size={16} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Admin Panel</h2>
                                    <p className="text-[10px] text-slate-400">{user?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {sidebarItems.map(item => (
                            <button
                                key={item.key}
                                onClick={() => { setTab(item.key); setSidebarOpen(false); setMsg({ type: '', text: '' }); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.key
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {tab === item.key && <ChevronRight size={14} className="ml-auto" />}
                            </button>
                        ))}
                    </nav>

                    <div className="p-3 border-t border-slate-100 space-y-1">
                        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <Home size={18} /> Back to Site
                        </Link>
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-50 hover:text-red-500 transition-all">
                            <ArrowLeft size={18} /> Logout
                        </button>
                    </div>
                </aside>

                {/* ─── MAIN CONTENT ─── */}
                <main className="flex-1 min-w-0 flex flex-col">
                    {/* Top Bar */}
                    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                                <Menu size={20} />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-lg font-bold text-slate-800 capitalize">{tab === 'crowd' ? 'Crowd Manager' : tab}</h1>
                                <p className="text-xs text-slate-400 hidden sm:block">
                                    {tab === 'overview' && 'Platform statistics at a glance'}
                                    {tab === 'users' && `${users.length} registered users`}
                                    {tab === 'approvals' && `${pendingTeachers.length} teachers awaiting approval`}
                                    {tab === 'flags' && `${flaggedStudents.length} students flagged by teachers`}
                                    {tab === 'departments' && `${departments.length} departments`}
                                    {tab === 'crowd' && 'Update food court crowd levels'}
                                    {tab === 'broadcast' && 'Send notifications to users'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Area — fills remaining space */}
                    <div className="flex-1 p-4 sm:p-6 lg:p-8">
                        {msg.text && (
                            <div className={`mb-6 p-3 rounded-xl text-sm flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${msg.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                {msg.text}
                            </div>
                        )}

                        {/* ── OVERVIEW ── */}
                        {tab === 'overview' && stats && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {[
                                        { label: 'Students', value: stats.students, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' },
                                        { label: 'Teachers', value: stats.teachers, icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50' },
                                        { label: 'Departments', value: stats.departments, icon: Building, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                        { label: 'Schedules', value: stats.schedules, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' },
                                        { label: 'Notifications', value: stats.notifications, icon: Bell, color: 'text-pink-500', bg: 'bg-pink-50' },
                                    ].map((s, i) => (
                                        <div key={i} className="glass-card rounded-xl p-5">
                                            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                                                <s.icon size={18} className={s.color} />
                                            </div>
                                            <p className="text-2xl font-bold text-slate-800">{s.value ?? 0}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="glass-card rounded-xl">
                                    <div className="flex items-center justify-between p-5 pb-3">
                                        <h3 className="text-sm font-semibold text-slate-800">Recent Users</h3>
                                        <button onClick={() => setTab('users')} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">View all →</button>
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {users.slice(0, 5).map(u => (
                                                <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white text-[10px] font-bold">{u.name?.charAt(0)}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-slate-700 font-medium text-xs">{u.name}</p>
                                                                <p className="text-slate-400 text-[10px]">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 hidden sm:table-cell">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${u.role === 'superadmin' ? 'bg-red-50 text-red-500' : u.role === 'teacher' ? 'bg-violet-50 text-violet-500' : 'bg-blue-50 text-blue-500'
                                                            }`}>{u.role}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-400 text-xs hidden md:table-cell">{u.departmentName || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── USERS ── */}
                        {tab === 'users' && (
                            <div className="space-y-4">
                                <div className="flex gap-2 flex-wrap">
                                    {['', 'student', 'teacher', 'superadmin'].map(r => (
                                        <button key={r} onClick={() => setFilterRole(r)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filterRole === r ? 'bg-indigo-50 text-indigo-600 border border-indigo-300' : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                }`}>
                                            {r || 'All'} ({r ? users.filter(u => u.role === r).length : users.length})
                                        </button>
                                    ))}
                                </div>
                                <div className="glass-card rounded-xl overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left p-4 text-slate-500 font-medium text-xs">User</th>
                                                <th className="text-left p-4 text-slate-500 font-medium text-xs hidden sm:table-cell">Email</th>
                                                <th className="text-left p-4 text-slate-500 font-medium text-xs">Role</th>
                                                <th className="text-left p-4 text-slate-500 font-medium text-xs hidden md:table-cell">Department</th>
                                                <th className="text-right p-4 text-slate-500 font-medium text-xs w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(u => (
                                                <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white text-[10px] font-bold">{u.name?.charAt(0)}</span>
                                                            </div>
                                                            <span className="text-slate-700 text-xs font-medium">{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-400 text-xs hidden sm:table-cell">{u.email}</td>
                                                    <td className="p-4">
                                                        <div className="relative">
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                                                disabled={u.role === 'superadmin' || user?._id === u._id}
                                                                className="glass-input px-2 py-1 rounded-lg text-xs pr-6 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 capitalize"
                                                            >
                                                                <option value="student">Student</option>
                                                                <option value="teacher">Teacher</option>
                                                                <option value="superadmin">SuperAdmin</option>
                                                            </select>
                                                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-400 text-xs hidden md:table-cell">{u.departmentName || u.department?.name || '—'}</td>
                                                    <td className="p-4 text-right">
                                                        {u.role === 'superadmin' ? (
                                                            <span className="text-[10px] text-slate-300 font-medium px-2 py-1 rounded bg-slate-50 border border-slate-100">Protected</span>
                                                        ) : (
                                                            <button onClick={() => setDeleteModal({ id: u._id, name: u.name })} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete user">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── APPROVALS ── */}
                        {tab === 'approvals' && (
                            <div className="glass-card rounded-xl overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left p-4 text-slate-500 font-medium text-xs">Teacher Name</th>
                                            <th className="text-left p-4 text-slate-500 font-medium text-xs">Email</th>
                                            <th className="text-left p-4 text-slate-500 font-medium text-xs">Department</th>
                                            <th className="text-right p-4 text-slate-500 font-medium text-xs">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingTeachers.map(pt => (
                                            <tr key={pt._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="p-4">
                                                    <span className="text-slate-700 text-xs font-medium">{pt.name}</span>
                                                </td>
                                                <td className="p-4 text-slate-500 text-xs">{pt.email}</td>
                                                <td className="p-4 text-slate-500 text-xs">{pt.departmentName || pt.department?.name || '—'}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleApproveTeacher(pt._id)} className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-600 transition">
                                                        Approve
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pendingTeachers.length === 0 && <p className="text-sm text-slate-400 text-center py-10">No pending teachers at this time.</p>}
                            </div>
                        )}

                        {/* ── FLAGGED USERS ── */}
                        {tab === 'flags' && (
                            <div className="glass-card rounded-xl overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left p-4 text-slate-500 font-medium text-xs">Student</th>
                                            <th className="text-left p-4 text-slate-500 font-medium text-xs">Department</th>
                                            <th className="text-left p-4 text-slate-500 font-medium text-xs">Reason Flagged</th>
                                            <th className="text-right p-4 text-slate-500 font-medium text-xs">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flaggedStudents.map(fs => (
                                            <tr key={fs._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="text-slate-700 text-xs font-medium">{fs.name}</p>
                                                        <p className="text-[10px] text-slate-400">{fs.email}</p>
                                                        <p className="text-[10px] text-slate-400">{fs.enrollmentNumber ? `Enrollment: ${fs.enrollmentNumber}` : ''}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-500 text-xs">{fs.departmentName || fs.department?.name || '—'}</td>
                                                <td className="p-4">
                                                    <span className="text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                                        {fs.flagReason || 'No reason provided'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setDeleteModal({ id: fs._id, name: fs.name })} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete User">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {flaggedStudents.length === 0 && <p className="text-sm text-slate-400 text-center py-10">No students are currently flagged.</p>}
                            </div>
                        )}

                        {/* ── DEPARTMENTS ── */}
                        {tab === 'departments' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {departments.map(d => (
                                    <div key={d._id} className="glass-card rounded-xl p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-800">{d.name}</h3>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{d.code} • {d.building || 'N/A'}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${d.hodAvailable ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                                                {d.hodAvailable ? 'HOD In' : 'HOD Away'}
                                            </span>
                                        </div>
                                        {d.hodName && <p className="text-xs text-slate-500 mb-3">HOD: {d.hodName}</p>}
                                        <button onClick={() => handleHodToggle(d._id)}
                                            className={`w-full py-2 rounded-lg text-xs font-medium transition ${d.hodAvailable ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                            {d.hodAvailable ? 'Set Away' : 'Set Available'}
                                        </button>
                                    </div>
                                ))}
                                {departments.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-slate-400 text-sm">No departments found. Run <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">node seed.js</code></div>
                                )}
                            </div>
                        )}

                        {/* ── CROWD MANAGER ── */}
                        {tab === 'crowd' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2"><Coffee size={16} className="text-indigo-500" /> Update Crowd Status</h3>
                                    {foodCourts.length === 0 && (
                                        <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                                            <strong>Note:</strong> No food courts found. Run <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">node seed.js</code>
                                        </div>
                                    )}
                                    <form onSubmit={handleCrowdUpdate} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Food Court</label>
                                            <div className="relative">
                                                <select required className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
                                                    value={crowdForm.foodCourtId} onChange={(e) => setCrowdForm({ ...crowdForm, foodCourtId: e.target.value })}>
                                                    <option value="" disabled>Select food court</option>
                                                    {foodCourts.map(fc => <option key={fc._id} value={fc._id}>{fc.name} — {fc.location}</option>)}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">People Count</label>
                                            <input type="number" required min="0" placeholder="e.g., 85"
                                                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                                value={crowdForm.peopleCount} onChange={(e) => setCrowdForm({ ...crowdForm, peopleCount: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Crowd Level</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {(['LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'] as const).map(level => (
                                                    <label key={level} className={`cursor-pointer text-center py-2.5 px-3 border rounded-xl text-xs font-bold transition-all ${crowdForm.crowdLevel === level ? levelConfig[level].active : levelConfig[level].inactive}`}>
                                                        <input type="radio" name="crowdLevel" value={level} checked={crowdForm.crowdLevel === level}
                                                            onChange={(e) => setCrowdForm({ ...crowdForm, crowdLevel: e.target.value })} className="hidden" />
                                                        {level}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <button type="submit" disabled={foodCourts.length === 0}
                                            className="btn-primary w-full py-3 text-sm">Publish Update</button>
                                    </form>
                                </div>

                                {/* Current status preview */}
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-500" /> Current Status</h3>
                                    <div className="space-y-3">
                                        {foodCourts.map(fc => {
                                            const status = crowdForm.foodCourtId === fc._id;
                                            return (
                                                <div key={fc._id} className={`p-4 rounded-xl border transition-all ${status ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-700">{fc.name}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{fc.location}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-500">Capacity</p>
                                                            <p className="text-sm font-bold text-slate-700">{fc.capacity}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {foodCourts.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No food courts available</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── BROADCAST ── */}
                        {tab === 'broadcast' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2"><Megaphone size={16} className="text-indigo-500" /> New Broadcast</h3>
                                    <form onSubmit={handleBroadcast} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Title</label>
                                            <input required className="glass-input w-full px-4 py-3 rounded-xl text-sm" placeholder="Announcement title"
                                                value={broadcastForm.title} onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 mb-2">Message</label>
                                            <textarea required rows={5} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none" placeholder="Type your broadcast..."
                                                value={broadcastForm.message} onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-2">Target Audience</label>
                                                <select className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                                    value={broadcastForm.targetRole} onChange={e => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}>
                                                    <option value="all">Everyone</option>
                                                    <option value="student">Students only</option>
                                                    <option value="teacher">Teachers only</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-2">Department</label>
                                                <select className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                                    value={broadcastForm.targetDepartment} onChange={e => setBroadcastForm({ ...broadcastForm, targetDepartment: e.target.value })}>
                                                    <option value="">All departments</option>
                                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"><Send size={16} /> Send Broadcast</button>
                                    </form>
                                </div>

                                {/* Broadcast tips panel */}
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-4">📋 Broadcast Tips</h3>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Target wisely', desc: 'Use audience filters to send relevant messages to the right group.' },
                                            { title: 'Keep it concise', desc: 'Short, clear messages get more engagement than long announcements.' },
                                            { title: 'Timing matters', desc: 'Avoid sending broadcasts during late night hours.' },
                                            { title: 'Email delivery', desc: 'All broadcasts are sent via email and appear as dashboard notifications.' },
                                        ].map((tip, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                <span className="text-indigo-500 font-bold text-xs mt-0.5">{i + 1}</span>
                                                <div>
                                                    <p className="text-xs font-medium text-slate-700">{tip.title}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{tip.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
