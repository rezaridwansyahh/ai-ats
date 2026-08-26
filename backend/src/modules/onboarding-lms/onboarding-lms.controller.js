import OnboardingLmsService from './onboarding-lms.service.js';

class OnboardingLmsController {
  async getPhases(req, res) {
    try {
      const company_id = req.user.company_id;
      const phases = await OnboardingLmsService.getPhases(company_id);
      res.json({ success: true, data: phases });
    } catch (error) {
      console.error('Error in getPhases:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to get phases' });
    }
  }

  async createPhase(req, res) {
    try {
      const company_id = req.user.company_id;
      const phase = await OnboardingLmsService.createPhase(company_id, req.body);
      res.status(201).json({ success: true, data: phase, message: 'Phase created' });
    } catch (error) {
      console.error('Error in createPhase:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to create phase' });
    }
  }

  async updatePhase(req, res) {
    try {
      const { phase_id } = req.params;
      const company_id = req.user.company_id;
      const phase = await OnboardingLmsService.updatePhase(phase_id, company_id, req.body);
      res.json({ success: true, data: phase, message: 'Phase updated' });
    } catch (error) {
      console.error('Error in updatePhase:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update phase' });
    }
  }

  async getModulesByPhase(req, res) {
    try {
      const { phase_id } = req.params;
      const company_id = req.user.company_id;
      const modules = await OnboardingLmsService.getModulesByPhase(phase_id, company_id);
      res.json({ success: true, data: modules });
    } catch (error) {
      console.error('Error in getModulesByPhase:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to get modules' });
    }
  }

  async getModuleById(req, res) {
    try {
      const { module_id } = req.params;
      const company_id = req.user.company_id;
      const module = await OnboardingLmsService.getModuleById(module_id, company_id);
      res.json({ success: true, data: module });
    } catch (error) {
      console.error('Error in getModuleById:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to get module' });
    }
  }

  async createModule(req, res) {
    try {
      const { phase_id } = req.params;
      const company_id = req.user.company_id;
      const created_by = req.user.id;
      const module = await OnboardingLmsService.createModule(phase_id, company_id, created_by, req.body);
      res.status(201).json({ success: true, data: module, message: 'Module created' });
    } catch (error) {
      console.error('Error in createModule:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to create module' });
    }
  }

  async updateModule(req, res) {
    try {
      const { module_id } = req.params;
      const module = await OnboardingLmsService.updateModule(module_id, req.body);
      res.json({ success: true, data: module, message: 'Module updated' });
    } catch (error) {
      console.error('Error in updateModule:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update module' });
    }
  }

  async getContent(req, res) {
    try {
      const { module_id } = req.params;
      const items = await OnboardingLmsService.getContent(module_id);
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Error in getContent:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to get content' });
    }
  }

  async createContent(req, res) {
    try {
      const { module_id } = req.params;
      const item = await OnboardingLmsService.createContent(module_id, req.body);
      res.status(201).json({ success: true, data: item, message: 'Content item created' });
    } catch (error) {
      console.error('Error in createContent:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to create content item' });
    }
  }

  async uploadContent(req, res) {
    try {
      const { module_id } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const item = await OnboardingLmsService.createContentFromUpload(module_id, req.file, req.body);
      res.status(201).json({ success: true, data: item, message: 'Content item uploaded' });
    } catch (error) {
      console.error('Error in uploadContent:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to upload content item' });
    }
  }

  async updateContent(req, res) {
    try {
      const { content_id } = req.params;
      const item = await OnboardingLmsService.updateContent(content_id, req.body);
      res.json({ success: true, data: item, message: 'Content item updated' });
    } catch (error) {
      console.error('Error in updateContent:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update content item' });
    }
  }

  async getHireCurriculum(req, res) {
    try {
      const { candidate_onboarding_id } = req.params;
      const company_id = req.user.company_id;
      const curriculum = await OnboardingLmsService.getHireCurriculum(candidate_onboarding_id, company_id);
      res.json({ success: true, data: curriculum });
    } catch (error) {
      console.error('Error in getHireCurriculum:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to get curriculum' });
    }
  }

  async updateHireProgress(req, res) {
    try {
      const { candidate_onboarding_id, module_id } = req.params;
      const progress = await OnboardingLmsService.updateHireProgress(candidate_onboarding_id, module_id, req.body);
      res.json({ success: true, data: progress, message: 'Progress updated' });
    } catch (error) {
      console.error('Error in updateHireProgress:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Failed to update progress' });
    }
  }
}

export default new OnboardingLmsController();