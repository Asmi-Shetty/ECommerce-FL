import { Response } from 'express';
import prisma from '../config/db';

export const getBanners = async (req: any, res: Response): Promise<void> => {
  try {
    const banners = await prisma.promotionBanner.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
    res.json(banners);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading banners' });
  }
};

export const getLoyaltyPoints = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPointsBalance: true }
    });

    const history = await prisma.loyaltyPoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      balance: user?.loyaltyPointsBalance || 0,
      history
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading loyalty points' });
  }
};

export const submitReferral = async (req: any, res: Response): Promise<void> => {
  try {
    const referrerId = req.user.id;
    const { referredPhone } = req.body;

    if (!referredPhone) {
      res.status(400).json({ error: 'Referred phone number is required' });
      return;
    }

    const referredUser = await prisma.user.findUnique({ where: { phone: referredPhone } });
    if (!referredUser) {
      res.status(404).json({ error: 'User with that phone number is not registered yet.' });
      return;
    }
    
    if (referrerId === referredUser.id) {
      res.status(400).json({ error: 'Cannot refer yourself.' });
      return;
    }

    // Check if referral already exists
    const existing = await prisma.referral.findFirst({
      where: { referredUserId: referredUser.id }
    });

    if (existing) {
      res.status(400).json({ error: 'User has already been referred by someone.' });
      return;
    }

    const rewardPoints = 50.0;

    const referral = await prisma.referral.create({
      data: {
        referrerId,
        referredUserId: referredUser.id,
        status: 'COMPLETED',
        rewardPoints
      }
    });

    // Award points to referrer
    await prisma.loyaltyPoint.create({
      data: { userId: referrerId, points: rewardPoints, transactionType: 'EARNED', description: `Referral reward for ${referredUser.name || referredPhone}` }
    });
    
    await prisma.user.update({
      where: { id: referrerId },
      data: { loyaltyPointsBalance: { increment: rewardPoints } }
    });

    res.json({ message: `Referral successful! You earned ${rewardPoints} points.`, referral });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error submitting referral' });
  }
};
