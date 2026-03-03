import cookieService from "../../cookie/cookie.service.js"
import navigationRpa from "./rpa/navigation.rpa.js"
import loginRpa from "./rpa/login.rpa.js"
import jobPostRpa from "./rpa/job-post.rpa.js"
import extractCandidateRpa from "./rpa/extract-candidate.rpa.js"
import jobPostModel from "../../job-post/job-post.model.js"
import jobPostSeekModel from "./job-post-seek.model.js"
import browserPuppeteer from "../../../shared/services/puppeteer/browser.puppeteer.js"

class SeekService {
  async jobPost(user_id, account_id, service, dataForm) {
    const page = await cookieService.includeCookiesIfExist(account_id, service) // still hardcoded from req body (user_id, service);
    const account = await this.getAccountAndDecrypt(account_id);

    try {
      await loginRpa.fillLogin(page, account.email, account.decrypted);
      await jobPostRpa.fillFormJobPost(page, dataForm) // remember to incl the data, still hardcoded on the job post rpa
    } catch (err) {
      console.log(err)
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }

  async jobPostDraft(account_id, service, dataForm) {
    const jobPost = await jobPostModel.create(account_id, service, dataForm.job_title, dataForm.job_desc, dataForm.job_location, dataForm.work_option, dataForm.work_type);
    const jobPostSeek = await jobPostSeekModel.create(jobPost.id, dataForm.currency, dataForm.pay_type, dataForm.pay_min, dataForm.pay_max, dataForm.pay_display);
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      const { message, draftId } = await jobPostRpa.fillFormJobPostDraft(page, dataForm); // remember to incl the data, still hardcoded on the job post rpa
      const update = await jobPostModel.updateStatus(jobPost.id, "Draft" ); // change into failed in the db enum
      const updateSeek = await jobPostSeekModel.update(jobPost.id, { seek_id: draftId });
      if(message) {
        throw new Error(message);
      }
    
      return { jobPost: update, jobPostSeek: updateSeek };
    } catch (err) {
      const update = await jobPostModel.updateStatus(jobPost.id, "Expired"); // change into failed in the db enum
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }

  async deleteJobPostDraft(job_posting_id, account_id) {
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobPostingId(job_posting_id);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      await jobPostRpa.deleteJobPostDraft(page, jobPostSeek.seek_id);

      const deleteJobPost = await jobPostModel.delete(job_posting_id);

      return deleteJobPost;
    } catch (err) {
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }

  async updateJobPostDraft(job_posting_id, account_id, dataForm) {
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobPostingId(job_posting_id);
    const account = await this.getAccountAndDecrypt(account_id);

    try {
      await loginRpa.fillLogin(page, account.email, account.decrypted);
      const { message } = await jobPostRpa.updateJobPostDraft(page, jobPostSeek.seek_id, dataForm); // remember to incl the data, still hardcoded on the job post rpa

      if(message) {
        throw new Error(message);
      }

      const updated = await jobPostModel.update(job_posting_id, { job_title: dataForm.job_title, job_desc: dataForm.job_desc, job_location: dataForm.job_location, work_option: dataForm.work_option, work_type: dataForm.work_type });
      const seekUpdated = await jobPostSeekModel.update(job_posting_id, { currency: dataForm.currency, pay_type: dataForm.pay_type, pay_min: dataForm.pay_min, pay_max: dataForm.pay_max, pay_display: dataForm.pay_display });
      
      return { updatedJobPost: updated, updatedSeek: seekUpdated};
    } catch (err) {
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }
  async extractCandidates(account_id, application_id, candidate_type) {
    const page = await cookieService.includeCookiesIfExist(account_id);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      await extractCandidateRpa.navigateToCandidatePage(page, application_id);

      const buckets = await extractCandidateRpa.extractCandidateType(page, application_id);

      if (candidate_type) {
        const bucket = buckets.find(b => b.name === candidate_type);
        if (!bucket) {
          throw { status: 400, message: `Candidate type "${candidate_type}" not found` };
        }

        const seekRecord = await jobPostSeekModel.getBySeekId(String(application_id));
        const job_name = seekRecord?.job_title || application_id;

        await extractCandidateRpa.navigateToCandidateDetail(page, candidate_type);
        const candidates = await extractCandidateRpa.extractCandidates(page, bucket, account_id, application_id, job_name);

        return { buckets, candidates };
      }

      return { buckets, candidates: [] };
    } catch (err) {
      throw err;
    } finally {
      await browserPuppeteer.close();
    }
  }
}

export default new SeekService();
