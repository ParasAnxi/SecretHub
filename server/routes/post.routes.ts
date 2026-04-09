//IMPORTS
import express from 'express';
import { createPost, getAllPosts, getPost, updatePost, deletePost } from '../controllers/post.controller';
import { upload } from '../middleware/upload.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = express.Router();


//ROUTES
router.post('/',requireAuth ,upload.single('media'), createPost);
router.get('/', getAllPosts);
router.get('/:id', getPost);
router.patch('/:id',requireAuth, updatePost);
router.delete('/:id',requireAuth, deletePost);

export default router;
