import { Router } from 'express';
import { getProducts as getProds, getProductBySlug as getProdSlug, getCategories as getCats } from '../controllers/product.controller';

const router = Router();

router.get('/', getProds);
router.get('/categories', getCats);
router.get('/:slug', getProdSlug);

export default router;
