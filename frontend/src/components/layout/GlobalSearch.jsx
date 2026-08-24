import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Home, Briefcase, GitBranch, Users, Search as SearchIcon,
  Brain, FileText, UserCheck, HeartPulse, ShieldCheck,
  FileSignature, ClipboardCheck, BarChart3, Settings as SettingsIcon,
} from 'lucide-react';

const JUMP_TO = [
  { label: 'Go to Dashboard',           icon: Home,           route: '/dashboard',                    shortcut: ['G', 'D'] },
  { label: 'Go to Report Candidate',    icon: FileText,       route: '/report-candidate',              shortcut: ['G', 'R'] },
  { label: 'Go to Job Management',      icon: Briefcase,      route: '/sourcing/job-management',       shortcut: ['G', 'J'] },
  { label: 'Go to Pipeline',            icon: GitBranch,      route: '/candidate-pipeline',            shortcut: ['G', 'P'] },
  { label: 'Go to Search & Outreach',   icon: SearchIcon,     route: '/sourcing/source-candidate',     shortcut: ['G', 'S'] },
  { label: 'Go to Source Management',   icon: GitBranch,      route: '/sourcing/source-management',    shortcut: ['G', 'O'] },
  { label: 'Go to Talent Pool',         icon: Users,          route: '/sourcing/talent-pool',          shortcut: ['G', 'T'] },
  { label: 'Go to AI Screening',        icon: Brain,          route: '/selection/ai-screening',        shortcut: ['G', 'A'] },
  { label: 'Go to Interview',           icon: UserCheck,      route: '/selection/interview',           shortcut: ['G', 'I'] },
  { label: 'Go to Psychological Ass.',  icon: HeartPulse,     route: '/selection/psych-assessment',    shortcut: ['G', 'Y'] },
  { label: 'Go to Medical Assessment',  icon: HeartPulse,     route: '/selection/medical-assessment',  shortcut: ['G', 'M'] },
  { label: 'Go to Background Check',    icon: ShieldCheck,    route: '/selection/background-check',    shortcut: ['G', 'B'] },
  { label: 'Go to Offer & Contract',    icon: FileSignature,  route: '/selection/offer-contract',      shortcut: ['G', 'C'] },
  { label: 'Go to Onboarding',          icon: ClipboardCheck, route: '/selection/onboarding',          shortcut: ['G', 'N'] },
  { label: 'Go to Reports',             icon: BarChart3,      route: '/reports',                       shortcut: ['G', 'E'] },
  { label: 'Go to Settings',            icon: SettingsIcon,   route: '/settings',                      shortcut: ['G', 'K'] },
];

const SEARCH_ITEMS = [
  { label: 'Senior Frontend Developer', sub: 'Job · Jakarta · Active',           route: '/sourcing/job-management', icon: Briefcase },
  { label: 'Data Engineer',             sub: 'Job · Surabaya · Active',           route: '/sourcing/job-management', icon: Briefcase },
  { label: 'Head of Engineering',       sub: 'Job · Jakarta · Confidential',      route: '/sourcing/job-management', icon: Briefcase },
  { label: 'Ayu Pratiwi',              sub: 'Candidate · Frontend Engineer',     route: '/sourcing/talent-pool',    icon: Users },
  { label: 'Budi Santoso',             sub: 'Candidate · UI Engineer · Bandung', route: '/sourcing/talent-pool',    icon: Users },
  { label: 'Citra Lestari',            sub: 'Candidate · Product Designer',      route: '/sourcing/talent-pool',    icon: Users },
];

export default function GlobalSearch() {
  const navigate            = useNavigate();
  const inputRef            = useRef(null);
  const listRef             = useRef(null);
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const [cursor, setCursor] = useState(0);

  // Tracks whether "G" was just pressed, waiting for the second key of a chord
  const pendingGRef        = useRef(false);
  const pendingGTimeoutRef = useRef(null);

  const items = query.trim()
    ? SEARCH_ITEMS.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.sub.toLowerCase().includes(query.toLowerCase())
      )
    : JUMP_TO;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setCursor(0);
  }, []);

  const select = useCallback((item) => {
    navigate(item.route);
    close();
  }, [navigate, close]);

  // Global Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // "G then <letter>" chord shortcuts — navigates directly, no modal needed.
  // Only active while the modal is closed; press G, then within 1s press the
  // second key (e.g. G then D -> Dashboard). Ignored while typing in a field.
  useEffect(() => {
    if (open) return;
    const handler = (e) => {
      const target = e.target;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (pendingGRef.current) {
        pendingGRef.current = false;
        clearTimeout(pendingGTimeoutRef.current);
        const match = JUMP_TO.find(
          (item) => item.shortcut.length === 2 && item.shortcut[1].toLowerCase() === key
        );
        if (match) {
          e.preventDefault();
          navigate(match.route);
        }
        return;
      }

      if (key === 'g') {
        pendingGRef.current = true;
        pendingGTimeoutRef.current = setTimeout(() => { pendingGRef.current = false; }, 1000);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(pendingGTimeoutRef.current);
    };
  }, [open, navigate]);

  // Keyboard nav inside modal
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape')    { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, items.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === 'Enter' && items[cursor]) select(items[cursor]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, cursor, items, close, select]);

  // Reset cursor on query change
  useEffect(() => { setCursor(0); }, [query]);

  // Closed state — search bar button in topbar
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 h-8 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 transition-colors w-8 md:w-auto md:min-w-[220px] justify-center md:justify-start"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="hidden md:flex flex-1 text-left">Search people, jobs, actions...</span>
        <kbd className="hidden md:flex text-[9px] font-semibold bg-background border border-border rounded px-1 py-0.5 flex-shrink-0">
          Ctrl + K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop — no backdrop-blur so the topbar stays sharp */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={close}
      />

      {/* Modal — sits just below the topbar, centered across full viewport. Uses --app-header-h (set in DashboardLayout.jsx) instead of a guessed pixel value. */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-lg z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        style={{ top: 'calc(var(--app-header-h) + 8px)' }}
      >

        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people, jobs, actions..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            onClick={close}
            className="text-[10px] font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5 hover:bg-muted transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[420px] overflow-y-auto">
          {!query.trim() && (
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Jump To
            </p>
          )}

          {items.length === 0 && (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              No results for "{query}"
            </p>
          )}

          {items.map((item, i) => {
            const Icon     = item.icon;
            const isActive = i === cursor;

            return (
              <button
                key={i}
                onMouseEnter={() => setCursor(i)}
                onClick={() => select(item)}
                className={`
                  flex items-center gap-3 w-full px-4 py-3 text-left transition-colors
                  ${isActive ? 'bg-primary/10' : 'hover:bg-muted/40'}
                `}
              >
                <div className={`
                  h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {item.label}
                  </p>
                  {item.sub && (
                    <p className="text-[11px] text-muted-foreground truncate">{item.sub}</p>
                  )}
                </div>

                {item.shortcut?.length > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.shortcut.map((key, ki) => (
                      <kbd key={ki} className="text-[10px] font-semibold bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom hint bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <kbd className="bg-background border border-border rounded px-1 py-0.5 text-[9px]">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <kbd className="bg-background border border-border rounded px-1 py-0.5 text-[9px]">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <kbd className="bg-background border border-border rounded px-1 py-0.5 text-[9px]">Esc</kbd>
            close
          </span>
        </div>

      </div>
    </>
  );
}