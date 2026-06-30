import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, minPrice, maxPrice, sortBy, inStock } = req.query;

    const whereClause: any = {
      isActive: true,
    };

    if (inStock === 'true') {
      whereClause.inventory = {
        stockLevel: { gt: 0 },
      };
    }

    if (category) {
      whereClause.category = {
        slug: String(category),
      };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price.gte = parseFloat(String(minPrice));
      }
      if (maxPrice) {
        whereClause.price.lte = parseFloat(String(maxPrice));
      }
    }

    let orderByClause: any = { createdAt: 'desc' }; // Default sort
    if (sortBy === 'price_asc') {
      orderByClause = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderByClause = { price: 'desc' };
    } else if (sortBy === 'name_asc') {
      orderByClause = { name: 'asc' };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: true,
        category: true,
        farmer: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: orderByClause,
    });

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading catalog' });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        farmer: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
            certifications: true,
          },
        },
        inventory: {
          select: {
            stockLevel: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Load related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: {
        images: true,
        category: true,
      },
    });

    res.json({
      product,
      relatedProducts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading product details' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading categories' });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        images: true,
        category: true,
        inventory: {
          select: { stockLevel: true },
        },
        farmer: {
          include: {
            user: { select: { name: true } },
            certifications: { take: 1 },
          },
        },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading featured products' });
  }
};
