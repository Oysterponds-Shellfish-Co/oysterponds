import express from 'express';
import {
    getSalesSummary,
    getInvoiceSummary,
    getCustomerAnalytics,
    getProductAnalytics,
    getARAgingReport,
    exportInvoicesToExcel,
    getDashboardOverview
} from '../controllers/reportController.js';

const router = express.Router();

// Dashboard overview
router.get('/dashboard', getDashboardOverview);

// Sales reports
router.get('/sales-summary', getSalesSummary);

// Invoice reports
router.get('/invoice-summary', getInvoiceSummary);

// Customer analytics
router.get('/customer-analytics', getCustomerAnalytics);

// Product analytics
router.get('/product-analytics', getProductAnalytics);

// A/R aging report
router.get('/ar-aging', getARAgingReport);

// Excel exports
router.get('/export/invoices', exportInvoicesToExcel);

export default router;
