import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import AppShell from '../components/onboarding-lms/Appshell';
import HomeScreen from '../components/onboarding-lms/Homescreen';
import OnboardingLogin from '../components/onboarding-lms/OnboardingLogin';
import { LMS_DATA } from '../components/onboarding-lms/mockData';
import Journey from '@/components/onboarding-lms/Journey';
import ModuleDetail from '@/components/onboarding-lms/ModuleDetail';
import Viewer from '@/components/onboarding-lms/Viewer';
import Quiz from '@/components/onboarding-lms/Quiz';
import Feedback from '@/components/onboarding-lms/Feedback';
import Report from '@/components/onboarding-lms/Report';
import Assessments from '@/components/onboarding-lms/Assessments';
import AssessmentDetail from '@/components/onboarding-lms/AssessmentDetail';
import { getMyAssessmentResults } from '@/api/onboarding-assessment-result.api';
import { mergeLiveAssessments } from '@/components/onboarding-lms/utils/assessmentResultAdapter';
import InsightsCandidateCard from '@/components/assessment-insights/CandidateCard';
import TkiCandidateCard from '@/components/assessment-tki/CandidateCard';

import { getOnboardingToken, clearOnboardingToken } from '@/lib/onboardingPortalAuth';
import { getMe, getCurriculum } from '@/api/portal-onboarding.api';

// Fixed language — language toggle removed for now
const LANG = 'id';

function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24">
      <div className="text-lg font-serif font-bold mb-1">{label}</div>
      <div className="text-sm text-muted-foreground">This screen isn't built yet.</div>
    </div>
  );
}

export default function OnboardingLmsPreview() {
  const [authChecked, setAuthChecked] = useState(false);
  const [onboarding, setOnboarding] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState([]);

  const [route, setRoute] = useState('home');
  const [params, setParams] = useState({});

  const t = LMS_DATA.T[LANG];
  const refreshAssessmentResults = async () => {
    try {
      const token = getOnboardingToken();
      const res = await getMyAssessmentResults(token);
      setAssessmentResults(res.data.results || []);
    } catch (err) {
      console.error('Failed to load assessment results:', err);
    }
  };

  useEffect(() => {
    const token = getOnboardingToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }

    Promise.all([getMe(token), getCurriculum(token)])
      .then(([meRes, curRes]) => {
        setOnboarding(meRes.data.onboarding);
        setCurriculum(curRes.data);
      })
      .catch(() => clearOnboardingToken())
      .finally(() => setAuthChecked(true));

    refreshAssessmentResults();
  }, []);

  const handleLoginSuccess = async (onboardingData) => {
    setOnboarding(onboardingData);
    const token = getOnboardingToken();
    const curRes = await getCurriculum(token);
    setCurriculum(curRes.data);
    refreshAssessmentResults();
  };

  const goTo = (nextRoute, nextParams = {}) => {
    setRoute(nextRoute);
    setParams(nextParams);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!onboarding || !curriculum) {
    return <OnboardingLogin onSuccess={handleLoginSuccess} />;
  }

  const data = { ...LMS_DATA, MODULES: curriculum.MODULES, PHASES: curriculum.PHASES };
  const resultsByBattery = Object.fromEntries(assessmentResults.map((r) => [r.battery, r]));
  const mergedAssessments = mergeLiveAssessments(LMS_DATA.ASSESSMENTS, resultsByBattery);

  const renderScreen = () => {
    switch (route) {
      case 'home':
        return <HomeScreen data={LMS_DATA} t={t} lang={LANG} goTo={goTo} />;
      case 'journey':
        return <Journey t={t} lang={LANG} goTo={goTo} />;
      case 'module':
        return <ModuleDetail moduleId={params.moduleId} t={t} lang={LANG} goTo={goTo} />;
      case 'viewer':
        return <Viewer moduleId={params.moduleId} t={t} lang={LANG} goTo={goTo} />;
      case 'quiz':
        return <Quiz moduleId={params.moduleId} t={t} lang={LANG} goTo={goTo} />;
      case 'feedback':
        return <Feedback moduleId={params.moduleId} t={t} lang={LANG} goTo={goTo} />;
      case 'report':
        return <Report t={t} lang={LANG} goTo={goTo} />;
      case 'assistant':
        return <ComingSoon label="Assistant" />;
      case 'help':
        return <ComingSoon label="Help & Buddy" />;
      case 'settings':
        return <ComingSoon label="Settings" />;
      case 'assessments':
        return <Assessments lang={LANG} goTo={goTo} assessments={mergedAssessments} />;
      case 'assessment':
        return (
          <AssessmentDetail
            assessmentId={params.assessmentId}
            lang={LANG}
            goTo={goTo}
            assessments={mergedAssessments}
          />
        );
      case 'assessment-take': {
        const a = mergedAssessments.find((x) => x.id === params.assessmentId);
        const commonProps = {
          mode: 'onboarding',
          prefilledProfile: { name: onboarding.candidate_name },
          onExit: async () => {
            await refreshAssessmentResults();
            goTo('assessment', { assessmentId: a?.id });
          },
        };
        if (a?.battery === 'I') return <InsightsCandidateCard {...commonProps} />;
        if (a?.battery === 'T') return <TkiCandidateCard {...commonProps} />;
        return <ComingSoon label="Assessment" />;
      }
      default:
        return <HomeScreen data={LMS_DATA} t={t} lang={LANG} goTo={goTo} />;
    }
  };

  return (
    <AppShell route={route} goTo={goTo} t={t} modules={curriculum?.MODULES} onboarding={onboarding}>
      {renderScreen()}
    </AppShell>
  );
}