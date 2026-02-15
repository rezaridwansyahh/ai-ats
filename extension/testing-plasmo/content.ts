import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.jobstreet.com/*"]
}

/*
  In this file, all of this file purpose is to extract data from the currently active page. 
  In this case i using jobstreet.com as my example to scrape the data in it and send it to the popup.html
*/

console.log("Content script loaded!")

function scrapePage() {
  const cards = document.querySelectorAll('[data-testid="job-card"]');

  const data = Array.from(cards).map((card) => {
    const jobTitle = card.querySelector('[data-automation="jobTitle"]');
    const company = card.querySelector('[data-automation="jobCompany"]');
    const location = card.querySelectorAll('[data-automation="jobCardLocation"]');
    const salary = card.querySelector('[data-automation="jobSalary"]')
    const arrangement = card.querySelector('[data-testid="work-arrangement"]');
    const requiredSkillList = card.querySelector("ul");
    const classification = card.querySelector('[data-automation="jobClassification"]');
    const subClassification = card.querySelector('[data-automation="jobSubClassification"]');
    const datePublished = card.querySelector('[data-automation="jobListingDate"]');
    
    const locationParsed = Array.from(location).map((el) => el.textContent?.trim()).join(" ");

    const requiredSkill = requiredSkillList?.textContent?.trim();
    
    return {
      jobTitle: jobTitle.textContent?.trim(),
      company: company.textContent?.trim(),
      location: locationParsed,
      salary: salary?.textContent?.trim(),
      arrangement: arrangement?.textContent?.trim() || null,
      requiredSkill: requiredSkill,
      classification: classification.textContent?.trim(),
      subClassification: subClassification.textContent?.trim(),
      datePublished: datePublished.textContent?.trim()
    }
  })

  return data;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE") {
    const data = scrapePage();
    sendResponse({ data });
  }

  return true // required for async response safety
})