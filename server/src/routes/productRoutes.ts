import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/index.js';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/index.js';

const router = Router();

// Validation rules
const productValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('basePrice')
        .isFloat({ min: 0 })
        .withMessage('Base price must be a positive number'),
    body('unit')
        .optional()
        .isIn(['oyster', 'dozen', 'piece', 'pound'])
        .withMessage('Invalid unit'),
];

// Routes
router.route('/')
    .get(getProducts)
    .post(validate(productValidation), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(validate(productValidation), updateProduct)
    .delete(deleteProduct);

export default router;
