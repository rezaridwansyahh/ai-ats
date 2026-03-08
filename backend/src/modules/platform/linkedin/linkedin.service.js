import cookieService from "../../cookie/cookie.service.js"
import navigationRpa from "./rpa/navigation.rpa.js"
import jobPostRpa from "./rpa/job-post.rpa.js"
import projectCreateRpa from "./rpa/project-create.rpa.js"
import recruiteSearchRpa from "./rpa/recruite-search.rpa.js"

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
      // later add browser.close
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
        // later add browser.close
    }
  }
  async recruiteSearch(data) {
    const { account_id, dataForm } = data

    const page = await cookieService.includeCookiesIfExist(account_id)

    if (!page) {
      throw new Error("No cookies found")
    }

    try {
      await recruiteSearchRpa.fillFormRecruiteSearch(page, dataForm)
    } catch (err) {
      console.log(err)
      throw err
    } finally {
      // later add browser.close
    }
  }
}

export default new LinkedInService()
