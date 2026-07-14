import express from 'express';
import OnboardingController from './onboarding.controller.js';
import authToken from '../../shared/middleware/auth.middleware.js';
import checkPermission from '../../shared/middleware/role.middleware.js';

const router = express.Router();

// GET /api/onboarding/workboard - Get all onboarding records (workboard)
router.get(
  '/workboard',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'read'),
  OnboardingController.getWorkboard
);

// GET /api/onboarding/job/:job_id - Get onboarding by job
router.get(
  '/job/:job_id',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'read'),
  OnboardingController.getByJob
);

// GET /api/onboarding/:onboarding_id - Get full onboarding detail
router.get(
  '/:onboarding_id',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'read'),
  OnboardingController.getOnboardingDetail
);

// POST /api/onboarding/create - Create new onboarding
router.post(
  '/create',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'create'),
  OnboardingController.createOnboarding
);

// PUT /api/onboarding/:onboarding_id/checklist/:item_id - Update checklist item
router.put(
  '/:onboarding_id/checklist/:item_id',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'update'),
  OnboardingController.updateChecklistItem
);

// PUT /api/onboarding/:onboarding_id/milestone/:milestone_id - Update milestone
router.put(
  '/:onboarding_id/milestone/:milestone_id',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'update'),
  OnboardingController.updateMilestone
);

// PUT /api/onboarding/:onboarding_id/probation/:checkin_id - Update probation check-in
router.put(
  '/:onboarding_id/probation/:checkin_id',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'update'),
  OnboardingController.updateProbationCheckin
);

// POST /api/onboarding/:onboarding_id/welcome - Add/update welcome message
router.post(
  '/:onboarding_id/welcome',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'update'),
  OnboardingController.setWelcomeMessage
);

// PUT /api/onboarding/:onboarding_id/advance - Advance to next stage
router.put(
  '/:onboarding_id/advance',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'update'),
  OnboardingController.advanceStage
);

// POST /api/onboarding/:onboarding_id/confirm - Confirm employee (complete probation)
router.post(
  '/:onboarding_id/confirm',
  authToken,
  checkPermission('Offer & Onboard', 'Onboarding', 'update'),
  OnboardingController.confirmEmployee
);

export default router;
