import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/index.js';
import {
    getHarvestLocations,
    getHarvestLocation,
    createHarvestLocation,
    updateHarvestLocation,
} from '../controllers/index.js';

const router = Router();

// Validation rules
const locationValidation = [
    body('code').trim().notEmpty().withMessage('Location code is required'),
    body('name').trim().notEmpty().withMessage('Location name is required'),
];

// Routes
router.route('/')
    .get(getHarvestLocations)
    .post(validate(locationValidation), createHarvestLocation);

router.route('/:id')
    .get(getHarvestLocation)
    .put(validate(locationValidation), updateHarvestLocation);

export default router;
