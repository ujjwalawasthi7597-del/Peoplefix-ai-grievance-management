import { Router, Response } from 'express';
import { db } from '../db/store.ts';
import { authenticateUser, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { ComplaintStatus, IComplaintHistoryItem } from '../types.ts';

const router = Router();

// Require officer or admin role for all routes in this file
router.use(authenticateUser);
router.use(authorizeRoles('officer', 'admin'));

// GET /api/officer/stats - Department stats for officer dashboard
router.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const deptId = user.role === 'admin' ? undefined : user.departmentId;

  let complaints = db.complaints.find();
  if (deptId) {
    complaints = complaints.filter((c) => c.departmentId === deptId);
  }

  const assignedToMe = complaints.filter((c) => c.assignedOfficerId === user.id);
  const pending = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Assigned');
  const inProgress = complaints.filter((c) => c.status === 'In Progress');
  const resolved = complaints.filter((c) => c.status === 'Resolved');
  const overdue = complaints.filter((c) => c.isOverdue && c.status !== 'Resolved' && c.status !== 'Rejected');

  // Priority distribution
  const priorityCounts = {
    Critical: complaints.filter((c) => c.priority === 'Critical').length,
    High: complaints.filter((c) => c.priority === 'High').length,
    Medium: complaints.filter((c) => c.priority === 'Medium').length,
    Low: complaints.filter((c) => c.priority === 'Low').length,
  };

  // Average resolution time (hours)
  let totalResolutionHours = 0;
  let resolvedCount = 0;
  for (const c of resolved) {
    if (c.resolvedAt && c.submittedAt) {
      const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.submittedAt).getTime();
      totalResolutionHours += diffMs / (1000 * 3600);
      resolvedCount++;
    }
  }
  const avgResolutionHours = resolvedCount > 0 ? Number((totalResolutionHours / resolvedCount).toFixed(1)) : 24;

  return res.json({
    totalDepartment: complaints.length,
    assignedToMeCount: assignedToMe.length,
    pendingCount: pending.length,
    inProgressCount: inProgress.length,
    resolvedCount: resolved.length,
    overdueCount: overdue.length,
    avgResolutionHours,
    priorityCounts,
    departmentName: user.departmentName || 'All Municipal Departments',
  });
});

// GET /api/officer/complaints - Filterable complaints for officer view
router.get('/complaints', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { status, priority, assignedOnly, overdueOnly, search } = req.query;

  let list = db.complaints.find();

  // Scope to department unless admin
  if (user.role !== 'admin' && user.departmentId) {
    list = list.filter((c) => c.departmentId === user.departmentId);
  }

  if (assignedOnly === 'true') {
    list = list.filter((c) => c.assignedOfficerId === user.id);
  }

  if (overdueOnly === 'true') {
    list = list.filter((c) => c.isOverdue && c.status !== 'Resolved' && c.status !== 'Rejected');
  }

  if (status) {
    list = list.filter((c) => c.status === status);
  }

  if (priority) {
    list = list.filter((c) => c.priority === priority);
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.complaintId.toLowerCase().includes(s) ||
        c.location.address.toLowerCase().includes(s)
    );
  }

  return res.json({ complaints: list });
});

// POST /api/officer/complaints/:id/status - Update status, add public update & internal note, upload evidence
router.post('/complaints/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newStatus, publicMessage, internalNote, evidenceImages } = req.body;
  const user = req.user!;

  if (!newStatus) {
    return res.status(400).json({ error: 'newStatus is required.' });
  }

  const complaint = db.complaints.findById(id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  // Check department authorization
  if (user.role !== 'admin' && complaint.departmentId !== user.departmentId) {
    return res.status(403).json({ error: 'You are only authorized to update complaints in your department.' });
  }

  const previousStatus = complaint.status;
  const now = new Date().toISOString();

  const updates: Partial<typeof complaint> = {
    status: newStatus as ComplaintStatus,
  };

  if (newStatus === 'Resolved') {
    updates.resolvedAt = now;
    updates.isOverdue = false;
  }

  const updatedComplaint = db.complaints.update(complaint.id, updates);

  // Record history
  const historyItem: IComplaintHistoryItem = {
    id: `hist-${Date.now()}`,
    complaintId: complaint.id,
    previousStatus,
    newStatus: newStatus as ComplaintStatus,
    changedBy: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    publicMessage: publicMessage || `Status transitioned to ${newStatus} by ${user.name}.`,
    internalNote: internalNote || undefined,
    evidenceImages: Array.isArray(evidenceImages) && evidenceImages.length > 0 ? evidenceImages : undefined,
    createdAt: now,
  };

  db.history.create(historyItem);

  // Notify citizen of progress or resolution
  db.notifications.create({
    id: `notif-${Date.now()}`,
    userId: complaint.citizenId,
    complaintId: complaint.id,
    title: `Grievance Update: ${complaint.complaintId} is now ${newStatus}`,
    message: publicMessage || `Department officer has updated status to ${newStatus}.`,
    type: 'status_change',
    isRead: false,
    link: `/complaints/${complaint.id}`,
    createdAt: now,
  });

  // Audit log
  db.auditLogs.create({
    id: `audit-${Date.now()}`,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'STATUS_UPDATED',
    entityType: 'complaint',
    entityId: complaint.id,
    metadata: { previousStatus, newStatus, hasEvidence: !!(evidenceImages && evidenceImages.length) },
    timestamp: now,
  });

  return res.json({
    message: 'Status updated successfully.',
    complaint: updatedComplaint,
    historyItem,
  });
});

