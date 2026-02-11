import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'oysterponds-shellfish-secret-key-2026';

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
        // Fallback: token via query parameter (for PDF downloads via window.open)
        token = req.query.token;
    }

    if (!token) {
        throw new AppError('Access denied. No token provided.', 401);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch {
        throw new AppError('Invalid or expired token.', 401);
    }
};
