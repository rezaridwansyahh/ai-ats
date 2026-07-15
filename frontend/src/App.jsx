import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"
import DashboardPage from "./pages/Dashboard"
import DashboardLayout from "./components/layout/Dashboard-Layout"
import UserManagementPage from "./pages/UserManagement"
import IntegrationsPage    from "./pages/Integrations"
import RoleManagementPage from "./pages/RoleManagement"
import AccountPage from "./pages/Account"
import JobManagementPage from "./pages/JobManagement"
import JobEditPage from "./pages/JobEdit"
import JobDetailPage from "./pages/JobDetail"
import SourceManagementPage from "./pages/SourceManagement"
import TalentPoolPage from "./pages/TalentPool"
import SourceCandidatePage from "./pages/SourceCandidate"
import RecruitersPage from "./pages/Recruiters"
import ComingSoonPage from "./pages/ComingSoon"
import AssessmentAPage from "./pages/AssessmentA"
import PsychAssesmentPage from "./pages/PsychAssessment"
import ReportCandidatePage from "./pages/ReportCandidate"
import ReportCandidateDetailPage from "./pages/ReportCandidateDetail"
import CandidateDetailPage from "./pages/CandidateDetail"
import AssessmentPlacementPage from "./pages/portal/AssessmentPlacement"
import QAFollowUpPage from "./pages/portal/QAFollowUp"
import AIScreeningPage from "./pages/AIScreening"
import AIScreeningWorkboard from "./pages/AIScreeningWorkboard"
import AIScreeningCandidatePage from "./pages/AIScreeningCandidate"
import AssessmentBPage from "./pages/AssessmentB"
import CandidatePipelinePage from "./pages/CandidatePipeline"
import CandidatePipelineDetailPage from "./pages/CandidatePipelineDetail"
import AssessmentCPage from "./pages/AssessmentC"
import AssessmentDPage from "./pages/AssessmentD"
import InsightsDiscoveryAssessmentPage from "./pages/InsightsDiscoveryAssessment"
import ThomasKilmannAssessmentPage from "./pages/ThomasKilmannAssessment"
import InterviewWorkboard from "./pages/InterviewWorkboard"
import InterviewJobPage from "./components/interview/Interview-Job"
import InterviewCandidatePage from "./components/interview/Interview-Candidate"
import InterviewCalibration from "./pages/InterviewCalibration"
import BudgetSettingsPage from "./pages/BudgetSettings"
import BackgroundCheckPage from "./pages/BackgroundCheck"
import BackgroundCheckCandidatePage from "./components/background-check/BackgroundCheck-Candidate"
import BackgroundCheckJobPage from "./components/background-check/BackgroundCheck-Job"
import BackgroundCheckConsentPage from "./pages/portal/BgConsent"
import OfferWorkboard from "./pages/OfferWorkboard"
import OfferJobPage from "./components/offer-contract/Offer-Job";
import OfferCandidatePage from "./components/offer-contract/Offer-Candidate";

//PUNYA BAYU MASIH DUMMY
import InterviewPage from "./pages/Interview"
import SettingsPage from "./pages/Settings"
import OfferContractPage from "./pages/OfferContract"
import OnboardingPage from "./pages/Onboarding"
import OnboardingWorkboard from "./pages/OnboardingWorkboard"

import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public candidate-facing portal */}
        <Route path="/assessment-placement/:hash" element={<AssessmentPlacementPage />} />
        <Route path="/qa/:token" element={<QAFollowUpPage />} />
        <Route path="/bg/consent/:token" element={<BackgroundCheckConsentPage />} />

        {/* All authenticated routes share DashboardLayout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/candidate-pipeline" element={<CandidatePipelinePage />} />
          <Route path="/candidate-pipeline/:id" element={<CandidatePipelineDetailPage />} />

          <Route path="/sourcing/job-management" element={<JobManagementPage />} />
          <Route path="/sourcing/job-management/new" element={<JobEditPage />} />
          <Route path="/sourcing/job-management/:id/edit" element={<JobEditPage />} />
          <Route path="/sourcing/job-management/:id" element={<JobDetailPage />} />
          <Route path="/sourcing/source-management" element={<SourceManagementPage />} />
          <Route path="/sourcing/talent-pool" element={<TalentPoolPage />} />
          <Route path="/sourcing/source-candidate" element={<SourceCandidatePage />} />

          {/* Backward-compat: old `AI Matching` menu name still navigates here */}
          <Route path="/selection/ai-matching" element={<Navigate to="/selection/ai-screening" replace />} />
          <Route path="/ai-matching" element={<Navigate to="/selection/ai-screening" replace />} />

          <Route path="/selection/ai-screening" element={<AIScreeningWorkboard />} />
          <Route path="/selection/ai-screening/job/:jobId" element={<AIScreeningPage />} />
          <Route path="/selection/ai-screening/candidate/:candidateId" element={<AIScreeningCandidatePage />} />

          <Route path="/selection/psych-assessment" element={<PsychAssesmentPage />} />
          <Route path="/selection/medical-assessment" element={<ComingSoonPage />} />
          <Route path="/selection/assessment/:jobId/:participantId" element={<CandidateDetailPage />} />

          <Route path="/selection/interview" element={<InterviewWorkboard />} />
          <Route path="/selection/interview/job/:jobId" element={<InterviewJobPage/>} />
          <Route path="/selection/interview/candidate/:candidateId" element={<InterviewCandidatePage />} />
          <Route path="/selection/interview/calibration/:jobId" element={<InterviewCalibration />} />

        {/* <Route path="/selection/interview" element={<InterviewPage />} />  */}
        <Route path="/selection/background-check" element={<BackgroundCheckPage />} />
        <Route path="/selection/background-check/job/:jobId" element={<BackgroundCheckJobPage />} />
        <Route path="/selection/background-check/candidate/:bgId" element={<BackgroundCheckCandidatePage />} />

        <Route path="/selection/offer-contract" element={<OfferWorkboard />} />
        <Route path="/selection/offer-contract/job/:jobId" element={<OfferJobPage />} />
        <Route path="/selection/offer-contract/candidate/:offerId" element={<OfferCandidatePage />} />

        <Route path="/asesmen/assessment-a" element={<AssessmentAPage />} />
        <Route path="/asesmen/assessment-b" element={<AssessmentBPage />} />
        <Route path="/asesmen/assessment-c" element={<AssessmentCPage />} />
        <Route path="/asesmen/assessment-d" element={<AssessmentDPage />} />
        <Route path="/asesmen/insights-discovery-assessment" element={<InsightsDiscoveryAssessmentPage />} />
        <Route path="/asesmen/thomas-kilmann-assessment" element={<ThomasKilmannAssessmentPage />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/user-management" element={<UserManagementPage />} />
          <Route path="/settings/role-management" element={<RoleManagementPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/account" element={<AccountPage />} />
          <Route path="/settings/budget" element={<BudgetSettingsPage />} />
          <Route path="/settings/recruiters" element={<RecruitersPage />} />

          <Route path="/report-candidate" element={<ReportCandidatePage />} />
          <Route path="/report-candidate/:candidateId" element={<ReportCandidateDetailPage />} />

          {/* <Route path="/selection/offer-contract" element={<OfferContractPage />} />

          <Route path="/selection/offer-contract" element={<OfferContractPage />} /> */}
          <Route path="/selection/onboarding" element={<OnboardingWorkboard />} />
          <Route path="/selection/onboarding/:onboardingId" element={<OnboardingPage />} />

          {/* Catch-all: any unregistered path shows Coming Soon */}
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App