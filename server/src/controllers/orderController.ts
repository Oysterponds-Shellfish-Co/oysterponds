import { Request, Response } from 'express';
import { Order, Customer, Product } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/index.js';
import { ApiResponse } from '../types/index.js';

// Interface for order items in request
interface OrderItemRequest {
    product: string;
    quantity: number;
    pricePerUnit: number;
}

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { customer, status, startDate, endDate, limit = 50, page = 1 } = req.query;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (customer) {
        filter.customer = customer;
    }

    if (status) {
        filter.status = status;
    }

    if (startDate || endDate) {
        filter.deliveryDate = {};
        if (startDate) {
            (filter.deliveryDate as Record<string, Date>).$gte = new Date(startDate as string);
        }
        if (endDate) {
            (filter.deliveryDate as Record<string, Date>).$lte = new Date(endDate as string);
        }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('customer', 'businessName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Order.countDocuments(filter),
    ]);

    const response: ApiResponse = {
        success: true,
        data: {
            orders,
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'businessName contactEmail accountingEmail phone billingAddress');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: order,
    };

    res.status(200).json(response);
});

// @desc    Create order (internal)
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { customer: customerId, items, deliveryDate, notes, orderSource = 'internal' } = req.body;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Validate and process items
    if (!items || items.length === 0) {
        throw new AppError('Order must have at least one item', 400);
    }

    const processedItems = await Promise.all(
        items.map(async (item: OrderItemRequest) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new AppError(`Product not found: ${item.product}`, 404);
            }

            const lineTotal = item.quantity * item.pricePerUnit;

            return {
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                lineTotal,
            };
        })
    );

    // Generate order number
    const orderNumber = await Order.getNextOrderNumber();

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = 0; // No tax for now
    const total = subtotal + tax;

    const order = await Order.create({
        orderNumber,
        customer: customerId,
        customerName: customer.businessName,
        harvestLocation: req.body.harvestLocation || '',
        items: processedItems,
        subtotal,
        tax,
        total,
        deliveryDate: new Date(deliveryDate),
        notes,
        orderSource,
    });

    const response: ApiResponse = {
        success: true,
        data: order,
        message: `Order #${orderNumber} created successfully`,
    };

    res.status(201).json(response);
});

// @desc    Create order from customer portal
// @route   POST /api/orders/public
// @access  Public
export const createPublicOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { customerSlug, items, deliveryDate, notes } = req.body;

    // Find customer by slug
    const customer = await Customer.findOne({ slug: customerSlug })
        .populate('customPricing.product', 'name basePrice');

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Validate and process items using customer's pricing
    if (!items || items.length === 0) {
        throw new AppError('Order must have at least one item', 400);
    }

    const processedItems = await Promise.all(
        items.map(async (item: { product: string; quantity: number }) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new AppError(`Product not found: ${item.product}`, 404);
            }

            // Get customer's custom price or use base price
            const customPricing = customer.customPricing.find(
                (cp) => cp.product._id.toString() === product._id.toString()
            );
            const pricePerUnit = customPricing ? customPricing.price : product.basePrice;
            const lineTotal = item.quantity * pricePerUnit;

            return {
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                pricePerUnit,
                lineTotal,
            };
        })
    );

    // Generate order number
    const orderNumber = await Order.getNextOrderNumber();

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = 0; // No tax for now
    const total = subtotal + tax;

    const order = await Order.create({
        orderNumber,
        customer: customer._id,
        customerName: customer.businessName,
        harvestLocation: req.body.harvestLocation || '',
        items: processedItems,
        subtotal,
        tax,
        total,
        deliveryDate: new Date(deliveryDate),
        notes,
        orderSource: 'customer-portal',
    });

    const response: ApiResponse = {
        success: true,
        data: order,
        message: `Order #${orderNumber} submitted successfully`,
    };

    res.status(201).json(response);
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
export const updateOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const { items, customer, deliveryDate, ...otherUpdates } = req.body;

    // If customer is changing, update customer info
    if (customer && customer.toString() !== order.customer.toString()) {
        const customerDoc = await Customer.findById(customer);
        if (!customerDoc) throw new AppError('Customer not found', 404);
        order.customer = customer;
        order.customerName = customerDoc.businessName;
    }

    // Process items if they are changing
    if (items) {
        if (items.length === 0) {
            throw new AppError('Order must have at least one item', 400);
        }

        const processedItems = await Promise.all(
            items.map(async (item: any) => {
                const product = await Product.findById(item.product);
                if (!product) {
                    throw new AppError(`Product not found: ${item.product}`, 404);
                }

                const pricePerUnit = item.pricePerUnit !== undefined ? item.pricePerUnit : product.basePrice;
                const lineTotal = item.quantity * pricePerUnit;

                return {
                    product: product._id,
                    productName: product.name,
                    quantity: item.quantity,
                    pricePerUnit,
                    lineTotal,
                };
            })
        );
        order.items = processedItems as any;
    }

    if (deliveryDate) {
        order.deliveryDate = new Date(deliveryDate);
    }

    // Apply other updates like notes, harvestLocation, etc.
    Object.assign(order, otherUpdates);

    await order.save(); // Triggers pre-save hook for totals

    const response: ApiResponse = {
        success: true,
        data: order,
        message: 'Order updated successfully',
    };

    res.status(200).json(response);
});

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
        throw new AppError('Invalid status', 400);
    }

    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    );

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: order,
        message: `Order status updated to ${status}`,
    };

    res.status(200).json(response);
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
export const deleteOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // UPDATED: Allow deleting any order to make mistakes reversible
    await Order.findByIdAndDelete(req.params.id);

    const response: ApiResponse = {
        success: true,
        message: 'Order deleted successfully',
    };

    res.status(200).json(response);
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        totalOrders,
        pendingOrders,
        todayOrders,
        weeklyTotal,
    ] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ createdAt: { $gte: today } }),
        Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    const response: ApiResponse = {
        success: true,
        data: {
            totalOrders,
            pendingOrders,
            todayOrders,
            weeklyTotal: weeklyTotal[0]?.total || 0,
            weeklyCount: weeklyTotal[0]?.count || 0,
        },
    };

    res.status(200).json(response);
});
