import { Response } from 'express';
import prisma from '../config/db';

export const validateCoupon = async (req: any, res: Response): Promise<void> => {
  try {
    const { code, orderValue } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Coupon code is required' });
      return;
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      res.status(404).json({ error: 'Coupon code is invalid or expired' });
      return;
    }

    if (new Date() > coupon.expiryDate) {
      res.status(400).json({ error: 'Coupon code has expired' });
      return;
    }

    if (orderValue < coupon.minOrderVal) {
      res.status(400).json({
        error: `Minimum order value of ₹${coupon.minOrderVal} required to apply this coupon`,
      });
      return;
    }

    res.json({
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        isPercentage: coupon.isPercentage,
        minOrderVal: coupon.minOrderVal,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error checking coupon code' });
  }
};

export const createOrder = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const {
      addressId,
      couponCode,
      cartItems, // Array of { productId, quantity }
      deliverySlot,
      deliveryDate,
      paymentMethod,
    } = req.body;

    if (!addressId || !cartItems || cartItems.length === 0 || !deliverySlot || !deliveryDate) {
      res.status(400).json({ error: 'Missing critical checkout fields' });
      return;
    }

    // Verify address exists
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      res.status(400).json({ error: 'Invalid delivery address' });
      return;
    }

    // Calculate subtotal
    let subtotal = 0;
    const orderItemsData: { productId: string; price: number; quantity: number }[] = [];

    for (const item of cartItems) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true },
      });

      if (!dbProduct || !dbProduct.isActive) {
        res.status(400).json({ error: `Product not found or inactive: ${item.productId}` });
        return;
      }

      // Check stock
      if (dbProduct.inventory && dbProduct.inventory.stockLevel < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for product ${dbProduct.name}. Available: ${dbProduct.inventory.stockLevel} ${dbProduct.unit}`,
        });
        return;
      }

      const itemPrice = dbProduct.discountPrice !== null ? dbProduct.discountPrice : dbProduct.price;
      subtotal += itemPrice * item.quantity;

      orderItemsData.push({
        productId: dbProduct.id,
        price: itemPrice,
        quantity: item.quantity,
      });
    }

    // Process Coupon
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(couponCode).toUpperCase() },
      });

      if (coupon && coupon.isActive && new Date() <= coupon.expiryDate && subtotal >= coupon.minOrderVal) {
        couponId = coupon.id;
        if (coupon.isPercentage) {
          discount = (subtotal * coupon.discount) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        } else {
          discount = coupon.discount;
        }
      }
    }

    // Delivery charge
    const deliveryCharge = subtotal > 300 ? 0 : 30;
    const total = Math.max(0, subtotal - discount + deliveryCharge);

    // Create unique order friendly number: e.g. NEX-2026-XXXX
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const orderNumber = `NEX-26-${randSuffix}`;

    // Database transaction to create order, decrement stocks, and setup payments
    const newOrder = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          couponId,
          subtotal,
          discount,
          deliveryCharge,
          total,
          status: 'CONFIRMED', // Start as confirmed for easy demo flow
          deliverySlot,
          deliveryDate: new Date(deliveryDate),
          items: {
            create: orderItemsData,
          },
        },
      });

      // Decrement Inventory
      for (const item of orderItemsData) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            stockLevel: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Create Payment entry
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod || 'COD',
          status: paymentMethod === 'COD' ? 'PENDING' : 'SUCCESSFUL',
          amount: total,
          transactionId: paymentMethod === 'COD' ? null : `rzp_verify_${Math.random().toString(36).substring(7)}`,
        },
      });

      return order;
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error placing order' });
  }
};

export const getOrderHistory = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading orders' });
  }
};

export const getOrderById = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        address: true,
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error loading order details' });
  }
};

export const generateDeliveryOtp = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'DELIVERED') {
      res.status(400).json({ error: 'Order is already delivered' });
      return;
    }

    // Generate a 4-digit delivery OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // Valid for 1 hour

    await prisma.order.update({
      where: { id },
      data: {
        deliveryOtp: otp,
        deliveryOtpAt: otpExpiresAt,
        status: 'OUT_FOR_DELIVERY',
      },
    });

    // Log OTP to console (in production this goes to delivery agent app)
    console.log(`\n==================================================`);
    console.log(`[DELIVERY OTP] Order: ${order.orderNumber}`);
    console.log(`OTP: ${otp} | Valid for 1 hour`);
    console.log(`==================================================\n`);

    res.json({
      message: 'Delivery OTP generated successfully',
      otp,
      expiresAt: otpExpiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error generating delivery OTP' });
  }
};

export const confirmDelivery = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      res.status(400).json({ error: 'Delivery OTP is required' });
      return;
    }

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'DELIVERED') {
      res.status(400).json({ error: 'Order is already delivered' });
      return;
    }

    if (!order.deliveryOtp || !order.deliveryOtpAt) {
      res.status(400).json({ error: 'Delivery OTP has not been generated for this order. Request the agent to generate it first.' });
      return;
    }

    if (new Date() > order.deliveryOtpAt) {
      res.status(400).json({ error: 'Delivery OTP has expired. Please request a new one.' });
      return;
    }

    if (order.deliveryOtp !== String(otp)) {
      res.status(400).json({ error: 'Invalid delivery OTP. Please check and try again.' });
      return;
    }

    // Confirm delivery
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveryOtp: null,
        deliveryOtpAt: null,
      },
    });

    res.json({
      message: 'Delivery confirmed successfully!',
      order: updatedOrder,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error confirming delivery' });
  }
};
