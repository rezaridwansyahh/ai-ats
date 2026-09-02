import { useState } from "react";
import { Upload, Download, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SectionCard({ seq, title, subtitle, right, children}){
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

function FieldRow({label, value, editable = true, onEdit}){
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

function Segmented({options, value, onChange}){
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

function Toggle({ checked, onChange}){
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-emerald-600' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function PrefRow({ label, hint, control }){
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

// Main Component
export default function Settings({ t }){
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
    </div>
  )
}