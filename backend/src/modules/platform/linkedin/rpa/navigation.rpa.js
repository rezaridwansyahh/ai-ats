class NavigationRpa {
  async redirectDashboard(page, link) { // watch this link
    const response = await page.goto(link, { waitUntil: "networkidle2" });
  }

  async redirectProjectJob(page, project_id = 1437532929, job_id = 4381723564) {
    await page.goto(`https://www.linkedin.com/talent/hire/${project_id}/discover/applicants?jobId=${job_id}`)
  }
}

export default new NavigationRpa();
