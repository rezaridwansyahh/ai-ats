export {}

// PLASMO_PUBLIC_API_URL, when set, points at the deployed API host (e.g.
// https://api.myralix.com) — same host that set the ats_token auth cookie,
// so the cookie lookup below has to use this same root, not a separate one.
const API_ROOT = process.env.PLASMO_PUBLIC_API_URL
  ? `${process.env.PLASMO_PUBLIC_API_URL}/portal/api`
  : "http://localhost:3000/api"

const AUTH_COOKIE_URL = process.env.PLASMO_PUBLIC_API_URL || "http://localhost:3000"

const COOKIES_API = `${API_ROOT}/cookies`
const ACCOUNT_API = `${API_ROOT}/account`

async function getAuthToken(): Promise<string | null> {
  const cookie = await chrome.cookies.get({ url: AUTH_COOKIE_URL, name: "ats_token" })
  return cookie?.value ?? null
}

// Lists the signed-in user's LinkedIn job accounts — this extension only
// ever checks/renews LinkedIn sessions, so there's no reason to fetch any
// other platform. Requires the ATS web app to have been logged into at
// least once (that's what sets the ats_token cookie this reads).
async function fetchLinkedinAccounts() {
  const token = await getAuthToken()
  if (!token) {
    return {
      success: false,
      message: "Not logged in to the ATS app — log in at the web app first, then try again."
    }
  }

  const res = await fetch(`${ACCOUNT_API}?platform=linkedin`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!res.ok) {
    return { success: false, message: `Failed to load accounts (${res.status})` }
  }

  const accounts = await res.json()
  return { success: true, accounts }
}

// Grabs whatever LinkedIn session cookies are in the browser right now and
// upserts them for this account — /save does create-if-missing,
// update-if-persisted (ON CONFLICT (account_id) DO UPDATE), so there's no
// separate "check validity" step needed: this always just saves the latest.
async function saveCookies(accountId: number) {
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

  const res = await fetch(`${COOKIES_API}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      cookies: { cookies, userAgent }
    })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { success: false, message: body.message || `Failed to save cookies (${res.status})` }
  }

  return { success: true, status: "saved", cookie: (await res.json()).cookie }
}

// Use port-based messaging to keep connection alive during long backend calls
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "cookie-check") return

  port.onMessage.addListener(async (message) => {
    console.log("BG port received:", message)

    if (message.action === "FETCH_ACCOUNTS") {
      try {
        const result = await fetchLinkedinAccounts()
        port.postMessage(result)
      } catch (err: any) {
        console.error("BG error:", err)
        port.postMessage({ success: false, message: err.message })
      }
      return
    }

    if (message.action === "SAVE_COOKIES") {
      try {
        const result = await saveCookies(message.account_id)
        port.postMessage(result)
      } catch (err: any) {
        console.error("BG error:", err)
        port.postMessage({ success: false, message: err.message })
      }
    }
  })
})
