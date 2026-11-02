import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.ts';
import { db } from '../db/store.ts';
import { UserRole, IUser } from '../types.ts';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // 2. Cookie fallback
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const payload = authService.verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }

  // Fetch trusted server-side user record
  const user = db.users.findById(payload.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User account not found or deactivated.' });
  }

  req.user = user;
  req.tokenPayload = payload;
  next();
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
}

export function authorizeDepartment(getDepartmentId: (req: AuthenticatedRequest) => string | undefined) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admins have universal clearance
    if (req.user.role === 'admin') {
      return next();
    }

    const targetDeptId = getDepartmentId(req);
    if (!targetDeptId) {
      return next();
    }

    if (req.user.role === 'officer' && req.user.departmentId !== targetDeptId) {
      return res.status(403).json({
        error: 'Access denied. You are only authorized to access complaints for your assigned department.',
      });
    }

    next();
  };
}
