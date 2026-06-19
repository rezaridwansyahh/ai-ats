import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Static data — swap for API data when backend is ready ──

const INTEGRATION_GROUPS = [
  {
    title: 'Job boards',
    desc: 'Post openings and sync applicants automatically.',
    items: [
      { id: 'linkedin', name: 'LinkedIn Jobs', desc: 'Post & sync applicants', connected: true },
      { id: 'jobstreet', name: 'JobStreet', desc: 'Post & sync applicants', connected: true },
      { id: 'glints', name: 'Glints', desc: 'Post & sync applicants', connected: true },
      { id: 'kalibrr', name: 'Kalibrr', desc: 'Post & sync applicants', connected: true },
    ],
  },
  {
    title: 'Communication',
    desc: 'Tools for reaching candidates and running interviews.',
    items: [
      { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Send application updates', connected: true },
      { id: 'gmail', name: 'Gmail / Workspace', desc: 'Send & receive email', connected: true },
      { id: 'outlook', name: 'Outlook / 365', desc: 'Calendar + email', connected: false },
      { id: 'zoom', name: 'Zoom', desc: 'Video interviews', connected: true },
      { id: 'meet', name: 'Google Meet', desc: 'Video interviews', connected: true },
    ],
  },
  {
    title: 'Signing & verification',
    desc: 'Offer signatures and background checks.',
    items: [
      { id: 'docusign', name: 'DocuSign', desc: 'Offer letter e-signature', connected: true },
      { id: 'sertifikat', name: 'Sertifikat', desc: 'Ijazah verification (DIKTI)', connected: true },
      { id: 'bpjs', name: 'BPJS check', desc: 'Prior employment verification', connected: true },
    ],
  },
  {
    title: 'HRIS & downstream',
    desc: 'Where hired employees go after onboarding.',
    items: [
      { id: 'bamboohr', name: 'BambooHR', desc: 'Push hired employees', connected: true },
      { id: 'talenta', name: 'Talenta', desc: 'Push hired employees', connected: false },
      { id: 'mekari', name: 'Mekari', desc: 'Push hired employees', connected: false },
    ],
  },
];

// ── Integration row ──

function IntegrationRow({ item, onToggle }) {
  const initials = item.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-b-0">
      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
      </div>
      {item.connected ? (
        <Button variant="outline" size="sm" onClick={onToggle} className="gap-1.5">
          <Badge variant="outline" className="h-1.5 w-1.5 p-0 rounded-full bg-emerald-500 border-emerald-500" />
          Connected
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onToggle}>
          Connect
        </Button>
      )}
    </div>
  );
}

// ── Page ──

export default function IntegrationsSettings() {
  const [groups, setGroups] = useState(INTEGRATION_GROUPS);

  const toggleConnection = (groupTitle, itemId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.title !== groupTitle
          ? g
          : {
              ...g,
              items: g.items.map((it) =>
                it.id === itemId ? { ...it, connected: !it.connected } : it
              ),
            }
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Connect the tools your team already uses for sourcing, communication, signing, and
            downstream HR systems.
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex-shrink-0">
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Export config
        </Button>
      </div>

      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.desc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 divide-y">
            {group.items.map((item) => (
              <IntegrationRow
                key={item.id}
                item={item}
                onToggle={() => toggleConnection(group.title, item.id)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}