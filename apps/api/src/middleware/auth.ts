import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: TokenPayload & { id: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  void (async () => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId).select('isBanned role');

      if (!user || user.isBanned) {
        throw new ApiError(403, 'Account suspended or not found');
      }

      req.user = { ...payload, id: payload.userId };
      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(401, 'Invalid or expired token');
    }
  })().catch(next);
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new ApiError(403, 'Insufficient permissions');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const requireStudent = authorize('student', 'instructor', 'admin', 'super_admin');
export const requireInstructor = authorize('instructor', 'admin', 'super_admin');
export const requireAdmin = authorize('admin', 'super_admin');
export const requireSuperAdmin = authorize('super_admin');

export function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}
