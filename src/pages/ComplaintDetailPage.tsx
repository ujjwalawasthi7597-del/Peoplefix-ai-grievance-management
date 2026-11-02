import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { IComplaint, IComplaintHistoryItem, ComplaintStatus } from '../types/index.ts';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Star,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Send,
  Upload,
  User,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface ComplaintDetailPageProps {
  complaintId: string;
  onBack: () => void;
  onOpenComplaint?: (id: string) => void;
}

export const ComplaintDetailPage: React.FC<ComplaintDetailPageProps> = ({
  complaintId,
  onBack,
  onOpenComplaint,
}) => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<IComplaint | null>(null);
  const [history, setHistory] = useState<IComplaintHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Citizen Reopen Modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  // Citizen Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Officer Action State
  const [actionStatus, setActionStatus] = useState<ComplaintStatus>('In Progress');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.complaints.getById(complaintId);
      setComplaint(res.complaint);
      setHistory(res.history);
      setActionStatus(res.complaint.status);
    } catch (err: any) {
      setError(err.message || 'Complaint not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [complaintId, user]);

  // Citizen Reopen Handler
  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim() || !complaint) return;
    try {
      setReopening(true);
      await api.complaints.reopen(complaint.id, reopenReason);
      setShowReopenModal(false);
      setReopenReason('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error reopening complaint');
    } finally {
      setReopening(false);
    }
  };

  // Citizen Feedback Handler
  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      setSubmittingFeedback(true);
      await api.complaints.submitFeedback(complaint.id, rating, feedbackComment);
      setShowFeedbackModal(false);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error submitting feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Officer Update Status Handler
  const handleOfficerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      setUpdatingStatus(true);
      await api.officer.updateStatus(complaint.id, {
        newStatus: actionStatus,
        publicMessage: publicMessage || `Status updated to ${actionStatus}.`,
        internalNote: internalNote || undefined,
        evidenceImages: evidenceImages.length > 0 ? evidenceImages : undefined,
      });

      setPublicMessage('');
      setInternalNote('');
      setEvidenceImages([]);
      await fetchDetail();
      alert('Grievance status updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Photo Upload for Evidence
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading grievance tracking records...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 max-w-3xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Grievance Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'The requested tracking ID does not exist in municipal records.'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate SLA countdown
  const nowMs = Date.now();
  const deadlineMs = new Date(complaint.slaDeadline).getTime();
  const remainingHours = Math.round((deadlineMs - nowMs) / (1000 * 3600));
  const isOverdue = complaint.isOverdue || (remainingHours < 0 && complaint.status !== 'Resolved' && complaint.status !== 'Rejected');

  const isStaff = user && (user.role === 'officer' || user.role === 'admin');
  const isOwner = user && user.id === complaint.citizenId;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Official Municipal Record</span>
          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {complaint.complaintId}
          </span>
        </div>
      </div>

      {/* Complaint Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                complaint.status === 'Resolved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : complaint.status === 'In Progress'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {complaint.status}
              </span>

              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                complaint.priority === 'Critical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : complaint.priority === 'High'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300'
              }`}>
                {complaint.priority} Priority
              </span>

              <span className="text-xs text-slate-400">• {complaint.category}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
              {complaint.title}
            </h1>
          </div>

          {/* SLA Tracker Card */}
          <div className={`p-4 rounded-xl border text-center shrink-0 w-full sm:w-auto ${
            complaint.status === 'Resolved'
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : isOverdue
              ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
              : 'bg-slate-850 border-slate-800 text-slate-300'
          }`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Service Level Agreement (SLA)
            </div>
            <div className="text-lg font-black mt-1">
              {complaint.status === 'Resolved' ? (
                <span className="text-emerald-400 flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolved</span>
                </span>
              ) : isOverdue ? (
                <span className="text-rose-400 flex items-center justify-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>SLA Breached ({Math.abs(remainingHours)}h Overdue)</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center justify-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{remainingHours} Hours Remaining</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Target Deadline: {new Date(complaint.slaDeadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
        </div>

        {/* Description & Details */}
        <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          {complaint.description}
        </div>

        {/* Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">{complaint.location.address}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Dept: <strong className="text-slate-200">{complaint.departmentName}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Assigned: <strong className="text-slate-200">{complaint.assignedOfficerName || 'Awaiting assignment'}</strong></span>
          </div>
        </div>
      </div>

      {/* Reported Images Gallery */}
      {complaint.images && complaint.images.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Reported Photographic Evidence</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {complaint.images.map((img, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video">
                <img src={img} alt="Evidence" className="w-full h-full object-cover hover:scale-105 transition" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citizen Action Bar (Reopen or Rate Feedback) */}
      {complaint.status === 'Resolved' && (
        <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Grievance Marked as Resolved</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Field crew has marked this issue as repaired. Please share your rating or reopen if work is incomplete.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {(!complaint.feedback || isOwner) && (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                <span>{complaint.feedback ? 'Update Rating' : 'Rate Resolution'}</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reopen Issue</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Display Submitted Feedback if any */}
      {complaint.feedback && (
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center space-x-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Citizen Satisfaction Rating: {complaint.feedback.rating} / 5 Stars</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date(complaint.feedback.submittedAt).toLocaleDateString()}
            </span>
          </div>
          {complaint.feedback.comment && (
            <p className="text-xs text-slate-300 italic">"{complaint.feedback.comment}"</p>
          )}
        </div>
      )}

      {/* Officer / Admin Control Center */}
      {isStaff && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Officer Resolution Controls</h2>
            <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              Staff Clearance
            </span>
          </div>

          <form onSubmit={handleOfficerUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Update Grievance Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as ComplaintStatus)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Submitted">Submitted (Queue)</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress (Crew Dispatched)</option>
                  <option value="On Hold">On Hold (Material / Permit pending)</option>
                  <option value="Resolved">Resolved (Repairs Completed)</option>
                  <option value="Rejected">Rejected (Out of Municipal Jurisdiction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Attach Resolution Evidence Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-slate-700 file:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Public Progress Message (Visible to Citizen)
              </label>
              <input
                type="text"
                value={publicMessage}
                onChange={(e) => setPublicMessage(e.target.value)}
                placeholder="e.g., Road repair squad #4 arrived on site. Asphalt patching underway."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Confidential Internal Staff Note (Hidden from Citizen)</span>
              </label>
              <textarea
                rows={2}
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="e.g., Cold-mix batch #882 used. Water line inspected by engineer Singh."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={updatingStatus}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-2 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{updatingStatus ? 'Updating...' : 'Publish Official Update'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Full Audit Timeline History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white">Full Resolution Audit Timeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">Chronological record of status updates, notes, and evidence</p>
        </div>

        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {history.map((item, idx) => (
            <div key={item.id || idx} className="relative space-y-2">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-slate-900" />

              <div className="flex flex-wrap items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{item.newStatus}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{item.changedBy?.name} ({item.changedBy?.role})</span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Public message */}
              <div className="p-3 rounded-xl bg-slate-850/80 border border-slate-800 text-xs text-slate-300">
                {item.publicMessage}
              </div>

              {/* Internal Note (Staff only) */}
              {item.internalNote && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-2">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-bold text-[10px] uppercase tracking-wider block">Internal Staff Note:</span>
                    <p>{item.internalNote}</p>
                  </div>
                </div>
              )}

              {/* Evidence photos in history */}
              {item.evidenceImages && item.evidenceImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {item.evidenceImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Resolution Evidence"
                      className="rounded-lg border border-slate-800 h-24 w-full object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Rate Your Resolution Experience</h3>
            <p className="text-xs text-slate-400">
              Help us evaluate the efficiency of the field crew in resolving this civic grievance.
            </p>

            <form onSubmit={handleFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{rating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Citizen Comments
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share details regarding the quality and timeliness of the repair..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizen Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Reopen Grievance</h3>
            <p className="text-xs text-slate-400">
              If the problem was not satisfactorily resolved or has recurred, please explain what remains unaddressed.
            </p>

            <form onSubmit={handleReopen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Reopening
                </label>
                <textarea
                  rows={3}
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g., The pothole was only partially patched with gravel and washed out again during today's rain..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopening}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
                >
                  {reopening ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
