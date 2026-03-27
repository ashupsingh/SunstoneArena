import Link from 'next/link';
import { ArrowRight, Bell, Shield, ChevronRight, Activity, Bus, Calendar, GraduationCap, Building, UserCheck, Clock3, MapPin, BookOpenCheck, Smartphone, Globe, CircleCheckBig, Sparkles, BadgeCheck } from 'lucide-react';

export default function Home() {
  const modules = [
    {
      icon: Calendar,
      title: 'Schedules That Actually Sync',
      desc: 'Teachers can create, edit, reschedule, or cancel classes. Students see changes instantly with notifications.',
      bullets: ['Department-wise access', 'Reschedule + reason', 'Cancellation notifications'],
    },
    {
      icon: Sparkles,
      title: 'Events With Registration Flow',
      desc: 'Create event posters, map links, register/unregister, and role-based visibility across departments.',
      bullets: ['Flyer upload support', 'Map open from event card', 'Approval flow for all-department visibility'],
    },
    {
      icon: Bell,
      title: 'Smart Notice Board',
      desc: 'Department notices with reactions and attachment previews across mobile and web.',
      bullets: ['Popup notifications', 'Read/unread state', 'Reaction counts'],
    },
    {
      icon: Activity,
      title: 'Campus Live Monitoring',
      desc: 'View crowd levels in blocks, sports zones, and common areas with practical filters.',
      bullets: ['Block-level breakdown', 'Crowd severity filters', 'Live + sports sources'],
    },
    {
      icon: Bus,
      title: 'Transport + Essentials',
      desc: 'Campus shuttle loops, city routes, and nearby essentials for daily student convenience.',
      bullets: ['Campus shuttle loops', 'City bus timings', 'Essentials near ADTU'],
    },
    {
      icon: Shield,
      title: 'Secure Role Control',
      desc: 'Student, teacher, and superadmin experiences are separated with focused capabilities.',
      bullets: ['Protected routes', 'Role-based actions', 'Admin approvals'],
    },
  ];

  const roleHighlights = [
    {
      icon: GraduationCap,
      role: 'Students',
      points: ['Track classes and schedule changes', 'Register/unregister events', 'Read department notices with attachments', 'Use transport and essentials info'],
    },
    {
      icon: BookOpenCheck,
      role: 'Teachers',
      points: ['Manage class schedule lifecycle', 'Post announcements with flyers', 'Create and manage events', 'Request all-department event visibility'],
    },
    {
      icon: Shield,
      role: 'SuperAdmin',
      points: ['Approve teachers and event visibility', 'Manage roles and departments', 'Broadcast global updates', 'Govern campus operations'],
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 mb-8 animate-float">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live campus updates across mobile and web
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-5xl">
            <span className="gradient-text">One Campus.</span>
            <br />
            <span className="text-slate-800">One Unified System.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Built for <strong className="text-slate-700">Assam Down Town University</strong> to connect schedules, events,
            notices, transport, and real-time campus signals in a single experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 w-full sm:w-auto">
            <Link href="/signup" className="btn-primary px-8 py-3.5 text-base flex items-center justify-center gap-2 group">
              Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3.5 text-base text-center">Open Dashboard</Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '17', label: 'Block Destinations' },
              { value: '12', label: 'Lab Categories' },
              { value: '10+', label: 'Departments' },
              { value: 'Realtime', label: 'Sync Layer' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 text-center">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE BAR ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <div className="inline-flex items-center gap-2 text-sm text-slate-600"><Smartphone size={16} className="text-indigo-500" /> Mobile + Web parity</div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-600"><Globe size={16} className="text-indigo-500" /> Shared backend APIs</div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-600"><Clock3 size={16} className="text-indigo-500" /> Instant update sync</div>
            </div>
            <Link href="/login" className="btn-secondary px-5 py-2.5 text-sm text-center">Explore Live Modules</Link>
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Everything In One Information Layer</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">No more scattered updates across groups and channels. This system gives students, teachers, and admins a single operational truth.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:border-indigo-300 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition">
                  <f.icon size={20} className="text-indigo-500" />
                </div>
                <h3 className="text-slate-800 font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                <div className="mt-4 space-y-1.5">
                  {f.bullets.map((point) => (
                    <div key={point} className="inline-flex items-center gap-2 text-xs text-slate-500 mr-3">
                      <CircleCheckBig size={12} className="text-emerald-500" /> {point}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ─── */}
      <section className="relative border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Role-Specific Dashboards</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Each role sees only what they need, with workflows designed for daily campus operations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleHighlights.map((r, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 sm:p-8">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5">
                  <r.icon size={24} className="text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{r.role}</h3>
                <ul className="space-y-2.5">
                  {r.points.map((f, j) => (
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

      {/* ─── CAMPUS COVERAGE ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">Built Around Real ADTU Flows</h2>
              <p className="text-slate-500 leading-relaxed mb-6">From main gate movement to class updates and event approvals, this platform mirrors the way campus actually runs day-to-day.</p>
              <div className="space-y-3">
                {[
                  'Department-scoped schedules and notices',
                  'Event posting with approval for all-department visibility',
                  'Transport details including shuttle loops and city routes',
                  'Crowd visibility for block-level decision making',
                ].map((item) => (
                  <div key={item} className="inline-flex items-start gap-2 text-sm text-slate-600 w-full">
                    <BadgeCheck size={16} className="text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 border-indigo-200/60">
              <h3 className="text-base font-semibold text-slate-800 mb-4">What Students Actually Need</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><MapPin size={15} className="text-indigo-500" /> Where is my class/event?</div>
                <div className="flex items-center gap-2"><Clock3 size={15} className="text-indigo-500" /> Has today&apos;s schedule changed?</div>
                <div className="flex items-center gap-2"><Bus size={15} className="text-indigo-500" /> When is the next shuttle/bus?</div>
                <div className="flex items-center gap-2"><Bell size={15} className="text-indigo-500" /> Any important notice from teacher?</div>
                <div className="flex items-center gap-2"><UserCheck size={15} className="text-indigo-500" /> Which updates are relevant to my department?</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200/50">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4 relative z-10">Ready To Run Campus Operations Better?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mb-8 relative z-10">Start with account setup and get schedule, events, notices, transport, and live campus insights in one dashboard.</p>
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
      <footer className="border-t border-slate-200 py-12 sm:py-14 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-semibold text-slate-700">Syntax<span className="text-indigo-500">Error</span></span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">ADTU Smart Campus Management</span>
              </div>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                A unified campus platform for schedules, notices, events, transport, and crowd updates across web and mobile.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Clock3 size={13} className="text-indigo-500" /> Realtime updates</span>
                <span className="inline-flex items-center gap-1.5"><Shield size={13} className="text-indigo-500" /> Secure role access</span>
                <span className="inline-flex items-center gap-1.5"><Smartphone size={13} className="text-indigo-500" /> Mobile + Web</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/" className="block hover:text-indigo-600 transition-colors">Home</Link>
                <Link href="/login" className="block hover:text-indigo-600 transition-colors">Login</Link>
                <Link href="/signup" className="block hover:text-indigo-600 transition-colors">Create Account</Link>
                <Link href="/forgot-password" className="block hover:text-indigo-600 transition-colors">Reset Password</Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Modules</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <span className="block">Class Schedules</span>
                <span className="block">Events & Registration</span>
                <span className="block">Notice Board</span>
                <span className="block">Transport & Essentials</span>
                <span className="block">Campus Crowd Monitor</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Role Access</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/dashboard" className="block hover:text-indigo-600 transition-colors">Student Dashboard</Link>
                <Link href="/teacher" className="block hover:text-indigo-600 transition-colors">Teacher Portal</Link>
                <Link href="/superadmin" className="block hover:text-indigo-600 transition-colors">SuperAdmin Panel</Link>
                <span className="block">Support: support@adtu.in</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} SyntaxError. Built for Assam Down Town University.</p>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Campus Operations Platform</span>
              <span className="text-slate-300">•</span>
              <span>Assam, India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
