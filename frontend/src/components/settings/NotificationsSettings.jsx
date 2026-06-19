import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// ── Static data — swap for API data when backend is ready ──

const NOTIFICATION_EVENTS = [
  { id: 'new-application', name: 'New application', desc: 'When a candidate applies to a job you own', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'ai-screening', name: 'AI screening complete', desc: 'Batch finished scoring', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'feedback-due', name: 'Interview feedback due', desc: 'Scorecard overdue >24h', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'offer-response', name: 'Offer accepted / declined', desc: 'Candidate responds to offer', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'sla-breach', name: 'SLA breach', desc: 'Stage timer exceeded for your candidates', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'weekly-digest', name: 'Weekly digest', desc: 'Mondays 9am — pipeline summary', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'compliance-alert', name: 'Compliance alert', desc: 'Retention breach · DSR · consent expiry', channels: { email: true, inApp: true, whatsapp: true } },
];

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'inApp', label: 'In-app' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

// ── Channel pill ──

function ChannelPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
        active
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          : 'bg-background border-input text-muted-foreground hover:bg-muted/50'
      }`}
    >
      {label}
    </button>
  );
}

// ── Event row ──

function EventRow({ event, onToggleChannel }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{event.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{event.desc}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {CHANNELS.map((c) => (
          <ChannelPill
            key={c.key}
            label={c.label}
            active={event.channels[c.key]}
            onClick={() => onToggleChannel(event.id, c.key)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ──

export default function NotificationsSettings() {
  const [events, setEvents] = useState(NOTIFICATION_EVENTS);
  const [quietHours, setQuietHours] = useState(true);
  const [pauseWeekends, setPauseWeekends] = useState(false);

  const toggleChannel = (eventId, channel) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, channels: { ...e.channels, [channel]: !e.channels[channel] } }
          : e
      )
    );
  };

  return (
    <div className="space-y-4">
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notification preferences</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applies to your account · each teammate sets their own.
          </p>
        </div>

        <div className="flex items-center px-4 py-2 bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="flex-1">Event</span>
          <span className="flex-shrink-0">Channels</span>
        </div>

        <div>
          {events.map((event) => (
            <EventRow key={event.id} event={event} onToggleChannel={toggleChannel} />
          ))}
        </div>

        <div className="px-4 py-3 border-t">
          <p className="text-sm font-semibold">Quiet hours</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pause all non-critical notifications during these hours.
          </p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm">Enable quiet hours (22:00–07:00 WIB)</span>
          <Switch checked={quietHours} onCheckedChange={setQuietHours} />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm">Pause weekends</span>
          <Switch checked={pauseWeekends} onCheckedChange={setPauseWeekends} />
        </div>
      </Card>
    </div>
  );
}