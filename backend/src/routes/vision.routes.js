import { Router } from 'express';
import multer from 'multer';
import { analyzeImageAI } from '../controllers/ai.controller.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'));

// Vision routes matching both /api/vision/analyze and /api/vision/analyze-image
router.post('/analyze', upload.single('image'), analyzeImageAI);
router.post('/analyze-image', upload.single('image'), analyzeImageAI);

export default router;
