import express from 'express';
import { getDoctorAvailability, scheduleCall, listCalls, updateCallStatus } from '../controllers/call.controller.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/availability', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'), getDoctorAvailability);
router.post('/schedule', authorizeRoles('CLINIC_ASSISTANT', 'ADMIN'), scheduleCall);
router.get('/', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'), listCalls);
router.patch('/:id/status', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'), updateCallStatus);
router.post('/:id/status', authorizeRoles('CLINIC_ASSISTANT', 'DOCTOR', 'ADMIN'), updateCallStatus);

export default router;
