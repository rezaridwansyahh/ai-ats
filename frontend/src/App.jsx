import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"
import DashboardPage from "./pages/Dashboard"
import DashboardLayout from "./components/layout/Dashboard-Layout"
import UserManagementPage from "./pages/UserManagement"
import IntegrationsPage    from "./pages/Integrations"
import RoleManagementPage from "./pages/RoleManagement"
import AccountPage from "./pages/Account"
import SeekPage from "./pages/Seek"
import SeekSourcingPage from "./pages/SeekSourcing"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
      <Route path="/users" element={<DashboardLayout />}>
        <Route path="management"        element={<UserManagementPage />} />
        <Route path="role-management"   element={<RoleManagementPage />} />
      </Route>
      <Route path="/settings" element={<DashboardLayout />}>
        <Route path="integrations" element={<IntegrationsPage />} />
      </Route>
      <Route path="/job-postings" element={<DashboardLayout />}>
        <Route path="account"  element={<AccountPage />} />
        <Route path="seek"     element={<SeekPage />} />
      </Route>
      <Route path="/job-management" element={<DashboardLayout />}>
        <Route path="seek-sourcing" element={<SeekSourcingPage />} />
      </Route>
    </Routes>
  )
}

export default App