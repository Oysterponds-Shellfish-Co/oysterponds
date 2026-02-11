import { Request, Response } from 'express';
import { Customer, Product, Order } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/index.js';
import { ApiResponse } from '../types/index.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
export const getCustomers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const customers = await Customer.find()
        .populate('customPricing.product', 'name basePrice')
        .sort({ businessName: 1 });

    const response: ApiResponse = {
        success: true,
        data: customers,
    };

    res.status(200).json(response);
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
export const getCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customer = await Customer.findById(req.params.id)
        .populate('customPricing.product', 'name basePrice');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: customer,
    };

    res.status(200).json(response);
});

// @desc    Get customer by slug (for public order portal)
// @route   GET /api/customers/slug/:slug
// @access  Public
export const getCustomerBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customer = await Customer.findOne({ slug: req.params.slug })
        .populate('customPricing.product', 'name basePrice');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: customer,
    };

    res.status(200).json(response);
});

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
export const createCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
        name,
        businessName,
        slug,
        billingAddress,
        shippingAddress,
        contactEmail,
        accountingEmail,
        phone,
        customPricing,
        reminderEnabled,
        reminderDay,
        requiresShippingTag,
        notes,
    } = req.body;

    // If custom pricing is provided, validate product IDs exist
    if (customPricing && customPricing.length > 0) {
        const productIds = customPricing.map((cp: { product: string }) => cp.product);
        const existingProducts = await Product.find({ _id: { $in: productIds } });

        if (existingProducts.length !== productIds.length) {
            throw new AppError('One or more product IDs are invalid', 400);
        }
    }

    const customer = await Customer.create({
        name,
        businessName,
        slug,
        billingAddress,
        shippingAddress,
        contactEmail,
        accountingEmail,
        phone,
        customPricing,
        reminderEnabled,
        reminderDay,
        requiresShippingTag,
        notes,
    });

    const response: ApiResponse = {
        success: true,
        data: customer,
        message: 'Customer created successfully',
    };

    res.status(201).json(response);
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // If custom pricing is being updated, validate product IDs
    if (req.body.customPricing && req.body.customPricing.length > 0) {
        const productIds = req.body.customPricing.map((cp: { product: string }) => cp.product);
        const existingProducts = await Product.find({ _id: { $in: productIds } });

        if (existingProducts.length !== productIds.length) {
            throw new AppError('One or more product IDs are invalid', 400);
        }
    }

    const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate('customPricing.product', 'name basePrice');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: customer,
        message: 'Customer updated successfully',
    };

    res.status(200).json(response);
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
export const deleteCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // First check if customer exists
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Check if customer has any orders
    const orderCount = await Order.countDocuments({ customer: req.params.id });

    if (orderCount > 0) {
        throw new AppError(
            `Cannot delete customer. This customer has ${orderCount} order(s). Please delete or reassign the orders first.`,
            400
        );
    }

    // Safe to delete - no orders exist
    await Customer.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
        success: true,
        message: 'Customer deleted successfully',
    };

    res.status(200).json(response);
});

// @desc    Get customer pricing (for order form)
// @route   GET /api/customers/:id/pricing
// @access  Private
export const getCustomerPricing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const customer = await Customer.findById(req.params.id)
        .populate('customPricing.product', 'name basePrice unit');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Get all active products
    const allProducts = await Product.find({ active: true });

    // Build pricing map: customer price overrides base price
    const pricing = allProducts.map((product) => {
        const customPrice = customer.customPricing.find(
            (cp) => cp.product._id.toString() === product._id.toString()
        );

        return {
            productId: product._id,
            productName: product.name,
            unit: product.unit,
            basePrice: product.basePrice,
            price: customPrice ? customPrice.price : product.basePrice,
            hasCustomPrice: !!customPrice,
        };
    });

    const response: ApiResponse = {
        success: true,
        data: pricing,
    };

    res.status(200).json(response);
});
