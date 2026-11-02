import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Download,
  Copy,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenComplaint: (id: string) => void;
  onNavigate: (tab: string) => void;
}

const COLORS = ['#10b981', '#38bdf8', '#f59e0b', '#f43f5e', '#a855f7', '#ec4899'];
const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#f43f5e',
  High: '#f59e0b',
  Medium: '#38bdf8',
  Low: '#64748b',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenComplaint }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'escalations' | 'users' | 'departments' | 'reports' | 'audit'>('analytics');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Officer Modal
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'officer',
    departmentId: '',
    password: '',
  });

  // AI Report Generator State
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'executive'>('executive');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{ reportText: string; generatedAt: string; provider: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dash, ana, esc, usr, dep, aud] = await Promise.all([
        api.admin.getDashboard(),
        api.admin.getAnalytics(),
        api.admin.getEscalations(),
        api.admin.getUsers(),
        api.admin.getDepartments(),
        api.admin.getAuditLogs(),
      ]);

      setDashboardData(dash);
      setAnalyticsData(ana);
      setEscalations(esc.escalations);
      setUsersList(usr.users);
      setDepartments(dep.departments);
      setAuditLogs(aud.logs);
      if (dep.departments.length > 0 && !newOfficer.departmentId) {
        setNewOfficer((prev) => ({ ...prev, departmentId: dep.departments[0].id }));
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  // Create Officer
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.createUser(newOfficer);
      alert('Officer account created successfully.');
      setShowAddOfficerModal(false);
      setNewOfficer({ name: '', email: '', phone: '', role: 'officer', departmentId: departments[0]?.id || '', password: '' });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Error creating officer');
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.admin.updateUser(userId, { isActive: !currentStatus });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Resolve escalation
  const handleResolveEscalation = async (escId: string) => {
    try {
      await api.admin.resolveEscalation(escId);
      await fetchAdminData();
      alert('Escalation resolved.');
    } catch (err: any) {
      alert(err.message || 'Error resolving escalation');
    }
  };

  // Generate AI Executive Report
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const report = await api.admin.generateReport(reportType);
      setGeneratedReport(report);
    } catch (err: any) {
      alert(err.message || 'Error generating report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport.reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Municipal Command Center
            </span>
            <span className="text-xs text-slate-400">Commissioner Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            PeopleFix Platform Intelligence & Administration
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Real-time municipal performance analytics, cross-department escalation monitoring, and AI executive report generation.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('reports')}
          className="px-5 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Briefing</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Resolution Rate</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{dashboardData?.resolutionRate || 0}%</div>
          <span className="text-[11px] text-slate-500">{dashboardData?.resolvedCount || 0} of {dashboardData?.totalComplaints || 0} resolved</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Pending Complaints</span>
          <div className="text-3xl font-extrabold text-white mt-2">{dashboardData?.pendingCount || 0}</div>
          <span className="text-[11px] text-slate-500">In triage or field repair</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Overdue SLA Escalations</span>
          <div className="text-3xl font-extrabold text-rose-400 mt-2">{dashboardData?.overdueCount || 0}</div>
          <span className="text-[11px] text-rose-400">Breached deadlines</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Connected Personnel</span>
          <div className="text-3xl font-extrabold text-sky-400 mt-2">{dashboardData?.totalOfficers || 0} Officers</div>
          <span className="text-[11px] text-slate-500">{dashboardData?.totalCitizens || 0} registered citizens</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Analytics & Visualizations</span>
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'escalations'
              ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>SLA Escalations Center ({escalations.filter((e) => e.status === 'Active').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>User & Officer Management</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Department Directory & SLA</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>AI Municipal Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Grievances by Category</h3>
                  <p className="text-xs text-slate-400">Distribution across municipal service vectors</p>
                </div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="category"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Area Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Monthly Grievance Resolution Velocity</h3>
                  <p className="text-xs text-slate-400">Reported incidents vs successfully resolved</p>
                </div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="reported" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Department Performance Breakdown Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Department SLA Performance & Compliance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Department Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Total Handled</th>
                    <th className="py-3 px-4">Resolved</th>
                    <th className="py-3 px-4">Overdue</th>
                    <th className="py-3 px-4">SLA Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {analyticsData.departmentPerformance.map((dept: any) => (
                    <tr key={dept.department} className="hover:bg-slate-850/50">
                      <td className="py-3.5 px-4 font-semibold text-white">{dept.department}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">{dept.code}</td>
                      <td className="py-3.5 px-4">{dept.total}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">{dept.resolved}</td>
                      <td className="py-3.5 px-4">
                        {dept.overdue > 0 ? (
                          <span className="text-rose-400 font-bold">{dept.overdue} overdue</span>
                        ) : (
                          <span className="text-emerald-400">0 overdue</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-2 rounded-full"
                              style={{ width: `${dept.slaComplianceRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-white">{dept.slaComplianceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESCALATIONS CENTER */}
      {activeTab === 'escalations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Automated SLA Escalation Alerts</h3>
              <p className="text-xs text-slate-400">Complaints that have breached prescribed Service Level Agreement deadlines</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {escalations.filter((e) => e.status === 'Active').length} Active Overdue
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {escalations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active escalations. All complaints are within SLA timeline limits.
              </div>
            ) : (
              escalations.map((esc) => (
                <div key={esc.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-mono font-bold text-emerald-400">{esc.complaint?.complaintId || 'Incident'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${esc.status === 'Active' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>
                        Level {esc.escalationLevel} Escalation • {esc.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{esc.complaint?.title}</h4>
                    <p className="text-xs text-rose-300/90">{esc.reason}</p>
                    <span className="text-[11px] text-slate-500 block">
                      Escalated on: {new Date(esc.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {esc.status === 'Active' && (
                      <button
                        onClick={() => handleResolveEscalation(esc.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        Acknowledge & Resolve
                      </button>
                    )}
                    {esc.complaint && (
                      <button
                        onClick={() => onOpenComplaint(esc.complaintId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        Inspect Issue
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER & OFFICER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-base">User & Officer Directory</h3>
              <p className="text-xs text-slate-400">Manage registered citizens, officers, and department heads</p>
            </div>
            <button
              onClick={() => setShowAddOfficerModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Officer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-300'
                          : u.role === 'officer'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{u.departmentName || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{u.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-semibold ${u.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                            u.isActive
                              ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50'
                              : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
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

      {/* TAB 4: DEPARTMENTS & SLA */}
      {activeTab === 'departments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Municipal Departments & SLA Benchmarks</h3>
              <p className="text-xs text-slate-400">Response time limits by priority tier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="p-5 rounded-xl bg-slate-850/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{d.name}</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{d.description}</p>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    SLA Resolution Targets
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-rose-400 block font-bold">Critical</span>
                      <strong className="text-white">{d.slaHours.Critical}h</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-amber-400 block font-bold">High</span>
                      <strong className="text-white">{d.slaHours.High}h</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-sky-400 block font-bold">Medium</span>
                      <strong className="text-white">{d.slaHours.Medium}h</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Low</span>
                      <strong className="text-white">{d.slaHours.Low}h</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI MUNICIPAL EXECUTIVE REPORT GENERATOR */}
      {activeTab === 'reports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-lg">AI Municipal Intelligence Report Generator</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Synthesize live database complaints into an executive briefing using Gemini 3.8 Flash.
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="executive">Executive Summary</option>
                <option value="daily">Daily Operations Report</option>
                <option value="monthly">Monthly Civic Review</option>
              </select>

              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generatingReport ? 'Generating Briefing...' : 'Generate Live Report'}</span>
              </button>
            </div>
          </div>

          {generatedReport && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Generated: {new Date(generatedReport.generatedAt).toLocaleString()}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">Provider: {generatedReport.provider}</span>
                </div>
                <button
                  onClick={handleCopyReport}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
              </div>

              <div className="prose prose-invert max-w-none text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {generatedReport.reportText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Municipal Audit Trail Log</h3>
              <p className="text-xs text-slate-400">Immutable trace of all administrative, staff, and citizen actions</p>
            </div>
            <span className="text-xs text-slate-500">{auditLogs.length} events logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.actorName} <span className="text-slate-500 text-[10px]">({log.actorRole})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{log.action}</td>
                    <td className="py-3 px-4 uppercase text-[10px] text-slate-400">{log.entityType}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.entityId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Officer Modal */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Provision Department Officer</h3>
            <p className="text-xs text-slate-400">
              Create official credentials for a department officer with assigned jurisdictional authority.
            </p>

            <form onSubmit={handleCreateOfficer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  placeholder="e.g., Officer John Doe"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                  placeholder="e.g., officer.johndoe@civicfix.org"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newOfficer.phone}
                  onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                  placeholder="+1-555-010-0000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Department</label>
                <select
                  value={newOfficer.departmentId}
                  onChange={(e) => setNewOfficer({ ...newOfficer, departmentId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newOfficer.password}
                  onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                  placeholder="Must be >= 8 chars with mixed case & number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddOfficerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
