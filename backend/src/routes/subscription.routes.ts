import { Router } from 'express';
import {
  createSubscription,
  getMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from '../controllers/subscription.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createSubscription);
router.get('/', protect, getMySubscriptions);
router.patch('/:id/pause', protect, pauseSubscription);
router.patch('/:id/resume', protect, resumeSubscription);
router.patch('/:id/cancel', protect, cancelSubscription);

export default router;
