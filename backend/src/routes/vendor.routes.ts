import { Router } from 'express';
import { submitKyc, getVendorProducts, adjustInventory, getLowStockAlerts, getVendorOrders } from '../controllers/vendor.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/kyc', protect, submitKyc);
router.get('/products', protect, getVendorProducts);
router.patch('/inventory/:id', protect, adjustInventory);
router.get('/inventory/alerts', protect, getLowStockAlerts);
router.get('/orders', protect, getVendorOrders);

export default router;
