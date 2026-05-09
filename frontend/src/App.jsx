import { Routes, Route } from "react-router-dom"
import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"
import DashboardPage from "./pages/Dashboard"
import DashboardLayout from "./components/layout/Dashboard-Layout"
import UserManagementPage from "./pages/UserManagement"
import IntegrationsPage    from "./pages/Integrations"
import RoleManagementPage from "./pages/RoleManagement"
import AccountPage from "./pages/Account"
import JobManagementPage from "./pages/JobManagement"
import SourceManagementPage from "./pages/SourceManagement"
import TalentPoolPage from "./pages/TalentPool"
import SourceCandidatePage from "./pages/SourceCandidate"
import RecruitersPage from "./pages/Recruiters"
import ComingSoonPage from "./pages/ComingSoon"
import AssessmentPage from "./pages/Assessment"
import AssessmentAPage from "./pages/AssessmentA"
import ReportPage from "./pages/Report"
import AIMatchingPage from "./pages/AIMatching"
import AssessmentBPage from "./pages/AssessmentB"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* All authenticated routes share DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/sourcing/job-management" element={<JobManagementPage />} />
        <Route path="/sourcing/source-management" element={<SourceManagementPage />} />
        <Route path="/sourcing/talent-pool" element={<TalentPoolPage />} />
        <Route path="/sourcing/source-candidate" element={<SourceCandidatePage />} />

        <Route path="/selection/ai-matching" element={<AIMatchingPage />} />
        <Route path="/selection/assessment" element={<AssessmentPage />} />
        <Route path="/selection/assessment-b" element={<AssessmentBPage />} />
        <Route path="/asesmen-a" element={<AssessmentAPage />} />
        <Route path="/assessment-a" element={<AssessmentAPage />} />
        <Route path="/selection/report" element={<ReportPage />} />

        <Route path="/settings/user-management" element={<UserManagementPage />} />
        <Route path="/settings/role-management" element={<RoleManagementPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/account" element={<AccountPage />} />
        <Route path="/settings/recruiters" element={<RecruitersPage />} />

        {/* Catch-all: any unregistered path shows Coming Soon */}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App