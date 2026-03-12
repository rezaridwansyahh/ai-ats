import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "@/services/auth"
import { AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginCard() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate();

  const handleSubmitLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await loginUser({
        email,
        password
      });

      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      localStorage.setItem('role', JSON.stringify(res.role))
      localStorage.setItem('permissions', JSON.stringify(res.permissions))
      localStorage.setItem('userData', JSON.stringify(res))

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full animate-fade-in-up">
      {/* Logo — visible only on mobile */}
      <div className="flex justify-center mb-8 lg:hidden">
        <img
          src="/Myralix_Logo_Dark.png"
          className="h-9 w-auto object-contain"
          alt="Myralix"
        />
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight font-display">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Sign in to your Myralix account to continue
        </p>
      </div>

      <form onSubmit={handleSubmitLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            required
            className="h-10 bg-background border-border/80 focus:border-primary transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">
              Password
            </Label>
            <a
              href="#"
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            required
            className="h-10 bg-background border-border/80 focus:border-primary transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 animate-scale-in">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-10 font-semibold cursor-pointer mt-1 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-muted-foreground font-medium">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-primary font-semibold hover:underline underline-offset-2 transition-colors">
          Sign Up
        </a>
      </p>
    </div>
  )
}
