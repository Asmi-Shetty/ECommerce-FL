import { Router } from 'express';
import { getProducts as getProds, getProductBySlug as getProdSlug, getCategories as getCats, getFeaturedProducts as getFeatured } from '../controllers/product.controller';

const router = Router();

router.get('/', getProds);
router.get('/categories', getCats);
router.get('/featured', getFeatured);
router.get('/:slug', getProdSlug);

export default router;
