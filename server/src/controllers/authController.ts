import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'oysterponds-shellfish-secret-key-2026';

// Login
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError('Account is deactivated. Contact administrator.', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET as jwt.Secret,
        { expiresIn: '7d' }
    );

    const response: ApiResponse = {
        success: true,
        data: {
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        },
        message: 'Login successful',
    };

    res.status(200).json(response);
});

// Verify token (check if still valid)
export const verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        const user = await User.findById(decoded.userId).select('-password');

        if (!user || !user.isActive) {
            throw new AppError('User not found or deactivated', 401);
        }

        const response: ApiResponse = {
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            message: 'Token is valid',
        };

        res.status(200).json(response);
    } catch {
        throw new AppError('Invalid or expired token', 401);
    }
});
