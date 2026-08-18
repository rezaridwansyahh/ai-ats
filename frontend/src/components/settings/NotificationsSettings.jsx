import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getSetting, saveSetting } from '@/api/setting.api';

// ── Defaults — used when no saved value exists yet for this company ──

const DEFAULT_EVENTS = [
  { id: 'new-application', name: 'New application', desc: 'When a candidate applies to a job you own', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'ai-screening', name: 'AI screening complete', desc: 'Batch finished scoring', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'feedback-due', name: 'Interview feedback due', desc: 'Scorecard overdue >24h', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'offer-response', name: 'Offer accepted / declined', desc: 'Candidate responds to offer', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'sla-breach', name: 'SLA breach', desc: 'Stage timer exceeded for your candidates', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'weekly-digest', name: 'Weekly digest', desc: 'Mondays 9am — pipeline summary', channels: { email: true, inApp: true, whatsapp: true } },
  { id: 'compliance-alert', name: 'Compliance alert', desc: 'Retention breach · DSR · consent expiry', channels: { email: true, inApp: true, whatsapp: true } },
];

const DEFAULT_QUIET_HOURS = true;
const DEFAULT_PAUSE_WEEKENDS = false;

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
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [quietHours, setQuietHours] = useState(DEFAULT_QUIET_HOURS);
  const [pauseWeekends, setPauseWeekends] = useState(DEFAULT_PAUSE_WEEKENDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchSetting = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getSetting('notifications');
      const saved = data.data || {};
      setEvents(saved.events?.length ? saved.events : DEFAULT_EVENTS);
      setQuietHours(saved.quietHours ?? DEFAULT_QUIET_HOURS);
      setPauseWeekends(saved.pauseWeekends ?? DEFAULT_PAUSE_WEEKENDS);
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSetting(); }, [fetchSetting]);

  const toggleChannel = (eventId, channel) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, channels: { ...e.channels, [channel]: !e.channels[channel] } }
          : e
      )
    );
    setDirty(true);
  };

  const handleQuietHours = (checked) => { setQuietHours(checked); setDirty(true); };
  const handlePauseWeekends = (checked) => { setPauseWeekends(checked); setDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting('notifications', { events, quietHours, pauseWeekends });
      toast.success('Notification preferences saved');
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Applies to your account · each teammate sets their own.
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || saving || loading} className="bg-teal-700 hover:bg-teal-800">
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : dirty ? <Save className="h-3.5 w-3.5 mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>

      <Card className="py-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <>
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
              <Switch checked={quietHours} onCheckedChange={handleQuietHours} />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm">Pause weekends</span>
              <Switch checked={pauseWeekends} onCheckedChange={handlePauseWeekends} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
