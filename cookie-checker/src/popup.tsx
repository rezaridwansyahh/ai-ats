import { useEffect, useState } from "react"

type Status = "idle" | "saving" | "saved" | "error"

type Account = {
  id: number
  email: string
  portal_name: string
  cookies_updated_at: string | null
}

function formatUpdatedAt(iso: string | null) {
  if (!iso) return "Never saved"
  return `Updated ${new Date(iso).toLocaleString()}`
}

export default function Popup() {
  const [status, setStatus] = useState<Status>("idle")
  const [detail, setDetail] = useState("")
  const [loading, setLoading] = useState(false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsError, setAccountsError] = useState("")

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "cookie-check" })
    port.postMessage({ action: "FETCH_ACCOUNTS" })

    port.onMessage.addListener((res) => {
      port.disconnect()
      setAccountsLoading(false)

      if (!res.success) {
        setAccountsError(res.message || "Failed to load LinkedIn accounts.")
        return
      }

      const list: Account[] = res.accounts || []
      setAccounts(list)
      if (list.length > 0) setSelectedAccountId(list[0].id)
    })

    return () => {
      try { port.disconnect() } catch { /* already disconnected */ }
    }
  }, [])

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null

  const saveCookies = () => {
    if (!selectedAccountId) return
    setLoading(true)
    setStatus("saving")
    setDetail("")

    const port = chrome.runtime.connect({ name: "cookie-check" })

    port.postMessage({
      action: "SAVE_COOKIES",
      account_id: selectedAccountId
    })

    port.onMessage.addListener((res) => {
      port.disconnect()

      if (!res.success) {
        setStatus("error")
        setDetail(res.message || "Unknown error")
      } else {
        setStatus("saved")
        setDetail("Cookies saved")
        // Reflect the fresh timestamp immediately, without waiting for a popup reopen.
        const updatedAt = res.cookie?.updated_at
        if (updatedAt && selectedAccountId) {
          setAccounts((prev) =>
            prev.map((a) => (a.id === selectedAccountId ? { ...a, cookies_updated_at: updatedAt } : a))
          )
        }
      }

      setLoading(false)
    })
  }

  const statusColor: Record<Status, string> = {
    idle: "#888",
    saving: "#f59e0b",
    saved: "#22c55e",
    error: "#ef4444"
  }

  const statusLabel: Record<Status, string> = {
    idle: "Ready",
    saving: "Saving...",
    saved: "Saved",
    error: "Error"
  }

  return (
    <div style={{ padding: 16, minWidth: 280, fontFamily: "system-ui, sans-serif" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>ATS Cookie Checker</h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>
          LinkedIn account
        </label>

        {accountsLoading ? (
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Loading accounts…</p>
        ) : accountsError ? (
          <p style={{ fontSize: 12, color: "#ef4444", margin: 0, wordBreak: "break-word" }}>{accountsError}</p>
        ) : accounts.length === 0 ? (
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>No LinkedIn accounts found.</p>
        ) : (
          <>
            <select
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: 13
              }}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email} (#{a.id})
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>
                {formatUpdatedAt(selectedAccount.cookies_updated_at)}
              </p>
            )}
          </>
        )}
      </div>

      <button
        onClick={saveCookies}
        disabled={loading || !selectedAccountId}
        style={{
          width: "100%",
          padding: "8px 16px",
          background: loading || !selectedAccountId ? "#94a3b8" : "#0A6E5C",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading || !selectedAccountId ? "not-allowed" : "pointer",
          fontSize: 14
        }}>
        {loading ? "Saving..." : "Save Cookies"}
      </button>

      <div
        style={{
          marginTop: 12,
          padding: 10,
          borderRadius: 6,
          background: "#f8fafc",
          border: "1px solid #e2e8f0"
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: statusColor[status],
              display: "inline-block"
            }}
          />
          <strong style={{ fontSize: 13 }}>{statusLabel[status]}</strong>
        </div>
        {detail && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b", wordBreak: "break-word" }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}
