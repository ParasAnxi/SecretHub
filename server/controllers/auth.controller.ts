//IMPORTS
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, setAuthCookies, clearAuthCookies } from '../utils/jwt';
import { sendVerificationEmail } from '../utils/email';
import { prisma } from '../utils/prisma';

//REGISTER SCHEMA
const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(5),
  fullName: z.string().min(3),
});

//REGISTER FUNCTION
export const register = async (req: Request, res: Response) => {
  try {
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
       res.status(400).json({ success: false, errors: parsedData.error.issues });
       return;
    }
    console.log(parsedData)
    const { username, email, password, fullName } = parsedData.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: username }] }
    });

    if (existingUser) {
       res.status(409).json({ success: false, message: 'Username or email already exists' });
       return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username,
        email,
        passwordHash,
        fullName,
      }
    });

    const vToken = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        token: vToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    });

    await sendVerificationEmail(email, vToken);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, isVerified: false },
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error?.message || error?.toString() });
  }
};

//LOGIN FUNCTION
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
       res.status(400).json({ success: false, message: 'Email and password are required' });
       return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
       res.status(401).json({ success: false, message: 'Invalid credentials' });
       return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
       res.status(401).json({ success: false, message: 'Invalid credentials' });
       return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, isVerified: user.isVerified }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//REFRESH FUNCTION
export const refresh = async (req: Request, res: Response) => {
  try {
    const existingRefreshToken = req.cookies?.refreshToken;
    if (!existingRefreshToken) {
       res.status(401).json({ success: false, message: 'Refresh token missing' });
       return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(existingRefreshToken);
    } catch (e) {
       res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
       return;
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: existingRefreshToken }
    });

    if (!dbToken || dbToken.revoked) {
      if (dbToken && dbToken.revoked) {
         await prisma.refreshToken.updateMany({
             where: { userId: decoded.userId },
             data: { revoked: true }
         });
      }
       res.status(401).json({ success: false, message: 'Invalid token' });
       return;
    }

    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revoked: true }
    });

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: decoded.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true, message: 'Tokens refreshed' });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//LOGOUT FUNCTION
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true }
      });
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//VERIFY EMAIL FUNCTION
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
       res.status(400).json({ success: false, message: 'Token is required' });
       return;
    }

    const vToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!vToken || vToken.expiresAt < new Date()) {
       res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
       return;
    }

    await prisma.user.update({
      where: { id: vToken.userId },
      data: { isVerified: true }
    });

    await prisma.verificationToken.delete({
      where: { id: vToken.id }
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
