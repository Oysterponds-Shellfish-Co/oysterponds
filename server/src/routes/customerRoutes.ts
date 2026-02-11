import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/index.js';
import {
    getCustomers,
    getCustomer,
    getCustomerBySlug,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerPricing,
} from '../controllers/index.js';

const router = Router();

// Validation rules for CREATE (only businessName required)
const createCustomerValidation = [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('name').optional().trim(),
    body('contactEmail')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage('Valid contact email is required'),
    body('accountingEmail')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Valid accounting email is required'),
    body('customPricing')
        .optional()
        .isArray()
        .withMessage('Custom pricing must be an array'),
    body('customPricing.*.product')
        .optional()
        .isMongoId()
        .withMessage('Invalid product ID in custom pricing'),
    body('customPricing.*.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
];

// Validation rules for UPDATE (all optional)
const updateCustomerValidation = [
    body('name').optional().trim().notEmpty().withMessage('Contact name cannot be empty'),
    body('businessName').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
    body('contactEmail')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Valid contact email is required'),
    body('accountingEmail')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Valid accounting email is required'),
    body('customPricing')
        .optional()
        .isArray()
        .withMessage('Custom pricing must be an array'),
    body('customPricing.*.product')
        .optional()
        .isMongoId()
        .withMessage('Invalid product ID in custom pricing'),
    body('customPricing.*.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
];

// Routes
router.route('/')
    .get(getCustomers)
    .post(validate(createCustomerValidation), createCustomer);

// Public route for customer portal
router.get('/slug/:slug', getCustomerBySlug);

router.route('/:id')
    .get(getCustomer)
    .put(validate(updateCustomerValidation), updateCustomer)
    .delete(deleteCustomer);

// Get customer pricing for order form
router.get('/:id/pricing', getCustomerPricing);

export default router;
