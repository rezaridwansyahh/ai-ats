import cookieService from "../../cookie/cookie.service.js"
import loginRpa from "./rpa/login.rpa.js"
import jobPostRpa from "./rpa/job-post.rpa.js"
import extractCandidateRpa from "./rpa/extract-candidate.rpa.js"
import jobPostModel from "../../job-post/job-post.model.js"
import jobPostSeekModel from "./job-post-seek.model.js"
import browserPuppeteer from "../../../shared/services/puppeteer/browser.puppeteer.js"
import extractJobPostRpa from "../seek/rpa/extract-job-post.rpa.js"
import candidateModel from "../../candidate/candidate.model.js"

class SeekService {
  async jobPost(account_id, service, dataForm) {
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

  async jobPostDraft(account_id, service, job_id, dataForm) {
    const jobPost = await jobPostModel.create(account_id, job_id, service, dataForm.job_title);
    const jobPostSeek = await jobPostSeekModel.create(jobPost.id, {
      currency: dataForm.currency,
      pay_type: dataForm.pay_type,
      pay_min: dataForm.pay_min,
      pay_max: dataForm.pay_max,
      pay_display: dataForm.pay_display,
    });
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
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(job_posting_id);

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
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(job_posting_id);
    const account = await this.getAccountAndDecrypt(account_id);

    try {
      await loginRpa.fillLogin(page, account.email, account.decrypted);
      const { message } = await jobPostRpa.updateJobPostDraft(page, jobPostSeek.seek_id, dataForm); // remember to incl the data, still hardcoded on the job post rpa

      if(message) {
        throw new Error(message);
      }

      const updated = await jobPostModel.update(job_posting_id, { job_title: dataForm.job_title });
      const seekUpdated = await jobPostSeekModel.update(job_posting_id, { currency: dataForm.currency, pay_type: dataForm.pay_type, pay_min: dataForm.pay_min, pay_max: dataForm.pay_max, pay_display: dataForm.pay_display });
      
      return { updatedJobPost: updated, updatedSeek: seekUpdated};
    } catch (err) {
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }
  async extractCandidates(account_id, job_posting_id) {
    const page = await cookieService.includeCookiesIfExist(account_id);
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(job_posting_id);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      await extractCandidateRpa.navigateToCandidatePage(page, jobPostSeek.seek_id);

      const buckets = await extractCandidateRpa.extractCandidateType(page, jobPostSeek.seek_id);
      const seekRecord = await jobPostSeekModel.getBySeekId(jobPostSeek.seek_id);
      const job_name = seekRecord?.job_title || jobPostSeek.seek_id;

      const results = [];

      for (const bucket of buckets) {
        if (bucket.count === 0) {
          results.push({ bucket: bucket.name, saved: 0 });
          continue;
        }

        await extractCandidateRpa.navigateToCandidateDetail(page, bucket.name);
        const candidates = await extractCandidateRpa.extractCandidates(page, bucket, account_id, jobPostSeek.seek_id, job_name);

        for (const candidate of candidates) {
          if (!candidate.candidate_id) continue;

          await candidateModel.upsert({
            job_posting_id,
            candidate_status: bucket.name,
            candidate_id: parseInt(candidate.candidate_id),
            name: candidate.name,
            last_position: candidate.last_position,
            address: candidate.address,
            education: candidate.education || null,
            information: candidate.information || null,
            date: candidate.date || null,
            attachment: candidate.attachment || null,
          });
        }

        results.push({ bucket: bucket.name, saved: candidates.length });
      }

      return { buckets, results };
    } catch (err) {
      throw err;
    } finally {
      await browserPuppeteer.close();
    }
  }

  async syncJobPostAll(account_id) {
    const types = ['open', 'expired', 'draft']; // 
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      const result = []
      for(let i = 0; i < types.length; i++) {
        const extracted = await extractJobPostRpa.syncAll(page, types[i]);
        
        console.log('Upserting to database');
        for(const data of extracted) {
          // Check if this seek_id already exists
          const existing = data.seek_id ? await jobPostSeekModel.getBySeekId(data.seek_id) : null;

          if (existing) {
            // Update existing records
            await jobPostModel.update(existing.job_posting_id, {
              job_title: data.job_title,
              status: data.status,
              additional: data.additional,
            });
            await jobPostSeekModel.update(existing.job_posting_id, {
              currency: data.currency,
              pay_type: data.pay_type,
              pay_min: data.pay_min,
              pay_max: data.pay_max,
              pay_display: data.pay_display,
              created_date_seek: data.created_date_seek,
              created_by: data.created_by,
            });
          } else {
            // Create new records
            const jobPost = await jobPostModel.create(
              account_id,
              null,
              'seek',
              data.job_title,
              data.status,
              data.additional
            );

            await jobPostSeekModel.create(jobPost.id, {
              seek_id: data.seek_id,
              candidate_count: data.candidate_count,
              created_date_seek: data.created_date_seek,
              created_by: data.created_by,
              currency: data.currency,
              pay_type: data.pay_type,
              pay_min: data.pay_min,
              pay_max: data.pay_max,
              pay_display: data.pay_display,
            });
          }
        }
        
        result.push(extracted)
      }
      return result;
    } catch(err) {
      throw err;
    } finally {
      await browserPuppeteer.close();
    }

  }
}

export default new SeekService();