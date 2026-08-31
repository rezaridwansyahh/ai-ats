import { useMemo } from 'react';
import Sidebar from './SidebarOnboarding';
import Topbar from './TopbarOnboarding';
import { LMS_DATA } from './mockData';

export default function AppShell({ route, goTo, t, children }) {
  const completion = useMemo(() => {
    const total = LMS_DATA.MODULES.length;
    const done = LMS_DATA.MODULES.filter((m) => m.status === 'done').length;
    return { total, done, pct: Math.round((done / total) * 100) };
  }, []);

  const sbRoute =
    route === 'home' ? 'home'
    : route === 'report' ? 'report'
    : route === 'assistant' ? 'assistant'
    : route === 'help' ? 'help'
    : route === 'settings' ? 'settings'
    : (route === 'assessments' || route === 'assessment') ? 'assessments'
    : 'journey';

  const crumbs = useMemo(() => {
    switch (route) {
      case 'home':        return [t.crumb_home];
      case 'journey':     return [t.crumb_home, t.crumb_journey];
      case 'module':      return [t.crumb_home, t.crumb_journey, t.crumb_module];
      case 'viewer':      return [t.crumb_home, t.crumb_journey, t.crumb_module, t.crumb_viewer];
      case 'quiz':        return [t.crumb_home, t.crumb_journey, t.crumb_module, t.crumb_quiz];
      case 'feedback':    return [t.crumb_home, t.crumb_journey, t.crumb_module, t.crumb_feedback];
      case 'report':      return [t.crumb_home, t.crumb_report];
      case 'assistant':   return [t.crumb_home, t.crumb_assistant];
      case 'help':        return [t.crumb_home, t.crumb_help || 'Help & Buddy'];
      case 'settings':    return [t.crumb_home, t.crumb_settings || 'Settings'];
      case 'assessments': return [t.crumb_home, t.crumb_assessments || 'Assessments'];
      case 'assessment':  return [t.crumb_home, t.crumb_assessments || 'Assessments', t.crumb_assessment || 'Assessment'];
      default:             return [t.crumb_home];
    }
  }, [route, t]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar route={sbRoute} setRoute={(r) => goTo(r)} t={t} completion={completion} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar crumbs={crumbs} />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}