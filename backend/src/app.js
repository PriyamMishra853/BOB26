import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import visitRoutes from './routes/visit.routes.js';
import documentRoutes from './routes/document.routes.js';
import aiRoutes from './routes/ai.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import adminRoutes from './routes/admin.routes.js';
import visionRoutes from './routes/vision.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import callRoutes from './routes/call.routes.js';

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://virtual-village-clinic.vercel.app' // Replace with actual production URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root API Endpoint Welcome
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Virtual Village Clinic AI Backend API',
    endpoints: {
      health: '/api/health',
      patients: '/api/patients',
      visits: '/api/visits',
      ai: '/api/ai',
      vision: '/api/vision',
      voice: '/api/voice',
      doctor: '/api/doctor',
      calls: '/api/calls',
      consultations: '/api/consultations'
    }
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Virtual Village Clinic AI Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  
  // Structured logging
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    path: req.path,
    method: req.method,
    status: statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  }));

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Request Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

export default app;
