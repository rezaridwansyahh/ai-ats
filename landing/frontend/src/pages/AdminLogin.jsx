import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "@/api/auth.api"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data } = await login({ email, password })
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      navigate("/admin")
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f1f5f9",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 380,
        background: "#fff",
        borderRadius: 12,
        padding: "2.5rem 2rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
      }}>
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 5,
            }}>
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#0A6E5C"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 5,
            }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#0A6E5C"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 40,
              background: loading ? "#94a3b8" : "#0A6E5C",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = "#085c4d" }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = "#0A6E5C" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  )
}
