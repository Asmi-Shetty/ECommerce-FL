import { Router } from 'express';
import { createOrder, getOrderHistory, getOrderById, validateCoupon, generateDeliveryOtp, confirmDelivery } from '../controllers/order.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrderHistory);
router.post('/coupons/validate', protect, validateCoupon);
router.post('/:id/delivery-otp', protect, generateDeliveryOtp);
router.post('/:id/confirm-delivery', protect, confirmDelivery);
router.get('/:id', protect, getOrderById);

export default router;
