import cookieService from "../../cookie/cookie.service.js"
import browserPuppeteer from "../../../shared/services/puppeteer/browser.puppeteer.js"
import navigationRpa from "./rpa/navigation.rpa.js"
import jobPostRpa from "./rpa/job-post.rpa.js"
import projectCreateRpa from "./rpa/project-create.rpa.js"
import recruiteSearchRpa from "./rpa/recruite-search.rpa.js"
import extractDataRpa from "./rpa/extract-data.rpa.js"
import sourcingModel from "../../sourcing/sourcing.model.js"
import sourcingRecruiteModel from "../../sourcing/sourcing-recruite.model.js"
import loginRpa from "./rpa/login.rpa.js"
import jobSourceModel from "../../job-source/job-source.model.js"
import jobPostLinkedinModel from "./job-post-linkedin.model.js"
import applicantModel from "../../applicant/applicant.model.js"

import { joinArrayFields } from '../../../shared/utils/format.js';

class LinkedInService {
  async jobPost(data) {
    const { user_id, service, dataForm } = data

    const page = await cookieService.includeCookiesIfExist(user_id, service) // still hardcoded from req body (user_id, service);

    if (!page) {
      throw new Error("No cookies found")
    }

    try {
      await navigationRpa.redirectDashboard(page, "https://www.linkedin.com/talent/home") // still hardcoded of the link (page, link);
      await jobPostRpa.fillFormJobPost(page, dataForm) // remember to incl the data, still hardcoded on the job post rpa
    } catch (err) {
      console.log(err)
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }

  async projectCreate(data) {
    const { user_id, service, dataForm } = data

    const page = await cookieService.includeCookiesIfExist(user_id, service) // still hardcoded from req body (user_id, service);

    if (!page) {
      throw new Error("No cookies found")
    }

    try {
      await navigationRpa.redirectDashboard(page, "https://www.linkedin.com/talent/home") // still hardcoded of the link (page, link);
      await projectCreateRpa.redirectProjectCreate(page)
      await projectCreateRpa.fillFormProjectCreate(page, dataForm) // remember to incl the data, still hardcoded on the job post rpa
    } catch (err) {
      console.log(err)
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }
  async recruiteSearch(data) {
    const { account_id, dataForm } = data

    const page = await cookieService.includeCookiesIfExist(account_id)

    if (!page) {
      throw new Error("No cookies found")
    }

    try {
      await loginRpa.authenticatedPage(page, account_id);
      const form = await recruiteSearchRpa.fillFormRecruiteSearch(page, dataForm);
      const sourcing = joinArrayFields(form);
      
      const source = await sourcingModel.create(sourcing);

      const recruiteData = await extractDataRpa.extractRecruite(page, dataForm);
      
      const recruite = await sourcingRecruiteModel.bulkCreate(source.id, recruiteData);
      return {
        source,
        recruite
      };
    } catch (err) {
      console.log(err)
      throw err
    } finally {
      await browserPuppeteer.close();
    }
  }
  async extractApplicant(account_id, job_sourcing_id, limit) {
    const page = await cookieService.includeCookiesIfExist(account_id);
    const sourcing = await jobSourceModel.getById(job_sourcing_id);
    const jobPostLinkedin = await jobPostLinkedinModel.getByJobSourcingId(job_sourcing_id);

    if (!page) {
      throw new Error("No cookies found");
    }

    if (!jobPostLinkedin) {
      throw new Error("No LinkedIn job posting mapping found");
    }

    try {
      await loginRpa.authenticatedPage(page, account_id);
      await navigationRpa.redirectProjectJob(page, jobPostLinkedin.project_id, jobPostLinkedin.linkedin_id);

      const candidates = await extractDataRpa.extractApplicant(page, {
        account_id,
        job_name: sourcing.job_title,
        linkedin_id: jobPostLinkedin.linkedin_id,
        limit
      });

      for (const candidate of candidates) {
        await applicantModel.create({
          job_sourcing_id,
          name: candidate.name,
          last_position: candidate.last_position,
          address: candidate.address,
          information: candidate.information ? JSON.stringify(candidate.information) : null,
          attachment: candidate.attachment || null,
        });
      }

      return { saved: candidates.length };
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      // await browserPuppeteer.close();
    }
  }
}

export default new LinkedInService()
