import { useState } from 'react';
import { Globe, ArrowRight, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// ── Static data — swap for API data when backend is ready ──

const PORTAL_DOMAIN = 'careers.acme.co.id';

const PORTAL_FIELDS = [
  { id: 'domain', label: 'Custom domain', value: PORTAL_DOMAIN, verified: true },
  { id: 'primary-lang', label: 'Primary language', value: 'Bahasa Indonesia' },
  { id: 'secondary-lang', label: 'Secondary language', value: 'English' },
];

const DEFAULT_TOGGLES = [
  { id: 'reviews', label: 'Show company reviews', checked: true },
  { id: 'speculative', label: 'Allow speculative applications', checked: true },
  { id: 'consent', label: 'Require consent before CV upload', checked: true },
];

// ── Field row ──

function FieldRow({ label, value, verified, onEdit }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-medium">{value}</p>
          {verified && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200 gap-1">
              <Check className="h-2.5 w-2.5" />
              Verified
            </Badge>
          )}
        </div>
      </div>
      <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

// ── Toggle row ──

function ToggleRow({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ── Page ──

export default function CandidatePortalSettings() {
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);

  const toggle = (id) => {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Globe className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold">Candidate Portal</p>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                The candidate-facing experience lives on its own domain. Preview and configure it
                on a dedicated page.
              </p>
              <p className="text-xs text-muted-foreground mt-2">{PORTAL_DOMAIN}</p>
            </div>
          </div>
          <Button className="bg-teal-700 hover:bg-teal-800 flex-shrink-0 gap-1.5">
            Open portal page
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      {/* Portal settings */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Portal settings</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applied to the candidate-facing site.
          </p>
        </div>

        {PORTAL_FIELDS.map((f) => (
          <FieldRow key={f.id} label={f.label} value={f.value} verified={f.verified} />
        ))}

        {toggles.map((t) => (
          <ToggleRow
            key={t.id}
            label={t.label}
            checked={t.checked}
            onCheckedChange={() => toggle(t.id)}
          />
        ))}
      </Card>

      {/* Branding */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Branding</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload your logo, hero image, and brand colors.
          </p>
        </div>

        <div className="p-4 grid grid-cols-[140px_1fr] gap-4">
          {/* Logo */}
          <div className="rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 py-5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Logo</p>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-700 to-emerald-500 flex items-center justify-center text-white text-lg font-bold">
              A
            </div>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
              Replace
            </Button>
          </div>

          {/* Hero image */}
          <div className="rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 py-5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground self-start ml-4 mb-1">
              Hero image
            </p>
            <div className="w-full px-4">
              <div className="h-20 rounded-md bg-gradient-to-r from-teal-700 to-emerald-200" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">1600×600 · JPEG or PNG</p>
          </div>
        </div>
      </Card>
    </div>
  );
}