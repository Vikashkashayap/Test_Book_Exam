import { Router } from 'express';
import * as bookmarkController from '../controllers/bookmark.controller';
import { authenticate, requireStudent } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, requireStudent, bookmarkController.listBookmarks);
router.post('/', authenticate, requireStudent, bookmarkController.addBookmark);
router.delete('/:questionId', authenticate, requireStudent, bookmarkController.removeBookmark);
router.patch('/:questionId/note', authenticate, requireStudent, bookmarkController.updateBookmarkNote);

export default router;
