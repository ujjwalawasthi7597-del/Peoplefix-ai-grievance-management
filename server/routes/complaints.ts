import { Router, Response } from 'express';
import { db } from '../db/store.ts';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.ts';
import { aiService, CATEGORY_DEPARTMENT_MAP, CATEGORY_NAME_MAP } from '../services/ai/index.ts';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  IComplaint,
  IComplaintHistoryItem,
} from '../types.ts';

const router = Router();

// Generate human-friendly ID like "CF-2026-1049"
function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `CF-${year}-${randomNum}`;
}

// POST /api/complaints - Create new complaint
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      category,
      priority: requestedPriority,
      location,
      images,
    } = req.body;

    if (!title || !description || !category || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: 'Title, description, category, and location coordinates are required.',
      });
    }

    // Run AI analysis
    const aiResult = await aiService.analyzeDescription(description, title, category);

    // Final priority: citizen requested or AI suggested
    const priority: ComplaintPriority = requestedPriority || aiResult.suggestedPriority || 'Medium';

    // Map to department
    const deptId = CATEGORY_DEPARTMENT_MAP[category as ComplaintCategory] || 'dept-traffic';
    const dept = db.departments.findById(deptId);
    const deptName = dept?.name || CATEGORY_NAME_MAP[category as ComplaintCategory] || 'Public Works & Infrastructure';

    // SLA hours calculation
    const slaHours = dept?.slaHours[priority] || (priority === 'Critical' ? 12 : priority === 'High' ? 24 : 48);
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();

    const complaintId = generateComplaintId();
    const id = `comp-${Date.now()}`;

    const newComplaint: IComplaint = {
      id,
      complaintId,
      citizenId: user.id,
      citizenName: user.name,
      citizenPhone: user.phone,
      citizenEmail: user.email,
      title: title.trim(),
      description: description.trim(),
      category: category as ComplaintCategory,
      departmentId: deptId,
      departmentName: deptName,
      priority,
      aiSuggestedPriority: aiResult.suggestedPriority,
      aiAnalysis: aiResult,
      status: 'Submitted',
      images: Array.isArray(images) ? images : [],
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        address: location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
        landmark: location.landmark || '',
      },
      assignedOfficerId: dept?.headOfficerId,
      assignedOfficerName: dept?.headOfficerName,
      slaDeadline,
      submittedAt: now.toISOString(),
      reopenedCount: 0,
      isOverdue: false,
    };

    db.complaints.create(newComplaint);

    // Initial history record
    const historyItem: IComplaintHistoryItem = {
      id: `hist-${Date.now()}`,
      complaintId: id,
      previousStatus: 'Submitted',
      newStatus: 'Submitted',
      changedBy: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      publicMessage: `Complaint successfully submitted by citizen. AI suggested category: "${aiResult.predictedCategory}" (Priority: ${aiResult.suggestedPriority}).`,
      createdAt: now.toISOString(),
    };
    db.history.create(historyItem);

    // Notify citizen
    db.notifications.create({
      id: `notif-${Date.now()}-1`,
      userId: user.id,
      complaintId: id,
      title: `Grievance Registered: ${complaintId}`,
      message: `Your report "${title}" has been registered and routed to ${deptName}. Estimated SLA: ${slaHours} hours.`,
      type: 'status_change',
      isRead: false,
      link: `/complaints/${id}`,
      createdAt: now.toISOString(),
    });

    // Notify assigned department officer
    if (dept?.headOfficerId) {
      db.notifications.create({
        id: `notif-${Date.now()}-2`,
        userId: dept.headOfficerId,
        complaintId: id,
        title: `New Grievance: ${complaintId} (${priority})`,
        message: `New issue reported in ${category}: "${title}". Address: ${newComplaint.location.address}`,
        type: 'assignment',
        isRead: false,
        link: `/complaints/${id}`,
        createdAt: now.toISOString(),
      });
    }

    // Audit log
    db.auditLogs.create({
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'COMPLAINT_SUBMITTED',
      entityType: 'complaint',
      entityId: id,
      metadata: { complaintId, priority, category, deptId },
      timestamp: now.toISOString(),
    });

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaint: newComplaint,
    });
  } catch (err: any) {
    console.error('Error creating complaint:', err);
    return res.status(500).json({ error: 'Failed to create complaint.' });
  }
});

// GET /api/complaints/my - Citizen's own complaints
router.get('/my', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const myComplaints = db.complaints.find((c) => c.citizenId === user.id);
  return res.json({ complaints: myComplaints });
});

