import { Router } from 'express';
import { getBanners, getLoyaltyPoints, submitReferral } from '../controllers/promotion.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/banners', getBanners); // Public
router.get('/loyalty', protect, getLoyaltyPoints);
router.post('/referral', protect, submitReferral);

export default router;
