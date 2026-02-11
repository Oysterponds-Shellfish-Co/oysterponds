import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import customerRoutes from './customerRoutes.js';
import orderRoutes from './orderRoutes.js';
import harvestLocationRoutes from './harvestLocationRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import reportRoutes from './reportRoutes.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ──── Public Routes (no auth required) ────

// Auth endpoints
router.use('/auth', authRoutes);

// Customer portal public endpoints
// Products list (needed by customer order portal)
router.get('/products', (req, res, next) => {
    // Forward to product routes without auth
    req.url = '/';
    productRoutes(req, res, next);
});

// Customer by slug (needed by customer order portal)
router.get('/customers/slug/:slug', (req, res, next) => {
    req.url = `/slug/${req.params.slug}`;
    customerRoutes(req, res, next);
});

// Customer pricing (needed by customer order portal)
router.get('/customers/:id/pricing', (req, res, next) => {
    req.url = `/${req.params.id}/pricing`;
    customerRoutes(req, res, next);
});

// Harvest locations (needed by customer order portal)
router.get('/harvest-locations', (req, res, next) => {
    req.url = '/';
    harvestLocationRoutes(req, res, next);
});

// Public order creation (needed by customer order portal)
router.post('/orders/public', (req, res, next) => {
    req.url = '/public';
    orderRoutes(req, res, next);
});

// Health check
router.get('/health', (_req, res) => {
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// ──── Protected Routes (auth required) ────

router.use('/products', authenticate, productRoutes);
router.use('/customers', authenticate, customerRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/harvest-locations', authenticate, harvestLocationRoutes);
router.use('/invoices', authenticate, invoiceRoutes);
router.use('/reports', authenticate, reportRoutes);

export default router;
