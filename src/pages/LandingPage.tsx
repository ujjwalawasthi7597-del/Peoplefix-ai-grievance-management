import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Search,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Droplets,
  Zap,
  Trash2,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ComplaintCategory } from '../types/index.ts';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenComplaint: (id: string) => void;
}

const CATEGORIES: Array<{
  name: ComplaintCategory;
  icon: any;
  color: string;
  desc: string;
}> = [
  { name: 'Road Damage / Potholes', icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Crater potholes, broken tarmac, uneven asphalt' },
  { name: 'Garbage Collection', icon: Trash2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Overflowing dumpsters, litter accumulation, missed pickups' },
  { name: 'Streetlight Failure', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Dark streetlights, flickering lamps, exposed junction cables' },
  { name: 'Water Leakage', icon: Droplets, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', desc: 'Water pipeline ruptures, leaking valves, low water pressure' },
  { name: 'Drainage Problems', icon: Layers, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', desc: 'Clogged storm culverts, monsoon waterlogging' },
  { name: 'Sewage Overflow', icon: AlertCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', desc: 'Manhole overflow, sewage backup, contamination risks' },
  { name: 'Public Sanitation', icon: Activity, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', desc: 'Public restrooms maintenance, unhygienic spots' },
  { name: 'Broken Footpaths', icon: Truck, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', desc: 'Broken paver blocks, missing curb stones, sidewalk hazards' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenComplaint }) => {
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackError, setTrackError] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) {
      setTrackError('Please enter a complaint tracking ID.');
      return;
    }
    setTrackError('');
    onOpenComplaint(trackingQuery.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-slate-900 bg-radial-[at_top_right] from-emerald-950/20 via-slate-950 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-emerald-400 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Civic Governance Platform</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Powered by Gemini AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Fix Your City. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                Track Real Resolutions.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Report potholes, broken streetlights, water leaks, and garbage overflow in seconds. Our AI categorizes your grievance, assigns the exact municipal crew, and tracks photo-verified resolution.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('report')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Report an Issue Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('map')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Explore Live Issue Map</span>
              </button>
            </div>

            {/* Instant Complaint Tracker Bar */}
            <div className="pt-8 max-w-xl mx-auto">
              <form onSubmit={handleTrackSubmit} className="relative">
                <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 shadow-2xl focus-within:border-emerald-500/50 transition">
                  <div className="pl-3 text-slate-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => {
                      setTrackingQuery(e.target.value);
                      setTrackError('');
                    }}
                    placeholder="Enter Tracking ID (e.g., CF-2026-1001 or CF-2026-1004)..."
                    className="w-full bg-transparent border-0 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white transition flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <span>Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {trackError && <p className="text-rose-400 text-xs mt-1 text-left pl-3">{trackError}</p>}
                <p className="text-[11px] text-slate-500 mt-2">
                  Tip: Try tracking seeded complaints <button type="button" onClick={() => onOpenComplaint('CF-2026-1001')} className="text-emerald-400 underline font-mono">CF-2026-1001</button> or <button type="button" onClick={() => onOpenComplaint('CF-2026-1004')} className="text-emerald-400 underline font-mono">CF-2026-1004</button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Live Civic Performance Ticker */}
      <section className="bg-slate-900/50 border-b border-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">94.8%</div>
              <div className="text-xs text-slate-400 mt-0.5">SLA Compliance Rate</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">18.4 hrs</div>
              <div className="text-xs text-slate-400 mt-0.5">Avg Resolution Turnaround</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Photo Evidence Verification</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-400">6</div>
              <div className="text-xs text-slate-400 mt-0.5">Connected Municipal Depts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">What Civic Problem Can We Fix?</h2>
          <p className="text-slate-400 text-sm mt-2">
            Select an issue category to get started. Our AI will automatically identify priority and route directly to the designated department.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => onNavigate('report')}
                className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${cat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-emerald-400">
                  <span>Report this</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Transparent Municipal Resolution Pipeline</h2>
            <p className="text-slate-400 text-sm mt-2">
              From submission to photographic proof of resolution, every step is logged and audited.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-slate-800 absolute top-4 right-4">01</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Photo & Location Pin</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Snap a photo on your smartphone or choose from gallery. Leaflet automatically tags exact coordinates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-slate-800 absolute top-4 right-4">02</span>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">AI Classification</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Gemini 3.8 Flash assesses severity, detects duplicate reports nearby, and sets an enforceable SLA deadline.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-slate-800 absolute top-4 right-4">03</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Department Field Crew</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Designated department officers receive instant mobile dispatch alerts and update live progress stages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative">
              <span className="text-3xl font-black text-slate-800 absolute top-4 right-4">04</span>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Resolution & Evidence</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Officers upload photographic evidence of completed repair. Citizens rate satisfaction or reopen if needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Resolutions Showcase */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Recently Resolved Grievances</h2>
            <p className="text-slate-400 text-sm mt-1">Verified resolutions with before and after repair evidence</p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
          >
            <span>View All on Live Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => onOpenComplaint('CF-2026-1004')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-emerald-400">CF-2026-1004</span>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Resolved in 48h
                </span>
              </div>
              <h3 className="font-bold text-white text-base">Flickering and dead streetlights along Pine Avenue</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Replaced ballast and fitted 3 new 70W high-efficiency LED luminaires. Roadway illuminated and safe for night pedestrians.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>320 Pine Avenue, South District</span>
              </span>
              <span className="text-amber-400 font-semibold">★ 5.0 Citizen Rating</span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onOpenComplaint('CF-2026-1001')}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-amber-400">CF-2026-1001</span>
                <span className="text-[11px] font-semibold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Work Crew In Progress
                </span>
              </div>
              <h3 className="font-bold text-white text-base">Deep crater pothole near Oak Street primary school crossing</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                Asphalt compaction crew deployed on site with cold-mix asphalt batch. Priority Critical due to school crosswalk.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>420 Oak Street, Central Civic Zone</span>
              </span>
              <span className="text-emerald-400 font-semibold">Public Works & Roads</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
