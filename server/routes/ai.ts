import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai/index.ts';
import { db } from '../db/store.ts';
import { ComplaintCategory } from '../types.ts';

const router = Router();

// POST /api/ai/analyze-description
router.post('/analyze-description', async (req: Request, res: Response) => {
  try {
    const { description, title, category } = req.body;
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required for AI analysis.' });
    }

    const result = await aiService.analyzeDescription(description, title, category);
    return res.json({ result });
  } catch (err: any) {
    console.error('AI analyze error:', err);
    return res.status(500).json({ error: 'AI analysis failed.' });
  }
});

// POST /api/ai/classify-image
router.post('/classify-image', async (req: Request, res: Response) => {
  try {
    const { image, description } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Base64 image is required.' });
    }

    const result = await aiService.classifyImage(image, description);
    return res.json({ result });
  } catch (err: any) {
    console.error('AI vision error:', err);
    return res.status(500).json({ error: 'Image classification failed.' });
  }
});

// POST /api/ai/detect-duplicates
router.post('/detect-duplicates', (req: Request, res: Response) => {
  try {
    const { category, title, description, location } = req.body;

    if (!category || !title || !location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return res.status(400).json({ error: 'Category, title, and valid location are required.' });
    }

    const existingComplaints = db.complaints.find();
    const duplicates = aiService.detectDuplicates(
      {
        category: category as ComplaintCategory,
        title,
        description: description || '',
        location,
      },
      existingComplaints
    );

    return res.json({
      hasDuplicates: duplicates.length > 0,
      count: duplicates.length,
      duplicates,
    });
  } catch (err: any) {
    console.error('Duplicate detection error:', err);
    return res.status(500).json({ error: 'Duplicate detection failed.' });
  }
});

// GET /api/ai/similar-complaints
router.get('/similar-complaints', (req: Request, res: Response) => {
  const { category, complaintId } = req.query;

  if (!category) {
    return res.status(400).json({ error: 'Category query parameter is required.' });
  }

  const resolved = db.complaints.find((c) => c.status === 'Resolved');
  const targetComplaint = complaintId ? db.complaints.findById(String(complaintId)) : undefined;

  const suggestions = aiService.suggestResolutions(
    targetComplaint || ({ category } as any),
    resolved
  );

  return res.json(suggestions);
});

export default router;
