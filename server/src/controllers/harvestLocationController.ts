import { Request, Response } from 'express';
import { HarvestLocation } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/index.js';
import { ApiResponse } from '../types/index.js';

// @desc    Get all harvest locations
// @route   GET /api/harvest-locations
// @access  Public
export const getHarvestLocations = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const locations = await HarvestLocation.find({ active: true }).sort({ code: 1 });

    const response: ApiResponse = {
        success: true,
        data: locations,
    };

    res.status(200).json(response);
});

// @desc    Get single harvest location
// @route   GET /api/harvest-locations/:id
// @access  Public
export const getHarvestLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const location = await HarvestLocation.findById(req.params.id);

    if (!location) {
        throw new AppError('Harvest location not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: location,
    };

    res.status(200).json(response);
});

// @desc    Create harvest location
// @route   POST /api/harvest-locations
// @access  Private
export const createHarvestLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code, name } = req.body;

    const location = await HarvestLocation.create({ code, name });

    const response: ApiResponse = {
        success: true,
        data: location,
        message: 'Harvest location created successfully',
    };

    res.status(201).json(response);
});

// @desc    Update harvest location
// @route   PUT /api/harvest-locations/:id
// @access  Private
export const updateHarvestLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const location = await HarvestLocation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!location) {
        throw new AppError('Harvest location not found', 404);
    }

    const response: ApiResponse = {
        success: true,
        data: location,
        message: 'Harvest location updated successfully',
    };

    res.status(200).json(response);
});
