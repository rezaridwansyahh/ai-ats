import { Routes, Route } from "react-router-dom"
import LandingPage from "./pages/Landing"
import AdminLogin from "./pages/AdminLogin"
import AdminPanel from "./pages/AdminPanel"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}
