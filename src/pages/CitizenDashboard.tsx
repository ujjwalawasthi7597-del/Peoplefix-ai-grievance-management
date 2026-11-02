import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { IComplaint } from '../types/index.ts';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  MapPin,
  Calendar,
  Layers,
  Star,
  ExternalLink,
} from 'lucide-react';

interface CitizenDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenComplaint: (id: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onNavigate, onOpenComplaint }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [nearbyComplaints, setNearbyComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.complaints.getMy();
      setComplaints(res.complaints);

      // Also fetch nearby complaints (default city center)
      const nearbyRes = await api.map.getNearby(37.7749, -122.4194, 5000);
      setNearbyComplaints(nearbyRes.nearby);
    } catch (err) {
      console.error('Failed to fetch citizen complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  // Metrics
  const total = complaints.length;
  const inProgress = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Under Review'
  ).length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const pendingFeedback = complaints.filter((c) => c.status === 'Resolved' && !c.feedback).length;

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? c.status !== 'Resolved' && c.status !== 'Rejected'
        : statusFilter === 'resolved'
        ? c.status === 'Resolved'
        : true;

    const matchesSearch =
      searchQuery === ''
        ? true
        : c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">In Progress</span>;
      case 'Assigned':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">Assigned</span>;
      case 'Under Review':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Under Review</span>;
      case 'Reopened':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Reopened</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <span className="text-xs font-bold text-rose-400 flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping mr-1"></span>Critical</span>;
      case 'High':
        return <span className="text-xs font-semibold text-amber-400">High</span>;
      case 'Medium':
        return <span className="text-xs font-semibold text-sky-400">Medium</span>;
      default:
        return <span className="text-xs text-slate-400">Low</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Citizen Portal
            </span>
            <span className="text-xs text-slate-400">Signed in as {user?.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Track reported civic issues in your neighborhood, view field crew updates, and evaluate completed resolutions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('report')}
          className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Report an Issue</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Grievances</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Submitted by you</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">In Active Progress</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-3">{inProgress}</div>
          <div className="text-[11px] text-slate-500 mt-1">Field teams dispatched</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Fully Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-3">{resolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">With photo evidence</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Rating</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-sky-400 mt-3">{pendingFeedback}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting citizen feedback</div>
        </div>
      </div>

      {/* Complaints List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">My Civic Reports</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status, timeline audits, and resolution ratings</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({complaints.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'active' ? 'bg-amber-500/20 text-amber-300 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({inProgress})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Resolved ({resolved})
              </button>
            </div>
          </div>
        </div>

        {/* Complaints Cards / Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading your grievances...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-base">No Grievances Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'No complaints match your search query.' : 'You have not submitted any complaints yet. Report an issue to help improve your city!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => onNavigate('report')}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit First Complaint</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredComplaints.map((comp) => (
              <div
                key={comp.id}
                onClick={() => onOpenComplaint(comp.id)}
                className="p-5 hover:bg-slate-850/60 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {comp.complaintId}
                    </span>
                    {getStatusBadge(comp.status)}
                    {getPriorityBadge(comp.priority)}
                    <span className="text-xs text-slate-400">• {comp.category}</span>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition truncate">
                    {comp.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-xs">{comp.location.address}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(comp.submittedAt).toLocaleDateString()}</span>
                    </span>
                    <span className="text-slate-400 font-medium">
                      Dept: {comp.departmentName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                  {comp.status === 'Resolved' && comp.feedback && (
                    <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{comp.feedback.rating}/5 Rated</span>
                    </span>
                  )}
                  {comp.status === 'Resolved' && !comp.feedback && (
                    <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                      ★ Rate Resolution
                    </span>
                  )}
                  <button className="px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-200 text-xs font-medium transition flex items-center space-x-1">
                    <span>View Tracking</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Community Issues */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Active Issues in Your Vicinity</h3>
            <p className="text-xs text-slate-400">Civic issues reported nearby by fellow citizens</p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Interactive Map</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nearbyComplaints.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenComplaint(item.id)}
              className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-semibold">{item.complaintId}</span>
                {getStatusBadge(item.status)}
              </div>
              <h4 className="font-semibold text-white text-xs line-clamp-1">{item.title}</h4>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{item.location.address}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
