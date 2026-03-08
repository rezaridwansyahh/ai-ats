import { useState } from "react"

type Status = "idle" | "checking" | "valid" | "renewed" | "error"

export default function Popup() {
  const [status, setStatus] = useState<Status>("idle")
  const [detail, setDetail] = useState("")
  const [loading, setLoading] = useState(false)

  const checkCookies = () => {
    setLoading(true)
    setStatus("checking")
    setDetail("")

    const port = chrome.runtime.connect({ name: "cookie-check" })

    port.postMessage({
      action: "CHECK_AND_SYNC",
      account_id: 2
    })

    port.onMessage.addListener((res) => {
      port.disconnect()

      if (!res.success) {
        setStatus("error")
        setDetail(res.message || "Unknown error")
      } else if (res.status === "valid") {
        setStatus("valid")
        setDetail("Cookies are valid")
      } else if (res.status === "renewed") {
        setStatus("renewed")
        setDetail("Cookies were invalid and have been renewed")
      } else {
        setStatus("error")
        setDetail(JSON.stringify(res, null, 2))
      }

      setLoading(false)
    })
  }

  const statusColor: Record<Status, string> = {
    idle: "#888",
    checking: "#f59e0b",
    valid: "#22c55e",
    renewed: "#3b82f6",
    error: "#ef4444"
  }

  const statusLabel: Record<Status, string> = {
    idle: "Ready",
    checking: "Checking...",
    valid: "Valid",
    renewed: "Renewed",
    error: "Error"
  }

  return (
    <div style={{ padding: 16, minWidth: 280, fontFamily: "system-ui, sans-serif" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>ATS Cookie Checker</h3>

      <button
        onClick={checkCookies}
        disabled={loading}
        style={{
          width: "100%",
          padding: "8px 16px",
          background: loading ? "#94a3b8" : "#0A6E5C",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14
        }}>
        {loading ? "Checking..." : "Check Cookies"}
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
