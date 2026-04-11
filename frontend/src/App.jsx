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
import CandidateSearchPage from "./pages/CandidateSearch"
import JobManagementPage from "./pages/JobManagement"
import RecruitersPage from "./pages/Recruiters"
import ComingSoonPage from "./pages/ComingSoon"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* All authenticated routes share DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/users/management" element={<UserManagementPage />} />
        <Route path="/users/role-management" element={<RoleManagementPage />} />
        <Route path="/users/recruiters" element={<RecruitersPage />} />

        <Route path="/settings/integrations" element={<IntegrationsPage />} />

        <Route path="/job-postings/account" element={<AccountPage />} />
        <Route path="/job-postings/seek" element={<SeekPage />} />

        <Route path="/job-management/seek-sourcing" element={<SeekSourcingPage />} />

        <Route path="/sourcing/job-management" element={<JobManagementPage />} />

        <Route path="/candidates/search" element={<CandidateSearchPage />} />

        {/* Catch-all: any unregistered path shows Coming Soon */}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App