import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/index.js';
import {
    getOrders,
    getOrder,
    createOrder,
    createPublicOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getOrderStats,
} from '../controllers/index.js';

const router = Router();

// Validation rules for internal order creation
const orderValidation = [
    body('customer').isMongoId().withMessage('Valid customer ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('items.*.pricePerUnit')
        .isFloat({ min: 0 })
        .withMessage('Price per unit must be positive'),
    body('deliveryDate')
        .isISO8601()
        .withMessage('Valid delivery date is required'),
];

// Validation rules for public order creation
const publicOrderValidation = [
    body('customerSlug').trim().notEmpty().withMessage('Customer slug is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('deliveryDate')
        .isISO8601()
        .withMessage('Valid delivery date is required'),
];

// Validation for status update
const statusValidation = [
    body('status')
        .isIn(['pending', 'confirmed', 'delivered', 'cancelled'])
        .withMessage('Invalid status'),
];

// Routes
router.get('/stats', getOrderStats);

router.route('/')
    .get(getOrders)
    .post(validate(orderValidation), createOrder);

// Public order endpoint
router.post('/public', validate(publicOrderValidation), createPublicOrder);

router.route('/:id')
    .get(getOrder)
    .put(updateOrder)
    .delete(deleteOrder);

router.patch('/:id/status', validate(statusValidation), updateOrderStatus);

export default router;
