import OnboardingService from './onboarding.service.js';

class OnboardingController {
  // GET /api/onboarding/:onboarding_id - Get full onboarding detail
  async getOnboardingDetail(req, res) {
    try {
      const { onboarding_id } = req.params;
      const company_id = req.user.company_id;

      const onboarding = await OnboardingService.getOnboardingDetail(onboarding_id, company_id);

      res.json({
        success: true,
        data: onboarding
      });
    } catch (error) {
      console.error('Error in getOnboardingDetail:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to get onboarding detail'
      });
    }
  }

  // GET /api/onboarding/workboard - Get all onboarding records (workboard)
  async getWorkboard(req, res) {
    try {
      const company_id = req.user.company_id;

      const records = await OnboardingService.getWorkboard(company_id);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      console.error('Error in getWorkboard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get onboarding workboard'
      });
    }
  }

  // GET /api/onboarding/job/:job_id - Get onboarding by job
  async getByJob(req, res) {
    try {
      const { job_id } = req.params;
      const company_id = req.user.company_id;

      const records = await OnboardingService.getByJob(job_id, company_id);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      console.error('Error in getByJob:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get onboarding by job'
      });
    }
  }

  // POST /api/onboarding/create - Create new onboarding
  async createOnboarding(req, res) {
    try {
      const company_id = req.user.company_id;
      const data = { ...req.body, company_id };

      const onboarding = await OnboardingService.createOnboarding(data);

      res.status(201).json({
        success: true,
        data: onboarding,
        message: 'Onboarding created successfully'
      });
    } catch (error) {
      console.error('Error in createOnboarding:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to create onboarding'
      });
    }
  }

  // PUT /api/onboarding/:onboarding_id/checklist/:item_id - Update checklist item
  async updateChecklistItem(req, res) {
    try {
      const { item_id } = req.params;
      const data = req.body;

      const updated = await OnboardingService.updateChecklistItem(item_id, data);

      res.json({
        success: true,
        data: updated,
        message: 'Checklist item updated'
      });
    } catch (error) {
      console.error('Error in updateChecklistItem:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update checklist item'
      });
    }
  }

  // PUT /api/onboarding/:onboarding_id/milestone/:milestone_id - Update milestone
  async updateMilestone(req, res) {
    try {
      const { milestone_id } = req.params;
      const data = req.body;

      const updated = await OnboardingService.updateMilestone(milestone_id, data);

      res.json({
        success: true,
        data: updated,
        message: 'Milestone updated'
      });
    } catch (error) {
      console.error('Error in updateMilestone:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update milestone'
      });
    }
  }

  // PUT /api/onboarding/:onboarding_id/probation/:checkin_id - Update probation check-in
  async updateProbationCheckin(req, res) {
    try {
      const { checkin_id } = req.params;
      const data = req.body;

      const updated = await OnboardingService.updateProbationCheckin(checkin_id, data);

      res.json({
        success: true,
        data: updated,
        message: 'Probation check-in updated'
      });
    } catch (error) {
      console.error('Error in updateProbationCheckin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update probation check-in'
      });
    }
  }

  // POST /api/onboarding/:onboarding_id/welcome - Add/update welcome message
  async setWelcomeMessage(req, res) {
    try {
      const { onboarding_id } = req.params;
      const data = req.body;

      const message = await OnboardingService.setWelcomeMessage(onboarding_id, data);

      res.json({
        success: true,
        data: message,
        message: 'Welcome message saved'
      });
    } catch (error) {
      console.error('Error in setWelcomeMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to save welcome message'
      });
    }
  }

  // PUT /api/onboarding/:onboarding_id/advance - Advance to next stage
  async advanceStage(req, res) {
    try {
      const { onboarding_id } = req.params;
      const { new_stage } = req.body;
      const company_id = req.user.company_id;

      const updated = await OnboardingService.advanceStage(onboarding_id, company_id, new_stage);

      res.json({
        success: true,
        data: updated,
        message: `Advanced to ${new_stage}`
      });
    } catch (error) {
      console.error('Error in advanceStage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to advance stage'
      });
    }
  }

  // POST /api/onboarding/:onboarding_id/confirm - Confirm employee (complete probation)
  async confirmEmployee(req, res) {
    try {
      const { onboarding_id } = req.params;
      const company_id = req.user.company_id;

      const updated = await OnboardingService.confirmEmployee(onboarding_id, company_id);

      res.json({
        success: true,
        data: updated,
        message: 'Employee confirmed'
      });
    } catch (error) {
      console.error('Error in confirmEmployee:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to confirm employee'
      });
    }
  }
}

export default new OnboardingController();
