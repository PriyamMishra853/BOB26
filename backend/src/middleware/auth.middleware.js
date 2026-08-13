import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { roleHasPermission, isHardDenied } from '../config/rbac.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Check internal JWT token or Supabase session
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      return next();
    } catch (err) {
      // Fallback: try decoding via Supabase Auth
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
      }
      
      // Fetch matching staff profile by email (role source of truth)
      const { data: profile } = await supabaseAdmin
        .from('staff_profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      const roleMap = { clinic_assistant: 'CLINIC_ASSISTANT', doctor: 'DOCTOR', admin: 'ADMIN' };
      req.user = {
        id: profile?.id || user.id,
        auth_user_id: user.id,
        email: user.email,
        role: roleMap[profile?.role] || 'CLINIC_ASSISTANT',
        name: profile?.full_name || 'Clinic User'
      };
      return next();
    }
  } catch (error) {
    return res.status(500).json({ error: 'Auth middleware server error', details: error.message });
  }
};

/**
 * Permission-level guard driven by the central RBAC matrix (config/rbac.js).
 * Hard denials (e.g. ADMIN creating prescriptions) can never be bypassed.
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    if (isHardDenied(req.user.role, permission) || !roleHasPermission(req.user.role, permission)) {
      return res.status(403).json({
        error: `Access Denied. Role '${req.user.role}' does not hold the '${permission}' permission.`
      });
    }
    next();
  };
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied. Role '${req.user.role}' is not authorized for this operation. Required: [${roles.join(', ')}]` 
      });
    }
    next();
  };
};
