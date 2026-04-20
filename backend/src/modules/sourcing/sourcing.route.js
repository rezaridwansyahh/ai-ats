import express from 'express';
const router = express.Router();

import sourcingController from './sourcing.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

// Sourcing
router.get('/', sourcingController.getAll);
router.post('/search', sourcingController.search);
router.get('/:id', sourcingController.getById);
router.post('/', sourcingController.create);
router.put('/:id', sourcingController.update);
router.delete('/:id', sourcingController.delete);

// Sourcing Recruite (nested)
router.get('/:sourcingId/recruite', sourcingController.getRecruits);
router.get('/:sourcingId/recruite/:id', sourcingController.getRecruitById);
router.post('/:sourcingId/recruite', sourcingController.createRecruit);
router.put('/:sourcingId/recruite/:id', sourcingController.updateRecruit);
router.delete('/:sourcingId/recruite/:id', sourcingController.deleteRecruit);

export default router;