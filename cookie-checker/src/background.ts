export {}

const API_BASE = "http://localhost:3000/api/cookies"

async function checkCookies(accountId: number) {
  const res = await fetch(`${API_BASE}/check-cookies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId })
  })
  return res.json()
}

async function renewCookies(accountId: number) {
  const rawCookies = await chrome.cookies.getAll({ domain: ".linkedin.com" })

  if (!rawCookies.length) {
    return { success: false, message: "No LinkedIn cookies found in browser. Please log in to LinkedIn first." }
  }

  // Map to Puppeteer-compatible format
  const cookies = rawCookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    httpOnly: c.httpOnly,
    secure: c.secure,
    ...(c.sameSite && c.sameSite !== "unspecified" ? { sameSite: c.sameSite } : {}),
    ...(c.expirationDate ? { expires: c.expirationDate } : {})
  }))

  const userAgent = navigator.userAgent

  const res = await fetch(`${API_BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      cookies: { cookies, userAgent },
      service: "linkedin"
    })
  })

  return res.json()
}

async function handleCheckAndSync(accountId: number) {
  const checkResult = await checkCookies(accountId)
  console.log("Check result:", checkResult)

  if (checkResult.status === "invalid" && checkResult.retry) {
    console.log("Cookies invalid, renewing...")
    const renewResult = await renewCookies(accountId)
    console.log("Renew result:", renewResult)

    return {
      success: true,
      status: "renewed",
      check: checkResult,
      renew: renewResult
    }
  }

  return {
    success: true,
    status: checkResult.status,
    check: checkResult
  }
}

// Use port-based messaging to keep connection alive during long backend calls
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "cookie-check") return

  port.onMessage.addListener(async (message) => {
    console.log("BG port received:", message)

    if (message.action === "CHECK_AND_SYNC") {
      try {
        const result = await handleCheckAndSync(message.account_id)
        port.postMessage(result)
      } catch (err: any) {
        console.error("BG error:", err)
        port.postMessage({ success: false, message: err.message })
      }
    }
  })
})
