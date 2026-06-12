import { Router } from 'express';
import { signup, login, sendOtp, verifyOtp, setupProfile } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.post('/profile-setup', protect, setupProfile);

export default router;
