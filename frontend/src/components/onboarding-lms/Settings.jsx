import { useState } from 'react';
import { Upload, Download, Activity, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ---------- shared building blocks ---------- */

function SectionCard({ seq, title, subtitle, right, children }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b">
        <span className="font-serif text-lg text-muted-foreground w-6 flex-shrink-0 pt-0.5">{seq}</span>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-base font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

function FieldRow({ label, value, editable = true, onEdit }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        {editable && (
          <button
            onClick={onEdit}
            className="text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg border p-0.5 bg-muted/30 flex-shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            value === opt.value
              ? 'bg-white shadow-sm text-foreground border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-emerald-600' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
+          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function PrefRow({ label, hint, control }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      {control}
    </div>
  );
}

/* ---------- section 3: notification matrix ---------- */

const NOTIF_OPTIONS = {
  full: [
    { value: 'email_push', label: 'Email + push' },
    { value: 'email', label: 'Email' },
    { value: 'push', label: 'Push' },
    { value: 'off', label: 'Off' },
  ],
  epOnly: [
    { value: 'email_push', label: 'Email + push' },
    { value: 'push', label: 'Push' },
    { value: 'off', label: 'Off' },
  ],
  digest: [
    { value: 'weekly', label: 'Email · weekly' },
    { value: 'monthly', label: 'Email · monthly' },
    { value: 'off', label: 'Off' },
  ],
  survey: [
    { value: 'email', label: 'Email' },
    { value: 'in_app', label: 'In-app' },
    { value: 'off', label: 'Off' },
  ],
  cert: [
    { value: 'email_push', label: 'Email' },
    { value: 'push', label: 'Push' },
    { value: 'off', label: 'Off' },
  ],
};

const NOTIF_EVENTS = [
  { key: 'due_24h', label: 'Module due in 24h', hint: 'A nudge the day before, then quiet.', options: NOTIF_OPTIONS.full, defaultValue: 'email_push' },
  { key: 'overdue', label: 'Module overdue', hint: 'Once at +48h, then weekly until done.', options: NOTIF_OPTIONS.full, defaultValue: 'email_push' },
  { key: 'buddy_msg', label: 'Buddy or manager message', hint: 'Real time. Snoozable.', options: NOTIF_OPTIONS.epOnly, defaultValue: 'push' },
  { key: 'mention', label: '@mention in a discussion', hint: 'Direct mentions only — not channel-wide @here.', options: NOTIF_OPTIONS.epOnly, defaultValue: 'push' },
  { key: 'digest', label: 'Weekly digest — Friday 16:00', hint: 'Five-line summary of the week ahead and the week just done.', options: NOTIF_OPTIONS.digest, defaultValue: 'weekly' },
  { key: 'survey', label: 'Feedback survey requests', hint: 'Two per phase. Always optional.', options: NOTIF_OPTIONS.survey, defaultValue: 'off' },
  { key: 'cert_earned', label: 'New certificate earned', hint: 'Phase end-of-period and final track completion.', options: NOTIF_OPTIONS.cert, defaultValue: 'email' },
];

/* ---------- main component ---------- */

export default function Settings({ t }) {
  const [lang, setLang] = useState('en');
  const [density, setDensity] = useState('comfortable');
  const [theme, setTheme] = useState('light');
  const [accent, setAccent] = useState('emerald');

  const [textSize, setTextSize] = useState('base');
  const [contrast, setContrast] = useState('standard');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [captions, setCaptions] = useState(true);

  const [visibility, setVisibility] = useState('manager_buddy');
  const [retention, setRetention] = useState('90');
  const [showAvatar, setShowAvatar] = useState(true);
  const [anonFeedback, setAnonFeedback] = useState(true);

  const [notifValues, setNotifValues] = useState(
    Object.fromEntries(NOTIF_EVENTS.map((e) => [e.key, e.defaultValue]))
  );
  const setNotif = (key, value) => setNotifValues((prev) => ({ ...prev, [key]: value }));

  const accentColors = [
    { key: 'emerald', hex: '#0A6E5C' },
    { key: 'blue', hex: '#2147A1' },
    { key: 'amber', hex: '#A1361F' },
    { key: 'black', hex: '#111111' },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-lg">
          Five things you can change here: how you're reached, how the interface looks, what
          others see, accessibility, and account-level security.
        </p>
      </div>

      {/* 01 — Profile */}
      <SectionCard
        seq="01"
        title="Your profile"
        subtitle="Synced from the HRIS. Edits to name or role go through People Ops."
        right={
          <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Read-only · HRIS-managed
          </span>
        }
      >
        <div className="py-5 flex items-center gap-5 border-b">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-serif font-bold flex-shrink-0">
            MP
          </div>
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border rounded-lg px-3 py-1.5 hover:bg-muted/40">
            <Upload className="h-3.5 w-3.5" />
            Upload photo
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <FieldRow label="Full name" value="Maya Putri" editable={false} />
            <FieldRow label="Employee ID" value="ENG-2089" editable={false} />
            <FieldRow label="Hiring manager" value="Sari Hapsari" editable={false} />
            <FieldRow label="Start date" value="9 March 2026" editable={false} />
            <FieldRow label="Office" value="Jakarta HQ · Floor 14" editable={false} />
          </div>
          <div>
            <FieldRow label="Role" value="Backend Engineer" editable={false} />
            <FieldRow label="Email" value="maya.putri@abhimeta.id" editable={false} />
            <FieldRow label="Buddy" value="Rizky Wijaya" editable={false} />
            <FieldRow label="Track length" value="6 months" />
            <FieldRow label="Pronouns" value="she/her" />
          </div>
        </div>
      </SectionCard>

      {/* 02 — Interface preferences */}
      <SectionCard
        seq="02"
        title="Interface preferences"
        subtitle="Applies just to this device. Switch back anytime — your data is unaffected."
      >
        <PrefRow
          label="Language"
          hint="Affects nav, module titles, assistant. Materials stay in their source language."
          control={
            <Segmented
              value={lang}
              onChange={setLang}
              options={[
                { value: 'id', label: 'Bahasa Indonesia' },
                { value: 'en', label: 'English' },
              ]}
            />
          }
        />
        <PrefRow
          label="Density"
          hint="Compact fits more on screen; comfortable is the default for new hires."
          control={
            <Segmented
              value={density}
              onChange={setDensity}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'spacious', label: 'Spacious' },
              ]}
            />
          }
        />
        <PrefRow
          label="Theme"
          hint="Auto follows your OS setting. Dark mode is in beta — some modules render in light."
          control={
            <Segmented
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'Light (default)' },
                { value: 'auto', label: 'Auto' },
                { value: 'dark', label: 'Dark · beta' },
              ]}
            />
          }
        />
        <PrefRow
          label="Brand accent"
          hint="Cosmetic only. Used for primary buttons and the progress bar."
          control={
            <div className="flex items-center gap-2">
              {accentColors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setAccent(c.key)}
                  style={{ backgroundColor: c.hex }}
                  className={`h-6 w-6 rounded-md border-2 ${
                    accent === c.key ? 'border-foreground' : 'border-transparent'
                  }`}
                  aria-label={c.key}
                />
              ))}
            </div>
          }
        />
      </SectionCard>

      {/* 03 — How we reach you */}
      <SectionCard
        seq="03"
        title="How we reach you"
        subtitle="Per-event delivery channel. We never send marketing — only onboarding-related."
        right={
          <button className="text-xs font-semibold text-emerald-700 hover:underline">
            Mute everything for a week →
          </button>
        }
      >
        <div className="flex items-center justify-between py-2 border-b text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span>Event</span>
          <span>Delivery</span>
        </div>
        {NOTIF_EVENTS.map((ev) => (
          <div key={ev.key} className="flex items-center justify-between gap-6 py-3.5 border-b last:border-b-0">
            <div className="min-w-0">
              <div className="text-sm font-medium">{ev.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{ev.hint}</div>
            </div>
            <Segmented
              value={notifValues[ev.key]}
              onChange={(v) => setNotif(ev.key, v)}
              options={ev.options}
            />
          </div>
        ))}
      </SectionCard>

      {/* 04 — Accessibility */}
      <SectionCard
        seq="04"
        title="Accessibility"
        subtitle="Changes apply immediately. Persisted to this account across devices."
      >
        <PrefRow
          label="Text size"
          hint="Scales body copy across the app. Module materials use their source size."
          control={
            <Segmented
              value={textSize}
              onChange={setTextSize}
              options={[
                { value: 'sm', label: 'A-' },
                { value: 'base', label: 'A' },
                { value: 'lg', label: 'A+' },
                { value: 'xl', label: 'A++' },
              ]}
            />
          }
        />
        <PrefRow
          label="Contrast"
          hint="High contrast meets WCAG AAA for body text."
          control={
            <Segmented
              value={contrast}
              onChange={setContrast}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'high', label: 'High' },
              ]}
            />
          }
        />
        <PrefRow
          label="Reduce motion"
          hint="Disables page transitions, sparkle effects, animated progress fills."
          control={<Toggle checked={reduceMotion} onChange={setReduceMotion} />}
        />
        <PrefRow
          label="Captions on by default"
          hint="Closed captions on for every module video. Languages: EN, ID, JP."
          control={<Toggle checked={captions} onChange={setCaptions} />}
        />
      </SectionCard>

      {/* 05 — Privacy & data */}
      <SectionCard
        seq="05"
        title="Privacy & data"
        subtitle="What others see, and how long we keep things. PII is auto-redacted everywhere in the assistant."
      >
        <PrefRow
          label="Who sees my progress"
          hint="HR sees a roll-up regardless — required for compliance reporting."
          control={
            <Segmented
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: 'just_me', label: 'Just me' },
                { value: 'manager_buddy', label: 'Manager + buddy' },
                { value: 'team', label: 'My team' },
              ]}
            />
          }
        />
        <PrefRow
          label="Assistant history retention"
          hint="After this window, only aggregate analytics remain. You can purge anytime."
          control={
            <Segmented
              value={retention}
              onChange={setRetention}
              options={[
                { value: 'session', label: 'This session only' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days (default)' },
              ]}
            />
          }
        />
        <PrefRow
          label="Show my avatar to peers"
          hint="Off shows initials only — on leaderboards and module discussions."
          control={<Toggle checked={showAvatar} onChange={setShowAvatar} />}
        />
        <PrefRow
          label="Submit feedback anonymously"
          hint="Always anonymous to your manager. HR sees aggregates by default."
          control={<Toggle checked={anonFeedback} onChange={setAnonFeedback} />}
        />
        <div className="flex flex-wrap gap-2 py-4">
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-1.5 hover:bg-muted/40">
            <Download className="h-3.5 w-3.5" />
            Download my data
          </button>
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-1.5 hover:bg-muted/40">
            <Activity className="h-3.5 w-3.5" />
            Activity log
          </button>
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-700 rounded-lg px-3 py-1.5 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
            Purge assistant history
          </button>
        </div>
      </SectionCard>

      {/* 06 — Sign-in & security */}
      <SectionCard
        seq="06"
        title="Sign-in & security"
        subtitle="SSO is the only path in. Backup methods help when SSO is unavailable on a trip."
      >
        <div className="grid grid-cols-2 gap-4 py-5 border-b">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
              Primary sign-in
            </div>
            <div className="text-sm font-semibold">Google Workspace SSO</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              maya.putri@abhimeta.id · last sign-in 4 min ago, Jakarta
            </div>
            <div className="text-xs font-semibold text-emerald-700 mt-2">✓ Active</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
              2-factor backup
            </div>
            <div className="text-sm font-semibold">Authenticator app</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Configured Mar 9. Codes refresh every 30 seconds.
            </div>
            <button className="text-xs font-semibold text-emerald-700 hover:underline mt-2">
              Regenerate backup codes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-5 border-b">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2">
              Connected accounts
            </div>
            <div className="space-y-2">
              {[
                { name: 'Slack', connected: true },
                { name: 'GitHub', connected: true },
                { name: 'Calendar', connected: true },
                { name: 'SharePoint', connected: false },
              ].map((acc) => (
                <div key={acc.name} className="flex items-center justify-between text-sm">
                  <span>{acc.name}</span>
                  <span className={acc.connected ? 'text-xs font-semibold text-emerald-700' : 'text-xs text-muted-foreground'}>
                    {acc.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/40 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
              Active sessions
            </div>
            <div className="text-sm font-semibold mb-1">3 devices</div>
            <div className="text-xs text-muted-foreground">
              MacBook, Jakarta · current. iPhone, Jakarta · 2h ago. Office desktop · last week.
            </div>
            <button className="text-xs font-semibold text-red-700 hover:underline mt-2">
              Sign out other devices
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-xl border bg-muted/20 px-6 py-4">
        <p className="text-xs text-muted-foreground max-w-sm">
          These settings are version-controlled. Every change is logged and reversible from the activity log.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline">Reset to defaults</Button>
          <Button>Save all changes</Button>
        </div>
      </div>
    </div>
  );
}