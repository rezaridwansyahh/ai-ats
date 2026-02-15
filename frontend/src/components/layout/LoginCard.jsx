import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../../services/auth"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginCard() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate();

  const handleSubmitLogin = async (e) => {
    e.preventDefault()
    
    try {
      const res = await loginUser({
        email,
        password
      });

      console.log(res.data);

      navigate("/dashboard");
    } catch (err) {
      console.log("err", err);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <div className="w-4/5 mx-auto">
        <img 
          src="../../../public/abhimata.png"
          className="w-full object-contain"
        />
      </div>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button asChild variant="link">
            <a href="/register">Sign Up</a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form id="loginForm" onSubmit={handleSubmitLogin}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required onChange={(e) => setPassword(e.target.value)}/>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button form="loginForm" type="submit" className="w-full cursor-pointer">
          Login
        </Button>
      </CardFooter>
    </Card>
  )
}
