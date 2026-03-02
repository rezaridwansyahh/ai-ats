class NavigationRpa {
  async redirectDashboard(page, link) { // watch this link
    const response = await page.goto(link, { waitUntil: "networkidle2" });
  }
}

export default new NavigationRpa();
