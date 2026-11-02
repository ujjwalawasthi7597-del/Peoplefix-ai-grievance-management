import { Router, Response } from 'express';
import { db } from '../db/store.ts';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateUser);

// GET /api/notifications - User's notifications
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.notifications.findByUserId(user.id, user.role);
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return res.json({
    notifications: notifs,
    unreadCount,
  });
});

// POST /api/notifications/:id/read - Mark single as read
router.post('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  db.notifications.markAsRead(id);
  return res.json({ message: 'Notification marked as read.' });
});

// POST /api/notifications/read-all - Mark all as read
router.post('/read-all', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.notifications.markAllAsRead(user.id);
  return res.json({ message: 'All notifications marked as read.' });
});

export default router;
