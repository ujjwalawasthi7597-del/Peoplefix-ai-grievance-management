import { db } from '../db/store.ts';
import { IComplaint } from '../types.ts';

export function runEscalationCheck() {
  const now = new Date();
  const complaints = db.complaints.find(
    (c) => c.status !== 'Resolved' && c.status !== 'Rejected'
  );

  let newlyEscalated = 0;

  for (const comp of complaints) {
    const deadline = new Date(comp.slaDeadline);
    const isOverdue = now.getTime() > deadline.getTime();

    if (isOverdue && !comp.isOverdue) {
      // Mark as overdue
      db.complaints.update(comp.id, { isOverdue: true });
      newlyEscalated++;

      // Check if an escalation record already exists
      const existingEsc = db.escalations.find(
        (e) => e.complaintId === comp.id && e.status === 'Active'
      );

      if (!existingEsc.length) {
        // Create escalation record
        db.escalations.create({
          id: `esc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          complaintId: comp.id,
          fromOfficerId: comp.assignedOfficerId,
          reason: `Automatic SLA breach: Resolution exceeded prescribed SLA deadline (${new Date(comp.slaDeadline).toLocaleString()}).`,
          escalationLevel: comp.priority === 'Critical' ? 2 : 1,
          status: 'Active',
          createdAt: now.toISOString(),
        });

        // Add to history
        db.history.create({
          id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          complaintId: comp.id,
          previousStatus: comp.status,
          newStatus: comp.status,
          changedBy: {
            id: 'sys-sla-engine',
            name: 'PeopleFix Automated SLA Escalator',
            role: 'admin',
          },
          publicMessage: 'Service Level Agreement timeline exceeded. Incident escalated to municipal supervisory officers.',
          internalNote: 'Automated notification dispatched to department lead and administrative dashboard.',
          createdAt: now.toISOString(),
        });

        // Dispatch notifications
        // 1. To Admin
        const admins = db.users.find((u) => u.role === 'admin');
        admins.forEach((admin) => {
          db.notifications.create({
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: admin.id,
            roleTarget: 'admin',
            complaintId: comp.id,
            title: `⚠️ Overdue Complaint Escalation: ${comp.complaintId}`,
            message: `Grievance "${comp.title}" (${comp.category}) is overdue. Priority: ${comp.priority}.`,
            type: 'escalation',
            isRead: false,
            link: `/complaints/${comp.id}`,
            createdAt: now.toISOString(),
          });
        });

        // 2. To assigned officer if any
        if (comp.assignedOfficerId) {
          db.notifications.create({
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: comp.assignedOfficerId,
            complaintId: comp.id,
            title: `⚠️ SLA Breached: ${comp.complaintId}`,
            message: `Your assigned grievance "${comp.title}" has passed its SLA deadline. Immediate resolution required.`,
            type: 'escalation',
            isRead: false,
            link: `/complaints/${comp.id}`,
            createdAt: now.toISOString(),
          });
        }
      }
    }
  }

  if (newlyEscalated > 0) {
    console.log(`[CivicFix Escalation] Detected and escalated ${newlyEscalated} overdue complaints.`);
  }
}

// Start background checker
export function startEscalationWorker(intervalMs = 60000) {
  // Run once immediately
  setTimeout(runEscalationCheck, 5000);
  // Interval timer
  setInterval(runEscalationCheck, intervalMs);
}
