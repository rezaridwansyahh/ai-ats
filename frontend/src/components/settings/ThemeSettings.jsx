import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/*
 * Theme (appearance) settings.
 *
 * Light/Dark/System is delegated to `next-themes` (wired up via
 * <ThemeProvider attribute="class"> in main.jsx) instead of hand-rolled
 * localStorage + matchMedia logic — it owns the `dark` class on <html>,
 * syncs with the OS, and persists the choice, so there's only one thing
 * ever touching that class.
 *
 * Accent color is a separate, simpler concern: it just sets
 * `data-accent="..."` on <html>. theme-override.css reads that attribute
 * to swap --primary, --ring, --chart-1, --sidebar-primary, etc. Anything
 * using the `primary` token (bg-primary / text-primary / border-primary,
 * or the shared .hover-glow / .card-accent / .tab-active classes) follows
 * it automatically — no per-component wiring needed for those.
 */

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun, description: 'Bright background, dark text.' },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark background, easier on the eyes at night.' },
  { id: 'system', label: 'System', icon: Monitor, description: 'Match your device setting automatically.' },
];

const ACCENT_OPTIONS = [
  { id: 'green', label: 'Green', swatch: '#0A6E5C' },
  { id: 'blue', label: 'Blue', swatch: '#1D4ED8' },
  { id: 'amber', label: 'Yellow', swatch: '#B45309' },
  { id: 'pink', label: 'Pink', swatch: '#BE185D' },
];

function applyAccent(accent) {
  document.documentElement.setAttribute('data-accent', accent);
}

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const [accent, setAccent] = useState(() => {
    try {
      return localStorage.getItem('accent') || 'green';
    } catch {
      return 'green';
    }
  });

  useEffect(() => {
    applyAccent(accent);
    try {
      localStorage.setItem('accent', accent);
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, [accent]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b !pb-3 pt-3">
          <CardTitle className="text-sm">Appearance</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Choose how the workspace looks on this device.
          </p>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                    isActive
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className={`text-sm font-semibold ${isActive ? 'text-primary' : ''}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b !pb-3 pt-3">
          <CardTitle className="text-sm">Accent color</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Sets the brand color used across navigation, buttons, and highlights.
          </p>
        </CardHeader>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            {ACCENT_OPTIONS.map((option) => {
              const isActive = accent === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccent(option.id)}
                  title={option.label}
                  className={`flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1.5 text-sm transition-colors ${
                    isActive ? 'border-foreground/30 bg-muted' : 'border-border hover:bg-muted'
                  }`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: option.swatch }}
                  >
                    {isActive && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}