import { Router } from 'express';
import * as contentController from '../controllers/content.controller';
import * as topOfferController from '../controllers/top-offer.controller';
import * as pricingController from '../controllers/pricing.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();
router.get('/top-offer', topOfferController.getPublicTopOffer);
router.get('/pricing', pricingController.getPublicPricing);
router.get('/study-materials', authenticate, requireStudent, contentController.listStudyMaterials);
router.get('/current-affairs', authenticate, requireStudent, contentController.listCurrentAffairs);
router.get('/current-affairs/:slug', authenticate, requireStudent, contentController.getCurrentAffair);

export default router;
