import { Router } from 'express';
import {
  scheduleConsultation,
  getConsultations,
  joinConsultation,
  declineConsultation,
  createConsultation,
  startConsultation,
  endConsultation,
  pushToDoctor,
  ringCall
} from '../controllers/consultation.controller.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateUser);

// Assistants (and admins on their behalf) request/schedule consultations
router.post('/push-case', authorizeRoles('CLINIC_ASSISTANT', 'ADMIN'), pushToDoctor);
router.post('/push-to-doctor', authorizeRoles('CLINIC_ASSISTANT', 'ADMIN'), pushToDoctor);
router.post('/ring-call', authorizeRoles('CLINIC_ASSISTANT', 'ADMIN'), ringCall);
router.post('/schedule', authorizeRoles('CLINIC_ASSISTANT', 'ADMIN'), scheduleConsultation);
router.get('/', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'), getConsultations);
// Both sides of the call may join; only doctors accept/decline
router.post('/:id/join', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR'), joinConsultation);
router.post('/:id/decline', authorizeRoles('DOCTOR'), declineConsultation);

router.post('/', authorizeRoles('CLINIC_ASSISTANT', 'ADMIN'), createConsultation);
router.post('/:id/start', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR'), startConsultation);
router.post('/:id/end', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR'), endConsultation);

export default router;
