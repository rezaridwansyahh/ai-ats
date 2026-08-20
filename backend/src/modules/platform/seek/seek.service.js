import cookieService from "../../cookie/cookie.service.js"
import loginRpa from "./rpa/login.rpa.js"
import jobPostRpa from "./rpa/job-post.rpa.js"
import extractCandidateRpa from "./rpa/extract-candidate.rpa.js"
import jobSourceModel from "../../job-source/job-source.model.js"
import jobPostSeekModel from "./job-post-seek.model.js"
import browserPuppeteer from "../../../shared/services/puppeteer/browser.puppeteer.js"
import extractJobPostRpa from "../seek/rpa/extract-job-post.rpa.js"
import applicantModel from "../../applicant/applicant.model.js"
import jobAccountModel from "../../job-account/job-account.model.js"
import candidatePipelineModel from "../../candidate-pipeline/candidate-pipeline.model.js"
import companyService from "../../company/company.service.js"
import { promoteDownloadedCv } from "../../../shared/utils/cv-storage.js"

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

  async jobPostDraft(account_id, service, job_post_id, dataForm) {
    const sourcing = await jobSourceModel.create(account_id, job_post_id, service, dataForm.job_title);
    const jobPostSeek = await jobPostSeekModel.create(sourcing.id, {
      currency: dataForm.currency,
      pay_type: dataForm.pay_type,
      pay_min: dataForm.pay_min,
      pay_max: dataForm.pay_max,
      pay_display: dataForm.pay_display,
    });
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      const { draftId } = await jobPostRpa.fillFormJobPostDraft(page, dataForm);
      const update = await jobSourceModel.updateStatus(sourcing.id, "Draft");
      const updateSeek = await jobPostSeekModel.update(sourcing.id, { seek_id: draftId });

      return { jobPost: update, jobPostSeek: updateSeek };
    } catch (err) {
      await jobSourceModel.updateStatus(sourcing.id, "Failed");
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }

  async deleteJobPostDraft(job_sourcing_id, account_id) {
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(job_sourcing_id);

    try {
      await loginRpa.authenticatedPage(page, account_id);
      await jobPostRpa.deleteJobPostDraft(page, jobPostSeek.seek_id);

      const deleted = await jobSourceModel.delete(job_sourcing_id);

      return deleted;
    } catch (err) {
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }

  async updateJobPostDraft(job_sourcing_id, account_id, dataForm) {
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);
    const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(job_sourcing_id);
    const account = await this.getAccountAndDecrypt(account_id);

    try {
      await loginRpa.fillLogin(page, account.email, account.decrypted);
      const { message } = await jobPostRpa.updateJobPostDraft(page, jobPostSeek.seek_id, dataForm); // remember to incl the data, still hardcoded on the job post rpa

      if(message) {
        throw new Error(message);
      }

      const updated = await jobSourceModel.update(job_sourcing_id, { job_title: dataForm.job_title });
      const seekUpdated = await jobPostSeekModel.update(job_sourcing_id, { currency: dataForm.currency, pay_type: dataForm.pay_type, pay_min: dataForm.pay_min, pay_max: dataForm.pay_max, pay_display: dataForm.pay_display });

      return { updatedJobPost: updated, updatedSeek: seekUpdated};
    } catch (err) {
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }
  async extractCandidates(account_id, job_sourcing_id, page = null) {
    const ownPage = !page;

    if(!page) {
      page = await cookieService.includeCookiesIfExist(account_id);
    }

    const jobPostSeek = await jobPostSeekModel.getDetailsByJobSourcingId(job_sourcing_id);

    // Owned posting (created in our platform) → resolves to a core_job; orphan → null.
    // When linked, each synced applicant is auto-promoted to a candidate for that job.
    const linkedJobId = await jobSourceModel.getLinkedJobId(job_sourcing_id);

    // Resolve the owning company from the job account so synced applicants are
    // scoped correctly — without this, applicants insert with company_id=NULL
    // and silently never show up in Talent Pool (WHERE ma.company_id = $1).
    const account = await jobAccountModel.getById(account_id);
    const company_id = account?.company_id || null;

    // Company name is just for a readable storage folder — resolved once up
    // front (not per-candidate) and falls back gracefully if it's missing.
    let companyName = 'unknown';
    if (company_id) {
      try {
        const company = await companyService.getById(company_id);
        companyName = company.name;
      } catch {
        // company lookup failing shouldn't block the sync
      }
    }

    try {
      await loginRpa.authenticatedPage(page, account_id);
      await extractCandidateRpa.navigateToCandidatePage(page, jobPostSeek.seek_id);

      const buckets = await extractCandidateRpa.extractCandidateType(page, jobPostSeek.seek_id);
      const seekRecord = await jobPostSeekModel.getBySeekId(jobPostSeek.seek_id);
      const job_name = seekRecord?.job_title || jobPostSeek.seek_id;

      const results = [];

      for (const bucket of buckets) {
        if (bucket.count === 0) {
          results.push({ bucket: bucket.name, saved: 0, skipped: 0, promoted: 0 });
          continue;
        }

        await extractCandidateRpa.navigateToCandidateDetail(page, bucket.name);

        let promoted = 0;

        // Skip candidates already saved for this job_sourcing_id — checked by
        // the RPA layer before it clicks into the card, so a re-sync doesn't
        // re-open the modal / re-download the resume for people we already have.
        const checkExists = (name) => applicantModel.existsByNameAndJobSourcing(name, job_sourcing_id);

        // Called by the RPA layer immediately per candidate (not buffered into
        // an array and processed only after the whole bucket finishes) — so
        // progress persists even if a later page in this bucket fails/times out.
        const onSave = async (candidate) => {
          if (!candidate.candidate_id) return;

          // Create without attachment first — the resume PDF (if any) is still
          // sitting in a temp staging dir at this point (extract-candidate.rpa.js
          // can't name/place it into permanent storage before the applicant's
          // real DB id exists). Same two-step pattern the manual Talent Pool CV
          // upload uses (sourcing.service.js:uploadCv).
          const applicant = await applicantModel.create({
            job_sourcing_id,
            company_id,
            name: candidate.name,
            last_position: candidate.last_position,
            address: candidate.address,
            education: candidate.education || null,
            information: candidate.information || null,
            date: candidate.date || null,
            attachment: null,
          });

          if (candidate.attachment && applicant?.id) {
            try {
              const savedPath = promoteDownloadedCv(
                candidate.attachment, company_id, companyName, applicant.id, applicant.name
              );
              if (savedPath) {
                await applicantModel.updateAttachment(applicant.id, savedPath);
                applicant.attachment = savedPath;
              }
            } catch (err) {
              console.error(`Failed to promote resume for applicant ${applicant.id}:`, err.message);
            }
          }

          // Auto-promote to candidate for owned postings only. Dup-safe (ON CONFLICT
          // DO NOTHING) and individually guarded so one failure never aborts the batch.
          if (linkedJobId && applicant?.id) {
            try {
              const created = await candidatePipelineModel.createFromApplicantIfAbsent(applicant.id, linkedJobId);
              if (created) promoted++;
            } catch (err) {
              console.error(`Auto-promote failed for applicant ${applicant.id} → job ${linkedJobId}:`, err.message);
            }
          }
        };

        const { saved, skipped } = await extractCandidateRpa.extractCandidates(
          page, bucket, account_id, jobPostSeek.seek_id, job_name, { checkExists, onSave }
        );

        results.push({ bucket: bucket.name, saved, skipped, promoted });
      }

      return { buckets, results, linkedJobId };
    } catch (err) {
      throw err;
    } finally {
      if(ownPage) await browserPuppeteer.close();
    }
  }

  // Upserts a single normalized row immediately — this is what makes the
  // sync resilient to a mid-scrape crash: every row that's already been
  // scraped is already saved by the time the next one starts, instead of
  // everything living only in memory until the whole multi-page scrape
  // finishes. Never throws — a DB failure on one row is logged and
  // skipped rather than aborting the rest of the sync.
  async _upsertSeekJobPostRow(account_id, data) {
    try {
      const existing = data.seek_id ? await jobPostSeekModel.getBySeekId(data.seek_id) : null;

      if (existing) {
        await jobSourceModel.update(existing.job_sourcing_id, {
          job_title: data.job_title,
          status: data.status,
          additional: data.additional,
          job_desc: data.job_desc,
          job_location: data.job_location,
        });
        await jobPostSeekModel.update(existing.job_sourcing_id, {
          candidate_count: data.candidate_count,
          currency: data.currency,
          pay_type: data.pay_type,
          pay_min: data.pay_min,
          pay_max: data.pay_max,
          pay_display: data.pay_display,
          created_date_seek: data.created_date_seek,
          created_by: data.created_by,
          work_option: data.work_option,
          work_type: data.work_type,
        });
      } else {
        // Create new records (synced from Seek without a corresponding job_post)
        const sourcing = await jobSourceModel.create(
          account_id,
          null,
          'seek',
          data.job_title,
          data.status,
          data.additional,
          data.job_desc,
          data.job_location
        );

        await jobPostSeekModel.create(sourcing.id, {
          seek_id: data.seek_id,
          candidate_count: data.candidate_count,
          created_date_seek: data.created_date_seek,
          created_by: data.created_by,
          currency: data.currency,
          pay_type: data.pay_type,
          pay_min: data.pay_min,
          pay_max: data.pay_max,
          pay_display: data.pay_display,
          work_option: data.work_option,
          work_type: data.work_type,
        });
      }
    } catch (err) {
      console.error(`[syncJobPostAll] Failed to upsert seek_id=${data.seek_id}:`, err.message);
    }
  }

  // Decides whether a row is worth the expensive detail-modal scrape.
  // - expired jobs can never change again once we already have their full
  //   detail (pay/created-date), so they're skipped forever after the
  //   first successful scrape.
  // - open jobs are skipped only if the cheap row-level fields (title,
  //   candidate count) and status both still match what's already stored —
  //   any real change forces a fresh detail scrape.
  async _shouldSkipSeekDetailScrape(basicData, type) {
    if (!basicData.seek_id) return false;

    const existing = await jobPostSeekModel.getBySeekId(basicData.seek_id);
    if (!existing) return false; // brand new job — always scrape

    if (type === 'expired') {
      const hasFullDetail = existing.pay_min != null || existing.created_date_seek != null;
      return existing.status === 'Expired' && hasFullDetail;
    }

    // 'open' bucket
    return existing.status === 'Active'
      && existing.sourcing_job_title === basicData.job_title
      && existing.candidate_count === basicData.candidate_count;
  }

  async syncJobPostAll(account_id, page = null) {
    const types = ['open', 'expired']; // Seek has no real "draft" listing under this page/type flow
    const ownPage = !page;

    if(!page) {
      page = await cookieService.includeCookiesIfExist(account_id);
    }

    try {
      await loginRpa.authenticatedPage(page, account_id);
      const summary = {};
      for(let i = 0; i < types.length; i++) {
        const counts = await extractJobPostRpa.syncAll(page, types[i], {
          onRow: (data) => this._upsertSeekJobPostRow(account_id, data),
          shouldSkipDetail: (basicData, type) => this._shouldSkipSeekDetailScrape(basicData, type),
        });

        summary[types[i]] = counts;
        console.log(`[syncJobPostAll] account=${account_id} type=${types[i]}: scraped=${counts.scraped} skipped=${counts.skipped} failed=${counts.failed}`);
      }
      await jobAccountModel.updateSync(account_id, 'Sync');
      return summary;
    } catch(err) {
      await jobAccountModel.updateSync(account_id, 'Error');
      throw err;
    } finally {
      if(ownPage) await browserPuppeteer.close();
    }
  }

  async syncAll(account_id) {
    const page = await cookieService.includeCookiesIfExist(account_id); // still hardcoded from req body (user_id, service);

    try {
      await this.syncJobPostAll(account_id, page);
      const sourcings = await jobSourceModel.getByAccountId(account_id);

      const results = [];

      for(const sourcing of sourcings) {
        const candidates = await this.extractCandidates(account_id, sourcing.id, page);

        results.push(candidates);
      }

      return { sourcings, candidates: results };
    } catch(err) {
      throw err;
    } finally {
      await browserPuppeteer.close();
    }
  }

  async checkConnection(account_id) {
    const page = await cookieService.includeCookiesIfExist(account_id);

    try {
      const check = await loginRpa.authenticatedPage(page, account_id);

      console.log(check);
      if(check) {
        return await jobAccountModel.updateCondition(account_id, 'Connected');
      }
    } catch(err) {
      await jobAccountModel.updateCondition(account_id, 'Error');
      throw err;
    } finally {
      await browserPuppeteer.close();
    }
  }
}

export default new SeekService();