// POST /api/officer/complaints/:id/assign - Reassign or accept/reject
router.post('/complaints/:id/assign', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { assignedOfficerId, reason, actionType } = req.body;
  const user = req.user!;

  const complaint = db.complaints.findById(id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const now = new Date().toISOString();

  if (actionType === 'accept') {
    db.complaints.update(complaint.id, {
      assignedOfficerId: user.id,
      assignedOfficerName: user.name,
      status: complaint.status === 'Submitted' ? 'Under Review' : complaint.status,
    });

    db.history.create({
      id: `hist-${Date.now()}`,
      complaintId: complaint.id,
      previousStatus: complaint.status,
      newStatus: complaint.status === 'Submitted' ? 'Under Review' : complaint.status,
      changedBy: { id: user.id, name: user.name, role: user.role },
      publicMessage: `Officer ${user.name} accepted assignment and initiated review.`,
      createdAt: now,
    });

    return res.json({ message: 'Assignment accepted.' });
  }

  if (actionType === 'reject') {
    db.complaints.update(complaint.id, {
      assignedOfficerId: undefined,
      assignedOfficerName: undefined,
      status: 'Submitted',
    });

    db.history.create({
      id: `hist-${Date.now()}`,
      complaintId: complaint.id,
      previousStatus: complaint.status,
      newStatus: 'Submitted',
      changedBy: { id: user.id, name: user.name, role: user.role },
      publicMessage: 'Assignment rejected by field officer. Returned to department pool.',
      internalNote: `Rejection reason: ${reason || 'Officer capacity exceeded or incorrect jurisdiction.'}`,
      createdAt: now,
    });

    return res.json({ message: 'Assignment rejected and returned to queue.' });
  }

  // Reassign to specific officer
  if (assignedOfficerId) {
    const targetOfficer = db.users.findById(assignedOfficerId);
    if (!targetOfficer) {
      return res.status(404).json({ error: 'Target officer not found.' });
    }

    db.complaints.update(complaint.id, {
      assignedOfficerId: targetOfficer.id,
      assignedOfficerName: targetOfficer.name,
      status: complaint.status === 'Submitted' ? 'Assigned' : complaint.status,
    });

    db.history.create({
      id: `hist-${Date.now()}`,
      complaintId: complaint.id,
      previousStatus: complaint.status,
      newStatus: complaint.status === 'Submitted' ? 'Assigned' : complaint.status,
      changedBy: { id: user.id, name: user.name, role: user.role },
      publicMessage: `Complaint assigned to officer ${targetOfficer.name}.`,
      internalNote: `Reassigned by ${user.name}. Reason: ${reason || 'Department workload balancing.'}`,
      createdAt: now,
    });

    db.notifications.create({
      id: `notif-${Date.now()}`,
      userId: targetOfficer.id,
      complaintId: complaint.id,
      title: `Complaint Assigned: ${complaint.complaintId}`,
      message: `You have been assigned "${complaint.title}". Priority: ${complaint.priority}.`,
      type: 'assignment',
      isRead: false,
      link: `/complaints/${complaint.id}`,
      createdAt: now,
    });

    return res.json({ message: `Successfully assigned to ${targetOfficer.name}.` });
  }

  return res.status(400).json({ error: 'Invalid assignment payload.' });
});

// GET /api/officer/team - List officers in same department
router.get('/team', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const officers = db.users.find(
    (u) => u.role === 'officer' && (user.role === 'admin' || u.departmentId === user.departmentId)
  );

  return res.json({
    officers: officers.map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      phone: o.phone,
      departmentId: o.departmentId,
      departmentName: o.departmentName,
    })),
  });
});

export default router;
