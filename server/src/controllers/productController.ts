import { Request, Response } from 'express';
import { Product } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/index.js';
import { ApiResponse } from '../types/index.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const products = await Product.find({ active: true }).sort({ name: 1 });

    const response: ApiResponse = {
        success: true,
        data: products,
    };

    res.status(200).json(response);
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: product,
    };

    res.status(200).json(response);
});

// @desc    Create product
// @route   POST /api/products
// @access  Private
export const createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, description, basePrice, unit } = req.body;

    const product = await Product.create({
        name,
        description,
        basePrice,
        unit,
    });

    const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product created successfully',
    };

    res.status(201).json(response);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: product,
        message: 'Product updated successfully',
    };

    res.status(200).json(response);
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    );

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        message: 'Product deleted successfully',
    };

    res.status(200).json(response);
});
