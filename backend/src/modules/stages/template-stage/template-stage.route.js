import express from 'express';
const router = express.Router();
import templateStageController from './template-stage.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';

router.use(authToken);

router.get('/', templateStageController.getAll);
router.post('/', templateStageController.create);
router.get('/:id', templateStageController.getById);
router.put('/:id', templateStageController.update);
router.delete('/:id', templateStageController.delete);

router.post('/:id/stages', templateStageController.addStage);
router.put('/stages/:stageId', templateStageController.updateStage);
router.delete('/stages/:stageId', templateStageController.deleteStage);

export default router;
