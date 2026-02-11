import { Router } from 'express';
import { body } from 'express-validator';
import { login, verifyToken } from '../controllers/authController.js';
import { validate } from '../middleware/validateRequest.js';

const router = Router();

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// POST /api/auth/login
router.post('/login', validate(loginValidation), login);

// GET /api/auth/verify
router.get('/verify', verifyToken);

export default router;
