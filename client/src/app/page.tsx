import Link from 'next/link';
import { ArrowRight, Zap, Map, Bell, Users, Camera, Shield, ChevronRight, Activity, Bus, Calendar, GraduationCap, Building, UserCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 mb-8 animate-float">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live campus monitoring active
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-5xl">
            <span className="gradient-text">Smart Campus</span>
            <br />
            <span className="text-slate-800">Management System</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Built for <strong className="text-slate-700">Assam Down Town University</strong>.
            Track food court crowds, lab schedules, bus timings,
            HOD availability — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 w-full sm:w-auto">
            <Link href="/signup" className="btn-primary px-8 py-3.5 text-base flex items-center justify-center gap-2 group">
              Get Started Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3.5 text-base text-center">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '10+', label: 'Departments' },
              { value: '8+', label: 'Labs Monitored' },
              { value: '3', label: 'Bus Routes' },
              { value: 'Live', label: 'Crowd Updates' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Everything Your Campus Needs</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From cafeteria crowds to class rescheduling — one unified platform for students, teachers, and admins.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: 'Food Court Crowds', desc: 'Real-time crowd levels for all campus cafeterias. Get smart suggestions for less crowded alternatives.' },
              { icon: Calendar, title: 'Class & Lab Schedules', desc: 'View your daily timetable. Teachers can reschedule classes and students get instant email + app notifications.' },
              { icon: Bus, title: 'Bus Timings', desc: 'All ADTU bus routes with stop-by-stop timings. Never miss your campus bus again.' },
              { icon: UserCheck, title: 'HOD Availability', desc: 'Check if your department HOD is in their office before making the trip.' },
              { icon: Bell, title: 'Smart Notifications', desc: 'Rescheduled class? Cancelled lab? Get instant alerts on your dashboard and email inbox.' },
              { icon: Shield, title: 'Role-Based Access', desc: 'Three dashboards — Student, Teacher, SuperAdmin. Each with purpose-built features.' },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:border-indigo-300 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition">
                  <f.icon size={20} className="text-indigo-500" />
                </div>
                <h3 className="text-slate-800 font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ─── */}
      <section className="relative border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Built for Everyone</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Students', features: ['View daily schedule', 'Food court crowd status', 'Bus timings & routes', 'HOD availability', 'Receive notifications'] },
              { icon: Building, title: 'Teachers', features: ['View & manage schedule', 'Reschedule / cancel classes', 'View department students', 'Send announcements', 'Toggle HOD availability'] },
              { icon: Shield, title: 'SuperAdmin', features: ['Manage all users & roles', 'Manage departments', 'Update crowd data', 'Broadcast notifications', 'View campus analytics'] },
            ].map((r, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5">
                  <r.icon size={24} className="text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{r.title}</h3>
                <ul className="space-y-2.5">
                  {r.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200/50">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4 relative z-10">Ready to Experience Smart Campus?</h2>
            <p className="text-slate-500 max-w-lg mx-auto mb-8 relative z-10">Create your free account and access real-time campus data. Students and teachers welcome.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link href="/signup" className="btn-primary px-8 py-3.5 text-base flex items-center justify-center gap-2 group">
                Create Free Account <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="btn-secondary px-8 py-3.5 text-base text-center">I Already Have an Account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500">Syntax<span className="text-indigo-500">Error</span></span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-400">ADTU Smart Campus Management</span>
            </div>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} SyntaxError. Built for Assam Down Town University.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
