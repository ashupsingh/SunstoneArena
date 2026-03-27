"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Settings, ChevronDown, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminPanel() {
    const { user } = useAuth();
    const [foodCourts, setFoodCourts] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        foodCourtId: '',
        peopleCount: '',
        crowdLevel: 'LOW'
    });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const { data } = await api.get('/crowd/status');
                const uniqueCourts = data.map((d: any) => d.foodCourtId);
                setFoodCourts(uniqueCourts);
                if (uniqueCourts.length > 0) {
                    setFormData(f => ({ ...f, foodCourtId: uniqueCourts[0]._id }));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchCourts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        setLoading(true);

        if (!formData.foodCourtId) {
            setMsg({ type: 'error', text: 'No Food Court selected. Please seed the database first.' });
            setLoading(false);
            return;
        }

        try {
            await api.post('/crowd/update', {
                foodCourtId: formData.foodCourtId,
                peopleCount: Number(formData.peopleCount),
                crowdLevel: formData.crowdLevel
            });
            setMsg({ type: 'success', text: 'Crowd status updated successfully!' });
        } catch (err: any) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Error updating status' });
        } finally {
            setLoading(false);
        }
    };

    const levelConfig: Record<string, { active: string; inactive: string }> = {
        LOW: { active: 'border-emerald-400 bg-emerald-50 text-emerald-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
        MEDIUM: { active: 'border-amber-400 bg-amber-50 text-amber-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
        HIGH: { active: 'border-orange-400 bg-orange-50 text-orange-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
        OVERCROWDED: { active: 'border-red-400 bg-red-50 text-red-600', inactive: 'border-slate-200 text-slate-500 hover:bg-slate-50' },
    };

    // If user is not superadmin, show access denied
    if (user && user.role !== 'superadmin') {
        return (
            <ProtectedRoute>
                <div className="max-w-lg mx-auto mt-20 text-center">
                    <div className="glass-card rounded-2xl p-10">
                        <ShieldAlert size={48} className="text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
                        <p className="text-slate-500 text-sm">
                            You need administrator privileges to access this panel.
                            Contact the system admin if you believe this is an error.
                        </p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="max-w-2xl mx-auto mt-4 px-4">
                <div className="glass-card rounded-2xl p-8 sm:p-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Settings size={20} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Crowd Manager</h2>
                            <p className="text-slate-500 text-xs">Manually update crowd data for testing</p>
                        </div>
                    </div>

                    {foodCourts.length === 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                            <strong>Note:</strong> No food courts found. Run <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">node seed.js</code> on the server to seed the database.
                        </div>
                    )}

                    {msg.text && (
                        <div className={`mb-6 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === 'error'
                            ? 'bg-red-50 border border-red-200 text-red-600'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${msg.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Food Court</label>
                            <div className="relative">
                                <select
                                    required
                                    className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
                                    value={formData.foodCourtId}
                                    onChange={(e) => setFormData({ ...formData, foodCourtId: e.target.value })}
                                >
                                    <option value="" disabled>Select a food court</option>
                                    {foodCourts.map(fc => (
                                        <option key={fc._id} value={fc._id}>{fc.name} — {fc.location}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">People Count</label>
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="e.g., 85"
                                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                                value={formData.peopleCount}
                                onChange={(e) => setFormData({ ...formData, peopleCount: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Crowd Level</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {(['LOW', 'MEDIUM', 'HIGH', 'OVERCROWDED'] as const).map(level => (
                                    <label key={level} className={`cursor-pointer text-center py-2.5 px-3 border rounded-xl text-xs font-bold transition-all ${formData.crowdLevel === level ? levelConfig[level].active : levelConfig[level].inactive
                                        }`}>
                                        <input
                                            type="radio"
                                            name="crowdLevel"
                                            value={level}
                                            checked={formData.crowdLevel === level}
                                            onChange={(e) => setFormData({ ...formData, crowdLevel: e.target.value })}
                                            className="hidden"
                                        />
                                        {level}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || foodCourts.length === 0}
                            className="btn-primary w-full py-3 mt-2 text-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Publish Update'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}
