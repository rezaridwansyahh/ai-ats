import {
  Home, Route as RouteIcon, Sparkles, Bot, FileText,
  MessageCircle, Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NAV_ICONS = {
  home: Home,
  journey: RouteIcon,
  assessments: Sparkles,
  assistant: Bot,
  report: FileText,
};

export default function Sidebar({ route, setRoute, t, completion }) {
  const links = [
    { key: 'home',        label: t.nav_home },
    { key: 'journey',     label: t.nav_journey },
    { key: 'assessments', label: t.nav_assessments },
    { key: 'assistant',   label: t.nav_assistant, accent: true },
    { key: 'report',      label: t.nav_report },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center font-serif font-bold text-sm flex-shrink-0">
          M
        </div>
        <div>
          <div className="font-serif font-bold text-sm leading-tight">Myralix</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Onboarding LMS</div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-2 mb-2">
          Workspace
        </div>
        <nav className="space-y-0.5">
          {links.map((l) => {
            const Icon = NAV_ICONS[l.key];
            const active = route === l.key;
            return (
              <button
                key={l.key}
                onClick={() => setRoute(l.key)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{l.label}</span>
                {l.accent && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-200 bg-emerald-50 text-emerald-700">
                    v3.3
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4 mt-5">
        <div className="border rounded-lg p-3.5 bg-muted/30">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t.progress_title}
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-serif text-xl font-bold">{completion.done}</span>
            <span className="text-xs text-muted-foreground">/ {completion.total} {t.progress_sub}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${completion.pct}%` }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground">{completion.pct_h ?? t.progress_h}</div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-2 mb-2">
          Support
        </div>
        <nav className="space-y-0.5">
          <button
            onClick={() => setRoute('help')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              route === 'help' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{t.nav_help}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">2</Badge>
          </button>
          <button
            onClick={() => setRoute('settings')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              route === 'settings' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{t.nav_settings || 'Settings'}</span>
          </button>
        </nav>
      </div>

      <div className="mt-auto px-4 py-4 border-t flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold flex-shrink-0">
          MP
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">Maya Putri</div>
          <div className="text-[11px] text-muted-foreground truncate">Backend Engineer · #ENG-2089</div>
        </div>
      </div>
    </aside>
  );
}