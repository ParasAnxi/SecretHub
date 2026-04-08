//IMPORTS
import { Router } from 'express';
import { register, login, refresh, logout, verifyEmail } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

//ROUTER
const router = Router();

//ROUTES
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.get('/verify-email', verifyEmail);

export default router;