// GET /api/complaints - Public & authenticated listing with filters
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { category, status, priority, departmentId, search, limit = 50, page = 1 } = req.query;

  let list = db.complaints.find();

  if (category) {
    list = list.filter((c) => c.category === category);
  }
  if (status) {
    list = list.filter((c) => c.status === status);
  }
  if (priority) {
    list = list.filter((c) => c.priority === priority);
  }
  if (departmentId) {
    list = list.filter((c) => c.departmentId === departmentId);
  }
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(s) ||
        c.complaintId.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        c.location.address.toLowerCase().includes(s)
    );
  }

  // Sanitize private citizen phone/email for public view if not admin/officer or owner
  const sanitized = list.map((c) => {
    return {
      ...c,
      citizenPhone: '***-***-****', // privacy protected on public list
      citizenEmail: c.citizenEmail ? `${c.citizenEmail.slice(0, 2)}***@***` : '',
    };
  });

  const total = sanitized.length;
  const start = (Number(page) - 1) * Number(limit);
  const paginated = sanitized.slice(start, start + Number(limit));

  return res.json({
    complaints: paginated,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

// GET /api/complaints/:id - Detail view
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const complaint = db.complaints.findById(id);

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  // Get full timeline history
  const history = db.history.findByComplaintId(complaint.id);

  // Check user role from token if present to filter confidential internal notes
  let isAuthorizedStaff = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Decoded payload
    try {
      const jwt = require('jsonwebtoken');
      const decoded: any = jwt.decode(token);
      if (decoded && (decoded.role === 'admin' || decoded.role === 'officer')) {
        isAuthorizedStaff = true;
      }
    } catch {}
  }

  // Filter history: remove internal notes if viewing as regular citizen or public
  const sanitizedHistory = history.map((h) => {
    if (!isAuthorizedStaff) {
      const { internalNote, ...publicFields } = h;
      return publicFields;
    }
    return h;
  });

  return res.json({
    complaint,
    history: sanitizedHistory,
  });
});

// POST /api/complaints/:id/reopen - Citizen reopens resolved complaint
router.post('/:id/reopen', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = req.user!;

  const complaint = db.complaints.findById(id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  // Only the original citizen or admin can reopen
  if (complaint.citizenId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the citizen who filed this complaint can request to reopen it.' });
  }

  if (complaint.status !== 'Resolved') {
    return res.status(400).json({ error: 'Only resolved complaints can be reopened.' });
  }

  const previousStatus = complaint.status;
  const newStatus: ComplaintStatus = 'Reopened';
  const now = new Date().toISOString();

  const updated = db.complaints.update(complaint.id, {
    status: newStatus,
    reopenedCount: (complaint.reopenedCount || 0) + 1,
  });

  // Add history
  db.history.create({
    id: `hist-${Date.now()}`,
    complaintId: complaint.id,
    previousStatus,
    newStatus,
    changedBy: { id: user.id, name: user.name, role: user.role },
    publicMessage: `Citizen reopened grievance: "${reason || 'Issue is not fully resolved or has recurred.'}"`,
    createdAt: now,
  });

  // Notify officer
  if (complaint.assignedOfficerId) {
    db.notifications.create({
      id: `notif-${Date.now()}`,
      userId: complaint.assignedOfficerId,
      complaintId: complaint.id,
      title: `Grievance Reopened: ${complaint.complaintId}`,
      message: `Citizen reported unresolved issue for "${complaint.title}". Reopen reason: ${reason}`,
      type: 'status_change',
      isRead: false,
      link: `/complaints/${complaint.id}`,
      createdAt: now,
    });
  }

  return res.json({ message: 'Complaint successfully reopened.', complaint: updated });
});

// POST /api/complaints/:id/feedback - Citizen rates resolution experience
router.post('/:id/feedback', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user = req.user!;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'A valid rating between 1 and 5 is required.' });
  }

  const complaint = db.complaints.findById(id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  if (complaint.citizenId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the citizen who filed this complaint can submit feedback.' });
  }

  const feedback = {
    rating: Number(rating),
    comment: comment || '',
    citizenId: user.id,
    citizenName: user.name,
    submittedAt: new Date().toISOString(),
  };

  const updated = db.complaints.update(complaint.id, { feedback });

  // Add history log of feedback
  db.history.create({
    id: `hist-${Date.now()}`,
    complaintId: complaint.id,
    previousStatus: complaint.status,
    newStatus: complaint.status,
    changedBy: { id: user.id, name: user.name, role: user.role },
    publicMessage: `Citizen submitted feedback: ${rating} / 5 stars. "${comment || 'No comment provided.'}"`,
    createdAt: new Date().toISOString(),
  });

  return res.json({ message: 'Feedback submitted successfully. Thank you for rating!', complaint: updated });
});

export default router;
