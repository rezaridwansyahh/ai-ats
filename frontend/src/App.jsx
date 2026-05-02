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
import SourceManagementPage from "./pages/SourceManagement"
import TalentPoolPage from "./pages/TalentPool"
import SourceCandidatePage from "./pages/SourceCandidate"
import RecruitersPage from "./pages/Recruiters"
import ComingSoonPage from "./pages/ComingSoon"
import AssessmentPage from "./pages/Assessment"
import ReportPage from "./pages/Report"
import AIMatchingPage from "./pages/AIMatching"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* All authenticated routes share DashboardLayout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/settings/user-management" element={<UserManagementPage />} />
        <Route path="/settings/role-management" element={<RoleManagementPage />} />
        <Route path="/settings/recruiters" element={<RecruitersPage />} />
        <Route path="/settings/account" element={<AccountPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />

        <Route path="/job-postings/seek" element={<SeekPage />} />

        <Route path="/job-management/seek-sourcing" element={<SeekSourcingPage />} />

        <Route path="/sourcing/job-management" element={<JobManagementPage />} />
        <Route path="/sourcing/source-management" element={<SourceManagementPage />} />
        <Route path="/sourcing/talent-pool" element={<TalentPoolPage />} />
        <Route path="/sourcing/source-candidate" element={<SourceCandidatePage />} />

        <Route path="/candidates/search" element={<CandidateSearchPage />} />
        <Route path="/selection/assessment" element={<AssessmentPage />} />
        <Route path="/selection/report" element={<ReportPage />} />
        <Route path="/selection/ai-matching" element={<AIMatchingPage />} />

        {/* Catch-all: any unregistered path shows Coming Soon */}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  )
}

export default App