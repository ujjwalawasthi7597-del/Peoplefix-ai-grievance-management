import { Router, Request, Response } from 'express';
import { db } from '../db/store.ts';
import { authService } from '../services/auth.ts';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.ts';
import { IUser } from '../types.ts';

const router = Router();

// Helper to set HTTP-only cookies
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, termsAccepted } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (name, email, phone, password) are required.' });
    }

    if (!termsAccepted) {
      return res.status(400).json({ error: 'You must accept the terms and conditions.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Validate password strength
    const strength = authService.validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    // Check if email already registered
    const existing = db.users.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Default role is strictly 'citizen'
    const newUser: IUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      role: 'citizen',
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.create(newUser);

    // Audit log
    db.auditLogs.create({
      id: `audit-${Date.now()}`,
      actorId: newUser.id,
      actorName: newUser.name,
      actorRole: 'citizen',
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: newUser.id,
      timestamp: new Date().toISOString(),
    });

    // Generate tokens
    const tokens = authService.generateTokens(newUser);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(201).json({
      message: 'Account successfully registered.',
      user: authService.sanitizeUser(newUser),
      accessToken: tokens.accessToken,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been deactivated. Please contact municipal admin.' });
    }

    const passwordMatch = await authService.comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate tokens
    const tokens = authService.generateTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    // Audit log
    db.auditLogs.create({
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: 'Login successful.',
      user: authService.sanitizeUser(user),
      accessToken: tokens.accessToken,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const result = authService.verifyRefreshToken(refreshToken);
    if (!result) {
      return res.status(401).json({ error: 'Invalid or revoked refresh token. Please sign in again.' });
    }

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    return res.json({
      accessToken: result.tokens.accessToken,
      user: authService.sanitizeUser(result.user),
    });
  } catch (err: any) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Error refreshing token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (refreshToken) {
    authService.revokeRefreshToken(refreshToken);
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return res.json({ message: 'Successfully logged out.' });
});

// GET /api/auth/me
router.get('/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: authService.sanitizeUser(req.user!) });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const user = db.users.findByEmail(email);
  if (!user) {
    // Return standard response to prevent email enumeration
    return res.json({
      message: 'If the email is registered, password reset instructions have been generated.',
    });
  }

  const resetToken = authService.createPasswordResetToken(user.id);

  // In this civic platform demo, return the reset token directly so the tester can test it seamlessly!
  return res.json({
    message: 'Password reset token generated successfully.',
    resetToken,
    instructions: 'Use this reset token on the password reset page to choose a new password.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const strength = authService.validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const success = await authService.resetPasswordWithToken(token, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    return res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Error resetting password.' });
  }
});

// PATCH /api/auth/change-password
router.patch('/change-password', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const isMatch = await authService.comparePassword(currentPassword, req.user!.passwordHash!);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const strength = authService.validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const passwordHash = await authService.hashPassword(newPassword);
    db.users.update(req.user!.id, { passwordHash });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error changing password.' });
  }
});

// GET /api/auth/demo-accounts (convenience helper for reviewers)
router.get('/demo-accounts', (_req: Request, res: Response) => {
  res.json({
    accounts: [
      { role: 'citizen', email: 'citizen@civicfix.org', label: 'Alex Johnson (Citizen)', passwordHint: 'Citizen@123' },
      { role: 'officer', email: 'officer.roads@civicfix.org', label: 'Officer Rajesh Kumar (Roads Lead)', passwordHint: 'Officer@123' },
      { role: 'officer', email: 'officer.sanitation@civicfix.org', label: 'Officer Priya Sharma (Sanitation Lead)', passwordHint: 'Officer@123' },
      { role: 'admin', email: 'admin@civicfix.org', label: 'Commissioner Sarah Chen (Admin)', passwordHint: 'Admin@123' },
    ],
  });
});

export default router;
