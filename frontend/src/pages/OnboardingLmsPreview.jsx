import { useState } from 'react';
import AppShell from '../components/onboarding-lms/Appshell';
import HomeScreen from '../components/onboarding-lms/Homescreen';
import { LMS_DATA } from '../components/onboarding-lms/mockData';

// Screens not built yet fall back to this
function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24">
      <div className="text-lg font-serif font-bold mb-1">{label}</div>
      <div className="text-sm text-muted-foreground">This screen isn't built yet.</div>
    </div>
  );
}

export default function OnboardingLmsPreview() {
  const [route, setRoute] = useState('home');
  const [params, setParams] = useState({});
  const [lang, setLang] = useState('en');

  const t = LMS_DATA.T[lang];

  const goTo = (nextRoute, nextParams = {}) => {
    setRoute(nextRoute);
    setParams(nextParams);
  };

  const renderScreen = () => {
    switch (route) {
      case 'home':
        return <HomeScreen data={LMS_DATA} t={t} lang={lang} goTo={goTo} />;
      case 'journey':
        return <ComingSoon label="My Journey" />;
      case 'module':
        return <ComingSoon label={`Module ${params.moduleId ?? ''}`} />;
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
        return <HomeScreen data={LMS_DATA} t={t} lang={lang} goTo={goTo} />;
    }
  };

  return (
    <AppShell route={route} goTo={goTo} lang={lang} setLang={setLang} t={t}>
      {renderScreen()}
    </AppShell>
  );
}