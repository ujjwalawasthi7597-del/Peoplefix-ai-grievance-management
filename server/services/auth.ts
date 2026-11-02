import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/store.ts';
import { IUser, UserRole } from '../types.ts';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'civicfix_jwt_access_secret_2026_dev_mode';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'civicfix_jwt_refresh_secret_2026_dev_mode';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// In-memory / persistent refresh token store for revocation
interface StoredRefreshToken {
  tokenHash: string;
  userId: string;
  expiresAt: number;
  revoked: boolean;
}

const refreshTokensStore: StoredRefreshToken[] = [];

// Password reset token store
interface StoredResetToken {
  tokenHash: string;
  userId: string;
  expiresAt: number;
  used: boolean;
}

const passwordResetTokensStore: StoredResetToken[] = [];

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
}

export const authService = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  // Verify password
  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },

  // Generate tokens
  generateTokens(user: IUser) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
    };

    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES as any,
    });

    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const refreshToken = jwt.sign({ ...payload, jti: refreshTokenRaw }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES as any,
    });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = Date.now() + 7 * 86400 * 1000;

    refreshTokensStore.push({
      tokenHash,
      userId: user.id,
      expiresAt,
      revoked: false,
    });

    return { accessToken, refreshToken };
  },

  // Verify Access Token
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  // Verify and rotate Refresh Token
  verifyRefreshToken(token: string): { user: IUser; tokens: { accessToken: string; refreshToken: string } } | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const stored = refreshTokensStore.find((t) => t.tokenHash === tokenHash);
      if (!stored || stored.revoked || stored.expiresAt < Date.now()) {
        return null;
      }

      // Invalidate current refresh token (rotation)
      stored.revoked = true;

      const user = db.users.findById(decoded.userId);
      if (!user || !user.isActive) {
        return null;
      }

      // Issue new pair
      const newTokens = this.generateTokens(user);
      return { user, tokens: newTokens };
    } catch {
      return null;
    }
  },

  // Revoke Refresh Token (logout)
  revokeRefreshToken(token: string): boolean {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const stored = refreshTokensStore.find((t) => t.tokenHash === tokenHash);
      if (stored) {
        stored.revoked = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Forgot password token generation
  createPasswordResetToken(userId: string): string {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    passwordResetTokensStore.push({
      tokenHash,
      userId,
      expiresAt,
      used: false,
    });

    return rawToken;
  },

  // Verify reset token and update password
  async resetPasswordWithToken(rawToken: string, newPassword: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = passwordResetTokensStore.find(
      (r) => r.tokenHash === tokenHash && !r.used && r.expiresAt > Date.now()
    );

    if (!record) return false;

    const user = db.users.findById(record.userId);
    if (!user) return false;

    const passwordHash = await this.hashPassword(newPassword);
    db.users.update(user.id, { passwordHash });

    record.used = true;

    // Revoke all existing refresh tokens for this user
    refreshTokensStore
      .filter((t) => t.userId === user.id)
      .forEach((t) => (t.revoked = true));

    // Audit log
    db.auditLogs.create({
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'auth',
      entityId: user.id,
      timestamp: new Date().toISOString(),
    });

    return true;
  },

  // Password validation helper
  validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number.' };
    }
    return { valid: true };
  },

  // Safe user representation (without password hash)
  sanitizeUser(user: IUser) {
    const { passwordHash, ...rest } = user;
    return rest;
  },
};
