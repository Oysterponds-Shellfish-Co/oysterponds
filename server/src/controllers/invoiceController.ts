import { Request, Response } from 'express';
import { Invoice, Order, Customer } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/index.js';
import { ApiResponse } from '../types/index.js';
import { generateInvoicePDF, generateShippingTagPDF } from '../services/pdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

// Counter for invoice numbers (starting from 16000 as per client request)
let invoiceCounter: number | null = null;

// Initialize invoice counter from database
const getNextInvoiceNumber = async (): Promise<string> => {
    if (invoiceCounter === null) {
        // Find the highest invoice number in the database
        const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
        if (lastInvoice) {
            const lastNum = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
            invoiceCounter = lastNum;
        } else {
            // Start from 16000 as per client request (first invoice will be 16000)
            invoiceCounter = 15999;
        }
    }
    invoiceCounter++;
    return `INV-${invoiceCounter.toString().padStart(5, '0')}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { customer, status, startDate, endDate, limit = 50, page = 1 } = req.query;

    const filter: Record<string, unknown> = {};

    if (customer) {
        filter.customer = customer;
    }

    if (status) {
        filter.status = status;
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            (filter.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
        }
        if (endDate) {
            (filter.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
        }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
        Invoice.find(filter)
            .populate('customer', 'businessName')
            .populate('order', 'orderNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Invoice.countDocuments(filter),
    ]);

    const response: ApiResponse = {
        success: true,
        data: {
            invoices,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        },
    };

    res.status(200).json(response);
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('customer')
        .populate('order');

    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: invoice,
    };

    res.status(200).json(response);
});

// @desc    Get invoice by order ID
// @route   GET /api/invoices/order/:orderId
// @access  Private
export const getInvoiceByOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoice = await Invoice.findOne({ order: req.params.orderId })
        .populate('customer')
        .populate('order');

    if (!invoice) {
        const response: ApiResponse = {
            success: true,
            data: null,
        };
        res.status(200).json(response);
        return;
    }

    const response: ApiResponse = {
        success: true,
        data: invoice,
    };

    res.status(200).json(response);
});

// @desc    Create invoice from order
// @route   POST /api/invoices
// @access  Private
export const createInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
        orderId,
        shippingDate,
        harvestDate,
        harvestTime,
        harvestLocation,
        departureTemperature,
        timeOnTruck,
        deliveredBy,
    } = req.body;

    // Validate required fields
    if (!orderId) {
        throw new AppError('Order ID is required', 400);
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
        throw new AppError('Invoice already exists for this order', 400);
    }

    // Get the order with all details
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Get customer details
    const customer = await Customer.findById(order.customer);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Generate invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
        invoiceNumber,
        order: orderId,
        customer: order.customer,
        customerName: customer.businessName,
        billTo: {
            businessName: customer.businessName,
            attention: customer.name || '',
            address: {
                street: customer.billingAddress?.street || '',
                city: customer.billingAddress?.city || '',
                state: customer.billingAddress?.state || 'NY',
                zip: customer.billingAddress?.zip || '',
            },
        },
        shippingDate: shippingDate || order.deliveryDate,
        harvestDate: harvestDate || new Date(),
        harvestTime: harvestTime || '',
        harvestLocation: harvestLocation || order.harvestLocation || '',
        shipperCertification: 'NY27496SS',
        departureTemperature: departureTemperature || '',
        timeOnTruck: timeOnTruck || '',
        deliveredBy: deliveredBy || '',
        items: order.items.map((item) => ({
            product: item.product,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            lineTotal: item.lineTotal,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        status: 'draft',
    });

    // Note: Order status is NOT automatically changed
    // User should mark order as "delivered" before generating invoice

    const response: ApiResponse = {
        success: true,
        data: invoice,
        message: `Invoice ${invoiceNumber} created successfully`,
    };

    res.status(201).json(response);
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    // Only allow updates to certain fields
    const allowedUpdates = [
        'shippingDate',
        'harvestDate',
        'harvestTime',
        'harvestLocation',
        'departureTemperature',
        'timeOnTruck',
        'deliveredBy',
        'status',
    ];

    const updates: Record<string, unknown> = {};
    Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    const updatedInvoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
    );

    const response: ApiResponse = {
        success: true,
        data: updatedInvoice,
        message: 'Invoice updated successfully',
    };

    res.status(200).json(response);
});

// @desc    Update invoice email status
// @route   PUT /api/invoices/:id/email-sent
// @access  Private
export const updateInvoiceEmailStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { emailsSentTo } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    invoice.emailSentAt = new Date();
    invoice.emailSentTo = emailsSentTo || [];
    invoice.status = 'sent';
    await invoice.save();

    const response: ApiResponse = {
        success: true,
        data: invoice,
        message: 'Invoice email status updated',
    };

    res.status(200).json(response);
});

// @desc    Mark invoice as paid
// @route   PUT /api/invoices/:id/mark-paid
// @access  Private
export const markInvoiceAsPaid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { checkNumber, paidAt } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    invoice.status = 'paid';
    invoice.paidAt = paidAt ? new Date(paidAt) : new Date();
    invoice.checkNumber = checkNumber || '';
    await invoice.save();

    const response: ApiResponse = {
        success: true,
        data: invoice,
        message: 'Invoice marked as paid',
    };

    res.status(200).json(response);
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    await Invoice.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
        success: true,
        message: 'Invoice deleted successfully',
    };

    res.status(200).json(response);
});

// @desc    Get company info for invoice
// @route   GET /api/invoices/company-info
// @access  Private
export const getCompanyInfo = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    // Company info as provided by client
    const companyInfo = {
        name: 'Oysterponds Shellfish Co.',
        address: 'PO Box 513, Orient, NY 11957',
        phone: '631.721.7117',
        website: 'www.oysterpondsshellfish.com',
        shipperCertification: 'NY27496SS',
        remittance: {
            payableTo: 'Oysterponds Shellfish Co.',
            mailingAddress: 'PO Box 513, Orient, NY 11957',
            achInquiries: 'phil@oysterpondsshellfish.com',
        },
        internalEmail: 'phil@oysterpondsshellfish.com',
        drivers: ['Phil', 'Brian', 'Remi'],
    };

    const response: ApiResponse = {
        success: true,
        data: companyInfo,
    };

    res.status(200).json(response);
});

// @desc    Generate and download PDF for invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
export const downloadInvoicePDF = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoice = await Invoice.findById(req.params.id).populate('order');

    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    // Get order number from populated order
    const orderNumber = typeof invoice.order === 'object' && invoice.order
        ? (invoice.order as { orderNumber?: string }).orderNumber || ''
        : '';

    // Always generate fresh PDF (on-the-go)
    const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: orderNumber,
        billTo: invoice.billTo,
        shippingDate: invoice.shippingDate,
        harvestDate: invoice.harvestDate,
        harvestTime: invoice.harvestTime,
        harvestLocation: invoice.harvestLocation,
        shipperCertification: invoice.shipperCertification,
        departureTemperature: invoice.departureTemperature,
        timeOnTruck: invoice.timeOnTruck,
        deliveredBy: invoice.deliveredBy,
        items: invoice.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            lineTotal: item.lineTotal,
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
});

// @desc    Send invoice via email
// @route   POST /api/invoices/:id/send-email
// @access  Private
export const sendInvoiceViaEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const invoice = await Invoice.findById(req.params.id).populate('customer').populate('order');

    if (!invoice) {
        throw new AppError('Invoice not found', 404);
    }

    // Get order number from populated order
    const orderNumber = typeof invoice.order === 'object' && invoice.order
        ? (invoice.order as { orderNumber?: string }).orderNumber || ''
        : '';

    // Get customer for email
    const customer = await Customer.findById(invoice.customer);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Determine recipient emails
    const recipientEmails: string[] = [];

    // Add accounting email first, fall back to contact email
    if (customer.accountingEmail) {
        recipientEmails.push(customer.accountingEmail);
    } else if (customer.contactEmail) {
        recipientEmails.push(customer.contactEmail);
    }

    // Add additional accounting email if present
    if (customer.additionalAccountingEmail) {
        recipientEmails.push(customer.additionalAccountingEmail);
    }

    if (recipientEmails.length === 0) {
        throw new AppError('No email address found for customer', 400);
    }

    // Always generate fresh PDF (on-the-go)
    const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        orderNumber: orderNumber,
        billTo: invoice.billTo,
        shippingDate: invoice.shippingDate,
        harvestDate: invoice.harvestDate,
        harvestTime: invoice.harvestTime,
        harvestLocation: invoice.harvestLocation,
        shipperCertification: invoice.shipperCertification,
        departureTemperature: invoice.departureTemperature,
        timeOnTruck: invoice.timeOnTruck,
        deliveredBy: invoice.deliveredBy,
        items: invoice.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            lineTotal: item.lineTotal,
        })),
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
    });

    // Generate shipping tag if customer requires it
    let shippingTagBuffer: Buffer | undefined;
    if (customer.requiresShippingTag) {
        shippingTagBuffer = await generateShippingTagPDF({
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            harvestDate: invoice.harvestDate,
            harvestTime: invoice.harvestTime,
            harvestLocation: invoice.harvestLocation,
            shipperCertification: invoice.shipperCertification,
            departureTemperature: invoice.departureTemperature,
            items: invoice.items.map((item) => ({
                productName: item.productName,
                quantity: item.quantity,
            })),
        });
    }

    // Send email (with optional shipping tag)
    const emailResult = await sendInvoiceEmail(
        recipientEmails,
        {
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customerName,
            total: invoice.total,
            shippingDate: invoice.shippingDate,
        },
        pdfBuffer,
        shippingTagBuffer
    );

    if (!emailResult.success) {
        throw new AppError(emailResult.error || 'Failed to send email', 500);
    }

    // Update invoice status
    invoice.emailSentAt = new Date();
    invoice.emailSentTo = emailResult.sentTo;
    invoice.status = 'sent';
    await invoice.save();

    const response: ApiResponse = {
        success: true,
        data: {
            sentTo: emailResult.sentTo,
            sentAt: invoice.emailSentAt,
        },
        message: `Invoice emailed successfully to ${emailResult.sentTo.join(', ')}`,
    };

    res.status(200).json(response);
});
