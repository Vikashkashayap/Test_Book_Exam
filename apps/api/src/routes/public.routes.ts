import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router = Router();

router.get('/pyq', publicController.listPublicPyq);
router.get('/blogs', publicController.listPublicBlogs);
router.get('/blogs/:slug', publicController.getPublicBlog);

export default router;
