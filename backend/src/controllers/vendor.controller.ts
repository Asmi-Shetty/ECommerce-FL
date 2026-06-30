import { Response } from 'express';
import prisma from '../config/db';

export const submitKyc = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { farmName, location, bio } = req.body;

    let farmer = await prisma.farmer.findUnique({ where: { userId } });
    
    if (farmer) {
      farmer = await prisma.farmer.update({
        where: { id: farmer.id },
        data: { farmName, location, bio, kycStatus: 'APPROVED' }, // Mocking auto-approval for demo
      });
    } else {
      farmer = await prisma.farmer.create({
        data: { userId, farmName, location, bio, kycStatus: 'APPROVED' },
      });
    }

    res.json({ message: 'KYC submitted and verified successfully', farmer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during KYC submission' });
  }
};

export const getVendorProducts = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const farmer = await prisma.farmer.findUnique({ where: { userId } });
    if (!farmer) { res.status(403).json({ error: 'Vendor profile not found' }); return; }

    const products = await prisma.product.findMany({
      where: { farmerId: farmer.id },
      include: {
        images: true,
        category: true,
        inventory: true,
      },
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading products' });
  }
};

export const adjustInventory = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Inventory ID
    const { stockLevel, lowStockThresh } = req.body;

    const farmer = await prisma.farmer.findUnique({ where: { userId } });
    if (!farmer) { res.status(403).json({ error: 'Vendor profile not found' }); return; }

    // Validate ownership implicitly by checking product
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!inventory || inventory.product.farmerId !== farmer.id) {
      res.status(403).json({ error: 'Not authorized to modify this inventory' });
      return;
    }

    const updated = await prisma.inventory.update({
      where: { id },
      data: { 
        stockLevel: stockLevel !== undefined ? stockLevel : inventory.stockLevel,
        lowStockThresh: lowStockThresh !== undefined ? lowStockThresh : inventory.lowStockThresh,
      },
    });

    res.json({ message: 'Inventory updated successfully', inventory: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error adjusting inventory' });
  }
};

export const getLowStockAlerts = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const farmer = await prisma.farmer.findUnique({ where: { userId } });
    if (!farmer) { res.status(403).json({ error: 'Vendor profile not found' }); return; }

    // Using query raw or finding products where inventory < lowStockThresh
    const products = await prisma.product.findMany({
      where: { farmerId: farmer.id },
      include: { inventory: true, images: true }
    });

    const alerts = products.filter(p => p.inventory && p.inventory.stockLevel <= p.inventory.lowStockThresh);
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error fetching stock alerts' });
  }
};

export const getVendorOrders = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const farmer = await prisma.farmer.findUnique({ where: { userId } });
    if (!farmer) { res.status(403).json({ error: 'Vendor profile not found' }); return; }

    // Find orders that contain items belonging to this farmer
    const orderItems = await prisma.orderItem.findMany({
      where: { product: { farmerId: farmer.id } },
      include: {
        order: {
          include: { user: { select: { name: true, phone: true } }, address: true }
        },
        product: { select: { name: true, unit: true } }
      },
      orderBy: { order: { createdAt: 'desc' } }
    });

    res.json(orderItems);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error fetching vendor orders' });
  }
};
