import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

/*
  In this file, all of this file purpose is to extract data from the currently active page. 
  In this case i using jobstreet.com as my example to scrape the data in it and send it to the popup.html
*/

function scrapePage() {
  console.log("CONTENT SCRIPT LOADED")

  const cards = document.querySelector('[componentkey="SearchResultsMainContent"]');

  const data = cards.querySelectorAll('[role="button"][componentkey^="job-card-component-ref-"]');

  const jobs = Array.from(data).map((job) => {
    const firstDivChild = job.children[0];

    const layout = firstDivChild.children[0];

    const logo = layout.querySelector('img');
    const logoUrl = logo.src; //done

    const textLayout = layout.children[1];

    const UpperTextWrapper = textLayout.children[0];
    const UpperTextLayout = UpperTextWrapper.children[0];
    const UpperTextLayoutDivided = UpperTextLayout.children[0];

    const BottomTextWrapper = textLayout.children[1];

    const jobTitleElement = UpperTextLayoutDivided.children[0] as HTMLElement;
    const jobTitle = jobTitleElement.innerText.trim();

    const cleanedJobTitle = jobTitle.replace(/\n.*$/, ""); // first extracted data

    const companyNameDiv = UpperTextLayoutDivided.children[1];
    const companyName = companyNameDiv.textContent?.trim();

    const location = UpperTextLayoutDivided.children[2].textContent?.trim();

    const jobPosted = BottomTextWrapper.querySelector('span').textContent?.trim();
    
    return {
      title: cleanedJobTitle,
      company: companyName,
      logoUrl,
      located: location,
      posted: jobPosted
    }
  })

  return jobs;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCRAPE") {
    const data = scrapePage();
    sendResponse({ data });
  }

  return true // required for async response safety
})