import React from 'react';
import { Users, MapPin } from 'lucide-react';

interface FoodCourtProps {
    _id: string;
    foodCourtId: {
        _id: string;
        name: string;
        location: string;
        capacity: number;
    };
    peopleCount: number;
    crowdLevel: string;
    updatedAt: string;
}

export default function FoodCourtCard({ data }: { data: FoodCourtProps }) {
    const { foodCourtId, peopleCount, crowdLevel, updatedAt } = data;

    const levelColors: Record<string, string> = {
        LOW: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        MEDIUM: 'bg-amber-50 text-amber-600 border-amber-200',
        HIGH: 'bg-orange-50 text-orange-600 border-orange-200',
        OVERCROWDED: 'bg-red-50 text-red-600 border-red-200',
    };

    const ringColors: Record<string, string> = {
        LOW: 'text-emerald-500',
        MEDIUM: 'text-amber-500',
        HIGH: 'text-orange-500',
        OVERCROWDED: 'text-red-500',
    };

    const percentage = Math.min(100, (peopleCount / foodCourtId.capacity) * 100);

    return (
        <div className="glass-card rounded-2xl p-5 hover:border-indigo-300 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 group-hover:text-indigo-600 transition">{foodCourtId.name}</h3>
                    <div className="flex items-center text-slate-400 text-xs mt-1 gap-1">
                        <MapPin size={12} />
                        <span>{foodCourtId.location}</span>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${levelColors[crowdLevel]}`}>
                    {crowdLevel}
                </span>
            </div>

            <div className="flex items-center gap-4">
                {/* Progress Circle */}
                <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                    <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="24" fill="none" className="text-slate-200" strokeWidth="3.5" stroke="currentColor" />
                        <circle
                            cx="28" cy="28" r="24"
                            fill="none"
                            className={ringColors[crowdLevel]}
                            strokeWidth="3.5"
                            stroke="currentColor"
                            strokeDasharray="150.8"
                            strokeDashoffset={150.8 - (150.8 * percentage) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="text-xs font-bold text-slate-700">{Math.round(percentage)}%</span>
                </div>

                <div>
                    <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <Users size={16} className="text-slate-400" />
                        {peopleCount}
                        <span className="text-sm font-normal text-slate-400">/ {foodCourtId.capacity}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        Updated {new Date(updatedAt).toLocaleTimeString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
