import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { registerUser } from "../../services/auth"

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

export function RegisterCard() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const navigate = useNavigate()

  const handleSubmitRegister = async (e) => {
    e.preventDefault()
    
    try {
      const res = await registerUser({
        username,
        email,
        password
      });

      console.log(res);

      localStorage.setItem('token', res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.log("err");
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
        <CardTitle>Register to your account</CardTitle>
        <CardDescription>
          Enter your credential below to create your account
        </CardDescription>
        <CardAction>
          <Button asChild variant="link">
            <a href="/login">Log In</a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>

        <form id="registerForm" onSubmit={handleSubmitRegister}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="username"
                type="username"
                placeholder="John Smith"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="m@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>
          </div>
        </form>

        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button form="registerForm" type="submit" className="w-full cursor-pointer">
            Register
          </Button>
        </CardFooter>
      
      
    </Card>
  )
}
