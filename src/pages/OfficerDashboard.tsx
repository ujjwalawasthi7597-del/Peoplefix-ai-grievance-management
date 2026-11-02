import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { IComplaint, ComplaintStatus } from '../types/index.ts';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  User,
  ArrowRight,
  Send,
  Upload,
  Lock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface OfficerDashboardProps {
  onOpenComplaint: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onOpenComplaint, onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [teamOfficers, setTeamOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAssignedOnly, setFilterAssignedOnly] = useState(false);
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for action drawer
  const [activeComplaint, setActiveComplaint] = useState<IComplaint | null>(null);
  const [actionStatus, setActionStatus] = useState<ComplaintStatus>('In Progress');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [reassignOfficerId, setReassignOfficerId] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes, teamRes] = await Promise.all([
        api.officer.getStats(),
        api.officer.getComplaints({
          assignedOnly: filterAssignedOnly ? 'true' : '',
          overdueOnly: filterOverdueOnly ? 'true' : '',
          status: statusFilter,
          priority: priorityFilter,
          search: searchQuery,
        }),
        api.officer.getTeam(),
      ]);

      setStats(statsRes);
      setComplaints(complaintsRes.complaints);
      setTeamOfficers(teamRes.officers);
    } catch (err) {
      console.error('Error fetching officer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAssignedOnly, filterOverdueOnly, statusFilter, priorityFilter, searchQuery, user]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint) return;
    try {
      setActionSubmitting(true);
      await api.officer.updateStatus(activeComplaint.id, {
        newStatus: actionStatus,
        publicMessage: publicMessage || `Status transitioned to ${actionStatus}.`,
        internalNote: internalNote || undefined,
        evidenceImages: evidenceImages.length > 0 ? evidenceImages : undefined,
      });

      // Handle reassignment if selected
      if (reassignOfficerId) {
        await api.officer.assign(activeComplaint.id, {
          assignedOfficerId: reassignOfficerId,
          reason: 'Officer workload reallocation',
        });
      }

      alert('Grievance updated successfully.');
      setActiveComplaint(null);
      setPublicMessage('');
      setInternalNote('');
      setEvidenceImages([]);
      setReassignOfficerId('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating grievance');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setEvidenceImages((prev) => [...prev, String(reader.result)]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Department Operations Center
            </span>
            <span className="text-xs text-slate-400">Officer {user?.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats?.departmentName || 'Municipal Operations Queue'}
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Triage incoming citizen reports, dispatch field repair squads, publish progress milestones, and upload resolution proof.
          </p>
        </div>

        <button
          onClick={() => onNavigate('map')}
          className="px-5 py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <span>View Department Map</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Assigned to Me</span>
          <div className="text-3xl font-extrabold text-indigo-400 mt-2">{stats?.assignedToMeCount || 0}</div>
          <span className="text-[11px] text-slate-500">Active assignments</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Department Pending</span>
          <div className="text-3xl font-extrabold text-white mt-2">{stats?.pendingCount || 0}</div>
          <span className="text-[11px] text-slate-500">Under review / queued</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Field In-Progress</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">{stats?.inProgressCount || 0}</div>
          <span className="text-[11px] text-slate-500">Crews deployed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Overdue (SLA Breached)</span>
          <div className={`text-3xl font-extrabold mt-2 ${stats?.overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {stats?.overdueCount || 0}
          </div>
          <span className="text-[11px] text-rose-400">Requires escalation</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-slate-400">Avg Resolution</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats?.avgResolutionHours || 24}h</div>
          <span className="text-[11px] text-slate-500">Department turnaround</span>
        </div>
      </div>

      {/* Officer Complaints Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
        {/* Table Filters Header */}
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Department Incident Queue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter grievances, update resolution evidence, and manage assignments</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, title, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick toggles */}
            <button
              onClick={() => setFilterAssignedOnly(!filterAssignedOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                filterAssignedOnly
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              My Assigned
            </button>

            <button
              onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                filterOverdueOnly
                  ? 'bg-rose-600 border-rose-500 text-white shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-rose-300 hover:text-white'
              }`}
            >
              ⚠️ Overdue Only
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading queue...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No complaints found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Grievance ID</th>
                  <th className="py-3 px-4">Category & Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Deadline</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {complaints.map((comp) => {
                  const deadlineMs = new Date(comp.slaDeadline).getTime();
                  const remainingHours = Math.round((deadlineMs - Date.now()) / (1000 * 3600));
                  const isBreached = comp.isOverdue || (remainingHours < 0 && comp.status !== 'Resolved');

                  return (
                    <tr key={comp.id} className="hover:bg-slate-850/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {comp.complaintId}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">{comp.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{comp.location.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          comp.priority === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : comp.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {comp.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          comp.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : comp.status === 'In Progress'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {comp.status === 'Resolved' ? (
                          <span className="text-emerald-400 text-[11px]">Completed</span>
                        ) : isBreached ? (
                          <span className="text-rose-400 font-bold text-[11px]">⚠️ SLA Breached</span>
                        ) : (
                          <span className="text-amber-400 text-[11px]">{remainingHours}h remaining</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-400">
                        {comp.assignedOfficerName ? (
                          <span className="text-white">{comp.assignedOfficerName.split(' ')[0]}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setActiveComplaint(comp);
                            setActionStatus(comp.status);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer"
                        >
                          Update Status
                        </button>
                        <button
                          onClick={() => onOpenComplaint(comp.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Drawer Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">{activeComplaint.complaintId}</span>
                <h3 className="font-bold text-white text-base mt-0.5 line-clamp-1">{activeComplaint.title}</h3>
              </div>
              <button
                onClick={() => setActiveComplaint(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Transition Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as ComplaintStatus)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress (Field Crew On Site)</option>
                  <option value="On Hold">On Hold (Material / Clearance Pending)</option>
                  <option value="Resolved">Resolved (Completed & Verified)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Citizen Public Update Message</label>
                <input
                  type="text"
                  required
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                  placeholder="e.g., Road repair squad #4 arrived on site. Asphalt patching underway."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confidential Internal Staff Note</span>
                </label>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Staff-only internal reference notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Reassign to Team Member (Optional)</label>
                <select
                  value={reassignOfficerId}
                  onChange={(e) => setReassignOfficerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Keep Current Assignment</option>
                  {teamOfficers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.departmentName || 'Officer'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Attach Resolution Photo Evidence</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-slate-700 file:text-white"
                />
                {evidenceImages.length > 0 && (
                  <p className="text-[11px] text-emerald-400 mt-1">✓ {evidenceImages.length} image(s) attached</p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveComplaint(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-6 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionSubmitting ? 'Submitting...' : 'Save Updates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
