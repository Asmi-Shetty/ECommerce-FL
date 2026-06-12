import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'nashik_organic_super_secret_jwt_key_2026_unbreakable';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, email, name, role } = req.body;

    if (!phone || !password) {
      res.status(400).json({ error: 'Phone number and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      res.status(400).json({ error: 'Phone number already registered' });
      return;
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        res.status(400).json({ error: 'Email address already registered' });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        phone,
        email: email || null,
        passwordHash,
        name: name || null,
        role: role || 'CUSTOMER',
        isVerified: false
      }
    });

    // Automatically create empty cart for customer
    if (newUser.role === 'CUSTOMER') {
      await prisma.cart.create({
        data: { userId: newUser.id }
      });
    }

    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isVerified: newUser.isVerified
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during signup' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loginIdentifier, password } = req.body; // loginIdentifier is either email or phone

    if (!loginIdentifier || !password) {
      res.status(400).json({ error: 'Login credentials and password are required' });
      return;
    }

    // Try to find by phone first, then email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: loginIdentifier },
          { email: loginIdentifier }
        ]
      }
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid login credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid login credentials' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    // Generate 6 digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 mins

    // UPSERT USER IF NOT EXISTS (or update if exists)
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          otpCode,
          otpExpiresAt,
          role: 'CUSTOMER',
          isVerified: false
        }
      });
      // Automatically create cart
      await prisma.cart.create({
        data: { userId: user.id }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt }
      });
    }

    // Log OTP to console in development
    console.log(`\n==================================================`);
    console.log(`[OTP VERIFICATION MOCK] Send SMS to ${phone}`);
    console.log(`Code: ${otpCode}`);
    console.log(`Expires in: 10 minutes`);
    console.log(`==================================================\n`);

    res.json({ message: 'OTP sent successfully (Mock mode)' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during OTP request' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and OTP code are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      res.status(400).json({ error: 'OTP code has not been requested' });
      return;
    }

    if (user.otpExpiresAt < new Date()) {
      res.status(400).json({ error: 'OTP code has expired' });
      return;
    }

    if (user.otpCode !== code) {
      res.status(400).json({ error: 'Invalid OTP code' });
      return;
    }

    // Update user verification
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null
      }
    });

    const token = generateToken(updatedUser.id, updatedUser.role);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during OTP verification' });
  }
};

export const setupProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { name, email, addressLine1, addressLine2, landmark, pincode } = req.body;

    if (!name || !addressLine1 || !pincode) {
      res.status(400).json({ error: 'Name, Address Line 1, and Pincode are required' });
      return;
    }

    // Update user details
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email: email || undefined
      }
    });

    // Create address
    const newAddress = await prisma.address.create({
      data: {
        userId,
        addressLine1,
        addressLine2: addressLine2 || null,
        landmark: landmark || null,
        pincode,
        city: 'Nashik',
        state: 'Maharashtra',
        isDefault: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      },
      address: newAddress
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during profile setup' });
  }
};
