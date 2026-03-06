import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { registerUser } from "@/services/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterCard() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  const handleSubmitRegister = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await registerUser({
        username,
        email,
        password
      });

      localStorage.setItem('token', res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in-up">
      {/* Logo — visible only on mobile */}
      <div className="flex justify-center mb-8 lg:hidden">
        <img
          src="/Myralix_Logo_Dark.png"
          className="h-10 w-auto object-contain"
          alt="Myralix"
        />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-display">Create an account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your details to get started
        </p>
      </div>

      <form onSubmit={handleSubmitRegister} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-xs font-medium">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="John Smith"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            className="h-10"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-10 font-medium cursor-pointer"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-primary font-medium hover:underline">
          Sign In
        </a>
      </p>
    </div>
  )
}
