import interviewService from './interview.service.js';

function ctxFromReq(req) {
  return {
    company_id: req.user?.company_id ?? null,
    user_id:    req.user?.user_id    ?? null,
  };
}

class InterviewController {
  async getWorkboard(req, res) {
    try {
      const company_id = req.user?.company_id;
      if (!company_id) return res.status(400).json({ message: 'No company_id on token' });
      const data = await interviewService.getWorkboard(company_id);
      res.status(200).json({ message: 'Workboard fetched', ...data });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getInterview(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const result = await interviewService.getInterview(interview_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Interview detail', interview: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getInterviewByCandidateId(req, res) {
    try {
      const candidate_id = Number(req.params.candidate_id);
      const result = await interviewService.getInterviewByCandidateId(candidate_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Interview detail', interview: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getInterviewsByJob(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const rows = await interviewService.getInterviewsByJob(job_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Interviews fetched', interviews: rows });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const { status } = req.body || {};
      const result = await interviewService.updateStatus(interview_id, {
        status,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Interview status updated', interview: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getSchedules(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const schedules = await interviewService.getSchedules(interview_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Schedules fetched', schedules });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async createSchedule(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const { title, description, scheduled_at } = req.body || {};
      const result = await interviewService.createSchedule(interview_id, {
        title,
        description,
        scheduled_at,
        company_id: req.user?.company_id || null,
        created_by: req.user?.user_id    || null,
      });
      res.status(201).json({ message: 'Schedule created', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateSchedule(req, res) {
    try {
      const schedule_id = Number(req.params.schedule_id);
      const { title, description, scheduled_at } = req.body || {};
      const result = await interviewService.updateSchedule(
        schedule_id,
        { title, description, scheduled_at },
        { company_id: req.user?.company_id || null }
      );
      res.status(200).json({ message: 'Schedule updated', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async confirmSchedule(req, res) {
    try {
      const schedule_id = Number(req.params.schedule_id);
      const { confirmation_note } = req.body || {};
      const result = await interviewService.confirmSchedule(schedule_id, {
        confirmed_by:      req.user?.user_id    || null,
        confirmation_note: confirmation_note    || null,
        company_id:        req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Schedule confirmed', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async unconfirmSchedule(req, res) {
    try {
      const schedule_id = Number(req.params.schedule_id);
      const result = await interviewService.unconfirmSchedule(schedule_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Schedule unconfirmed', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const schedule_id = Number(req.params.schedule_id);
      const result = await interviewService.deleteSchedule(schedule_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Schedule deleted', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getPrep(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const result = await interviewService.getPrep(job_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Prep fetched', prep: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async generateQuestions(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { num_questions, language } = req.body || {};
      const result = await interviewService.generateQuestions(
        job_id,
        {
          num_questions,
          language,
          company_id: req.user?.company_id || null,
        },
        ctxFromReq(req)
      );
      res.status(200).json({ message: 'Questions generated', prep: result });
    } catch (err) {
      if (err.status === 402) {
        return res.status(402).json({ message: err.message, budget: err.budget, spent: err.spent });
      }
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateQuestions(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { questions } = req.body || {};
      const result = await interviewService.updateQuestions(
        job_id,
        questions,
        { company_id: req.user?.company_id || null }
      );
      res.status(200).json({ message: 'Questions updated', prep: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async recordOutcome(req, res) {
    try {
      const schedule_id = Number(req.params.schedule_id);
      const { status, outcome_note } = req.body || {};
      const result = await interviewService.recordOutcome(schedule_id, {
        status,
        outcome_note,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Outcome recorded', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async clearOutcome(req, res) {
    try {
      const schedule_id = Number(req.params.schedule_id);
      const result = await interviewService.clearOutcome(schedule_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Outcome cleared', schedule: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }  

  async getScorecard(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const result = await interviewService.getScorecard(interview_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Scorecard fetched', scorecard: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async saveScorecard(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const {
        competency_scores, competency_comments,
        recommendation, standout_strengths, concerns,
        is_draft,
      } = req.body || {};
      const result = await interviewService.saveScorecard(interview_id, {
        competency_scores,
        competency_comments,
        recommendation,
        standout_strengths,
        concerns,
        is_draft:     is_draft !== false, // default true
        company_id:   req.user?.company_id || null,
        submitted_by: req.user?.user_id    || null,
      });
      res.status(200).json({ message: 'Scorecard saved', scorecard: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async deleteScorecard(req, res) {
    try {
      const interview_id = Number(req.params.interview_id);
      const result = await interviewService.deleteScorecard(interview_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Scorecard deleted', scorecard: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }  

  async getDecideByJob(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const result = await interviewService.getDecideByJob(job_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Decide data fetched', candidates: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async bulkDecide(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { decisions } = req.body || {};
      const result = await interviewService.bulkDecide(job_id, {
        decisions,
        company_id: req.user?.company_id || null,
        decided_by: req.user?.user_id    || null,
      });
      res.status(200).json({ message: 'Decisions committed', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async resetDecision(req, res) {
    try {
      const job_id               = Number(req.params.job_id);
      const candidateInterviewId = Number(req.params.interview_id);
      const result = await interviewService.resetDecision(job_id, candidateInterviewId, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Decision reset', interview: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }  


  async updateRubric(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const { rubric_items } = req.body || {};
      const result = await interviewService.updateRubric(
        job_id,
        rubric_items,
        { company_id: req.user?.company_id || null }
      );
      res.status(200).json({ message: 'Rubric updated', prep: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async lockRubric(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const result = await interviewService.lockRubric(job_id, {
        locked_by:  req.user?.user_id    || null,
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Rubric locked', prep: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async unlockRubric(req, res) {
    try {
      const job_id = Number(req.params.job_id);
      const result = await interviewService.unlockRubric(job_id, {
        company_id: req.user?.company_id || null,
      });
      res.status(200).json({ message: 'Rubric unlocked', prep: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new InterviewController();