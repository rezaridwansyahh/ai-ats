import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSetting, saveSetting } from '@/api/setting.api';

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

const DEFAULT_ACCENT = 'green';

function applyAccent(accent) {
  document.documentElement.setAttribute('data-accent', accent);
}

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const [accent, setAccentState] = useState(DEFAULT_ACCENT);
  const [remoteSetting, setRemoteSetting] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingAccent, setSavingAccent] = useState(null); // accent id currently being saved, or null

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getSetting('theme');
        if (cancelled) return;
        const value = res?.data?.data || {};
        const loadedAccent = ACCENT_OPTIONS.some((o) => o.id === value.accent)
          ? value.accent
          : DEFAULT_ACCENT;
        setRemoteSetting(value);
        setAccentState(loadedAccent);
        applyAccent(loadedAccent);
      } catch (err) {
        console.error('Failed to load theme setting:', err);
        if (!cancelled) applyAccent(DEFAULT_ACCENT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAccentChange(nextAccent) {
    if (nextAccent === accent || savingAccent) return;

    const previousAccent = accent;
    setAccentState(nextAccent);
    applyAccent(nextAccent);
    setSavingAccent(nextAccent);

    try {
      const merged = { ...remoteSetting, accent: nextAccent };
      const res = await saveSetting('theme', merged);
      setRemoteSetting(res?.data?.data || merged);
    } catch (err) {
      console.error('Failed to save accent color:', err);
      setAccentState(previousAccent);
      applyAccent(previousAccent);
    } finally {
      setSavingAccent(null);
    }
  }

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
            Sets the brand color used across navigation, buttons, and highlights for everyone in your company.
          </p>
        </CardHeader>
        <CardContent className="py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {ACCENT_OPTIONS.map((option) => {
                const isActive = accent === option.id;
                const isSaving = savingAccent === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleAccentChange(option.id)}
                    title={option.label}
                    disabled={!!savingAccent}
                    className={`flex items-center gap-2 rounded-full border pl-1.5 pr-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${
                      isActive ? 'border-foreground/30 bg-muted' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: option.swatch }}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                      ) : (
                        isActive && <Check className="h-3.5 w-3.5 text-white" />
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}