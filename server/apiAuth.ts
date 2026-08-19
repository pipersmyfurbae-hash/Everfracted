import type { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

export type ApiUser = {
  uid: string;
  role: string;
  tier: string;
};

export function sendApiError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

export async function readApiUser(db: Firestore, req: Request): Promise<ApiUser | null> {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) return null;

  const decoded = await getAuth().verifyIdToken(token);
  const profile = await db.collection('users').doc(decoded.uid).get();
  const data = profile.exists ? profile.data() || {} : {};
  return {
    uid: decoded.uid,
    role: typeof data.role === 'string' ? data.role : 'free',
    tier: typeof data.tier === 'string' ? data.tier : 'free',
  };
}

export function isStudioMaker(user: ApiUser): boolean {
  return user.role === 'admin' || user.tier === 'studio' || user.tier === 'atelier' || user.tier === 'pro' || user.tier === 'enterprise';
}

export function ownsOrAdmins(user: ApiUser, ownerId: unknown): boolean {
  return user.role === 'admin' || ownerId === user.uid;
}

export function requireStudioMaker(db: Firestore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await readApiUser(db, req);
      if (!user) {
        sendApiError(res, 401, 'AUTH_REQUIRED', 'Sign in to access this maker workflow.');
        return;
      }
      if (!isStudioMaker(user)) {
        sendApiError(res, 403, 'TIER_REQUIRED', 'This workflow requires a Studio-tier or higher maker account.');
        return;
      }
      res.locals.apiUser = user;
      next();
    } catch {
      sendApiError(res, 401, 'INVALID_TOKEN', 'Your session could not be verified.');
    }
  };
}

export function requireAuthenticated(db: Firestore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await readApiUser(db, req);
      if (!user) {
        sendApiError(res, 401, 'AUTH_REQUIRED', 'Sign in to continue.');
        return;
      }
      res.locals.apiUser = user;
      next();
    } catch {
      sendApiError(res, 401, 'INVALID_TOKEN', 'Your session could not be verified.');
    }
  };
}
