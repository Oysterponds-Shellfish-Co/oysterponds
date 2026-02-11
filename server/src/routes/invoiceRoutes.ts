import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/index.js';
import {
    getInvoices,
    getInvoice,
    getInvoiceByOrder,
    createInvoice,
    updateInvoice,
    updateInvoiceEmailStatus,
    markInvoiceAsPaid,
    deleteInvoice,
    getCompanyInfo,
    downloadInvoicePDF,
    sendInvoiceViaEmail,
} from '../controllers/invoiceController.js';

const router = Router();

// Validation rules for creating invoice
const createInvoiceValidation = [
    body('orderId').isMongoId().withMessage('Valid order ID is required'),
    body('harvestDate').optional().isISO8601().withMessage('Valid harvest date is required'),
    body('harvestTime').optional().isString().withMessage('Harvest time must be a string'),
    body('departureTemperature').optional().isString().withMessage('Temperature must be a string'),
    body('timeOnTruck').optional().isString().withMessage('Time on truck must be a string'),
    body('deliveredBy').optional().isString().withMessage('Delivered by must be a string'),
];

// Validation rules for updating invoice
const updateInvoiceValidation = [
    body('harvestDate').optional().isISO8601().withMessage('Valid harvest date is required'),
    body('harvestTime').optional().isString(),
    body('departureTemperature').optional().isString(),
    body('timeOnTruck').optional().isString(),
    body('deliveredBy').optional().isString(),
    body('status').optional().isIn(['draft', 'sent', 'paid']).withMessage('Invalid status'),
];

// Routes
router.get('/company-info', getCompanyInfo);

router.route('/')
    .get(getInvoices)
    .post(validate(createInvoiceValidation), createInvoice);

router.get('/order/:orderId', getInvoiceByOrder);

router.route('/:id')
    .get(getInvoice)
    .put(validate(updateInvoiceValidation), updateInvoice)
    .delete(deleteInvoice);

// PDF and Email routes
router.get('/:id/pdf', downloadInvoicePDF);
router.post('/:id/send-email', sendInvoiceViaEmail);
router.put('/:id/email-sent', updateInvoiceEmailStatus);
router.put('/:id/mark-paid', markInvoiceAsPaid);

export default router;
