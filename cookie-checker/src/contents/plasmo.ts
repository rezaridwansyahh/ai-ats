import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*"]
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.data?.source !== "ATS_FRONTEND") return

  const { account_id } = event.data

  chrome.runtime
    .sendMessage({ account_id })
    .then((response) => {
      window.postMessage(
        {
          source: "ATS_EXTENSION",
          ...response
        },
        "*"
      )
    })
    .catch((err) => {
      window.postMessage(
        {
          source: "ATS_EXTENSION",
          success: false,
          message: err.message
        },
        "*"
      )
    })
})