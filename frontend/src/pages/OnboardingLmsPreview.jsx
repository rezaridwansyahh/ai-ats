import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import AppShell from '../components/onboarding-lms/Appshell';
import HomeScreen from '../components/onboarding-lms/Homescreen';
import OnboardingLogin from '../components/onboarding-lms/OnboardingLogin';
import { LMS_DATA } from '../components/onboarding-lms/mockData';
import Journey from '@/components/onboarding-lms/Journey';
import ModuleDetail from '@/components/onboarding-lms/ModuleDetail';

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

  const [route, setRoute] = useState('home');
  const [params, setParams] = useState({});

  const t = LMS_DATA.T[LANG];

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
  }, []);

  const handleLoginSuccess = async (onboardingData) => {
    setOnboarding(onboardingData);
    const token = getOnboardingToken();
    const curRes = await getCurriculum(token);
    setCurriculum(curRes.data);
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

  const renderScreen = () => {
    switch (route) {
      case 'home':
        return <HomeScreen data={LMS_DATA} t={t} lang={LANG} goTo={goTo} />;
      case 'journey':
        return <Journey t={t} lang={LANG} goTo={goTo} />;
      case 'module':
        return <ModuleDetail moduleId={params.moduleId} t={t} lang={LANG} goTo={goTo} />;
      case 'viewer':
        return <ComingSoon label="Content Viewer" />;
      case 'quiz':
        return <ComingSoon label="Assessment" />;
      case 'feedback':
        return <ComingSoon label="Feedback" />;
      case 'report':
        return <ComingSoon label="My Report" />;
      case 'assistant':
        return <ComingSoon label="Assistant" />;
      case 'help':
        return <ComingSoon label="Help & Buddy" />;
      case 'settings':
        return <ComingSoon label="Settings" />;
      case 'assessments':
      case 'assessment':
        return <ComingSoon label="Assessments" />;
      default:
        return <HomeScreen data={LMS_DATA} t={t} lang={LANG} goTo={goTo} />;
    }
  };

  return (
    <AppShell route={route} goTo={goTo} t={t}>
      {renderScreen()}
    </AppShell>
  );
}