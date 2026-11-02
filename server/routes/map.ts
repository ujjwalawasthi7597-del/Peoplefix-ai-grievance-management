import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { calculateDistanceMeters } from '../services/ai/index.ts';

const router = Router();

// GET /api/map/complaints - Returns all complaints for public Leaflet map
router.get('/complaints', (req: Request, res: Response) => {
  const { category, status, priority } = req.query;

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

  // Sanitize map pins to protect citizen privacy
  const pins = list.map((c) => ({
    id: c.id,
    complaintId: c.complaintId,
    title: c.title,
    category: c.category,
    priority: c.priority,
    status: c.status,
    location: c.location,
    submittedAt: c.submittedAt,
    isOverdue: c.isOverdue,
    imagePreview: c.images?.[0] || null,
    departmentName: c.departmentName,
  }));

  return res.json({ complaints: pins });
});

// GET /api/map/nearby - Returns complaints within radius of given coords
router.get('/nearby', (req: Request, res: Response) => {
  const { lat, lng, radiusMeters = 3000 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng coordinates are required.' });
  }

  const userLat = Number(lat);
  const userLng = Number(lng);
  const radius = Number(radiusMeters);

  const complaints = db.complaints.find();
  const nearby = complaints
    .map((c) => {
      const distance = calculateDistanceMeters(userLat, userLng, c.location.lat, c.location.lng);
      return {
        ...c,
        citizenPhone: undefined,
        citizenEmail: undefined,
        distanceMeters: Math.round(distance),
      };
    })
    .filter((c) => c.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return res.json({ nearby });
});

export default router;
