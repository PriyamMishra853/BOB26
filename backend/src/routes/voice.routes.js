import { Router } from 'express';
import multer from 'multer';
import { transcribeSpeech } from '../controllers/ai.controller.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticateUser);
router.use(authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'));

// Voice routes matching /api/voice/transcribe
router.post('/transcribe', upload.single('audio'), transcribeSpeech);

export default router;
