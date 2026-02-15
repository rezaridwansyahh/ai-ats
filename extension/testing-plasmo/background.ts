// Not yet used. Maybe will used in future improvements

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  chrome.tabs.sendMessage(tab.id, {
    type: "SCRAPE"
  })
})