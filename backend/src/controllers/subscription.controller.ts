import { Response } from 'express';
import prisma from '../config/db';

export const createSubscription = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { planName, frequency, items } = req.body;
    // items: Array<{ productId: string; quantity: number }>

    if (!planName || !frequency) {
      res.status(400).json({ error: 'Plan name and frequency are required' });
      return;
    }

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'At least one product must be added to the subscription basket' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date();

    switch (frequency) {
      case 'DAILY':   endDate.setMonth(endDate.getMonth() + 1);  break;
      case 'WEEKLY':  endDate.setMonth(endDate.getMonth() + 3);  break;
      case 'MONTHLY': endDate.setFullYear(endDate.getFullYear() + 1); break;
      default:        endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planName,
        frequency,
        startDate,
        endDate,
        isActive: true,
        isPaused: false,
        items: {
          create: items.map((item: { productId: string; quantity: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error creating subscription' });
  }
};

export const getMySubscriptions = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subscriptions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading subscriptions' });
  }
};

export const pauseSubscription = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) { res.status(404).json({ error: 'Subscription not found' }); return; }
    if (!sub.isActive) { res.status(400).json({ error: 'Subscription is already cancelled' }); return; }
    if (sub.isPaused) { res.status(400).json({ error: 'Subscription is already paused' }); return; }

    const updated = await prisma.subscription.update({ where: { id }, data: { isPaused: true } });
    res.json({ message: 'Subscription paused successfully', subscription: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error pausing subscription' });
  }
};

export const resumeSubscription = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) { res.status(404).json({ error: 'Subscription not found' }); return; }
    if (!sub.isPaused) { res.status(400).json({ error: 'Subscription is not paused' }); return; }

    const updated = await prisma.subscription.update({ where: { id }, data: { isPaused: false } });
    res.json({ message: 'Subscription resumed successfully', subscription: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error resuming subscription' });
  }
};

export const cancelSubscription = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sub = await prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) { res.status(404).json({ error: 'Subscription not found' }); return; }
    if (!sub.isActive) { res.status(400).json({ error: 'Subscription is already cancelled' }); return; }

    const updated = await prisma.subscription.update({ where: { id }, data: { isActive: false, isPaused: false } });
    res.json({ message: 'Subscription cancelled', subscription: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error cancelling subscription' });
  }
};
