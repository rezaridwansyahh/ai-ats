import { useState, useEffect } from 'react';
import {
  Briefcase, MapPin, AlertTriangle, Eye, Save, Rocket,
  Info, BarChart3, ChevronDown, Globe, Lock, Home,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ── Constants ────────────────────────────────────────────────────────

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

const INITIAL_PUBLIC = [
  { id: 'linkedin',  name: 'LinkedIn',  badge: 'in', color: '#0A66C2', published: false, maxApplicants: '' },
  { id: 'jobstreet', name: 'JobStreet', badge: 'JS', color: '#5843BE', published: false, maxApplicants: '' },
  { id: 'kalibrr',   name: 'Kalibrr',   badge: 'K',  color: '#E91E63', published: false, maxApplicants: '' },
  { id: 'glints',    name: 'Glints',    badge: 'G',  color: '#0A6E5C', published: false, maxApplicants: '' },
];

const INITIAL_PRIVATE = [
  { id: 'instagram', name: 'Instagram', badge: 'IG', color: null,      published: false },
  { id: 'facebook',  name: 'Facebook',  badge: 'FB', color: '#1877F2', published: false },
  { id: 'whatsapp',  name: 'WhatsApp',  badge: 'WA', color: '#25D366', published: false },
];

const PERFORMANCE_DATA = [
  { channel: 'LinkedIn',    apps: 128, aiScore: '82%', cost: 'Rp 45K' },
  { channel: 'JobStreet',   apps: 96,  aiScore: '74%', cost: 'Rp 32K' },
  { channel: 'Glints',      apps: 67,  aiScore: '68%', cost: 'Free' },
  { channel: 'Career Page', apps: 21,  aiScore: '79%', cost: 'Free' },
];

// ── Component ────────────────────────────────────────────────────────

export default function JobPosting({ selectedJob, onSelectionChange }) {
  const [groups, setGroups] = useState({ public: false, private: false, internal: false });
  const [publicChannels, setPublicChannels] = useState(INITIAL_PUBLIC);
  const [privateChannels, setPrivateChannels] = useState(INITIAL_PRIVATE);

  const toggleGroup = (key) => {
    setGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updatePublic = (id, field, value) => {
    setPublicChannels(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const updatePrivate = (id, field, value) => {
    setPrivateChannels(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const handlePublishAll = () => {
    if (groups.public) setPublicChannels(prev => prev.map(ch => ({ ...ch, published: true })));
    if (groups.private) setPrivateChannels(prev => prev.map(ch => ({ ...ch, published: true })));
  };

  // Notify parent of selection changes
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange({
      public: {
        enabled: groups.public,
        channels: groups.public ? publicChannels.filter(c => c.published).map(c => c.name) : [],
      },
      private: {
        enabled: groups.private,
        channels: groups.private ? privateChannels.filter(c => c.published).map(c => c.name) : [],
      },
      internal: {
        enabled: groups.internal,
      },
    });
  }, [groups, publicChannels, privateChannels, onSelectionChange]);

  // Guard
  if (!selectedJob) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold mb-1">No Job Selected</h3>
        <p className="text-sm text-muted-foreground">Go back to Job Creation and select a job first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Selected Job Banner ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{selectedJob.job_title}</h3>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 ${STATUS_COLORS[selectedJob.status] || ''}`}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {selectedJob.job_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.job_location}</span>}
                  {selectedJob.work_type && <span>{selectedJob.work_type}</span>}
                  {selectedJob.work_option && <span>{selectedJob.work_option}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 3</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Prerequisite Warning ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border-l-[3px] border-amber-400 bg-amber-50/60 text-[11px] text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          <strong>Prerequisite:</strong> Recruitment channels must be connected in{' '}
          <span className="text-primary font-semibold cursor-pointer underline">Settings &rarr; Integrations</span>{' '}
          before first use.
        </span>
      </div>

      {/* ── Internal Hire Only Card ── */}
      <Card className="pt-0 gap-0">
        <CardContent className="py-3.5 px-5">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => toggleGroup('internal')}
          >
            <Checkbox checked={groups.internal} onCheckedChange={() => toggleGroup('internal')} onClick={e => e.stopPropagation()} />
            <Home className="h-4 w-4 text-primary" />
            <div>
              <span className="text-xs font-bold">Internal Hire Only</span>
              <p className="text-[10px] text-muted-foreground">Source from talent pool — no external posting</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Publish to Channels Card ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5">
          <div>
            <CardTitle className="text-[13px] font-bold">Publish to Channels</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">Select visibility groups to publish your job posting</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Quota info banner */}
          <div className="flex items-center gap-2 mx-5 mb-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-[10px] text-muted-foreground">
              You can set per-channel applicant quotas. Once the quota is reached, the channel stops accepting applications for this job.
            </p>
          </div>

          {/* ── Group 1: Public ── */}
          <VisibilityGroup
            checked={groups.public}
            onToggle={() => toggleGroup('public')}
            label="Public"
            subtitle="Publish to job boards — visible in search results"
            icon={<Globe className="h-4 w-4" />}
            indicatorColor="bg-emerald-500"
          >
            {publicChannels.map(ch => (
              <ChannelRow
                key={ch.id}
                channel={ch}
                showQuota
                onPublish={() => updatePublic(ch.id, 'published', true)}
                onQuotaChange={v => updatePublic(ch.id, 'maxApplicants', v)}
                actionLabel="Publish"
              />
            ))}
          </VisibilityGroup>

          {/* ── Group 2: Private ── */}
          <VisibilityGroup
            checked={groups.private}
            onToggle={() => toggleGroup('private')}
            label="Private"
            subtitle="Share via social media — direct link only, not indexed"
            icon={<Lock className="h-4 w-4" />}
            indicatorColor="bg-amber-500"
          >
            {privateChannels.map(ch => (
              <ChannelRow
                key={ch.id}
                channel={ch}
                showQuota={false}
                onPublish={() => updatePrivate(ch.id, 'published', true)}
                actionLabel={ch.id === 'whatsapp' ? 'Broadcast' : 'Share'}
              />
            ))}
          </VisibilityGroup>
        </CardContent>
      </Card>

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-[1fr_1fr_2fr] gap-3">
        <Button variant="outline" className="text-xs h-9" onClick={() => alert('Preview coming soon')}>
          <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
        </Button>
        <Button variant="outline" className="text-xs h-9" onClick={() => alert('Draft saved (placeholder)')}>
          <Save className="h-3.5 w-3.5 mr-1.5" /> Save as Draft
        </Button>
        <Button className="text-xs h-9" onClick={handlePublishAll}>
          <Rocket className="h-3.5 w-3.5 mr-1.5" /> Publish to All Channels
        </Button>
      </div>

      {/* ── Info Note ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Myralix automatically customizes the job information form to suit each channel's requirements (e.g., LinkedIn format, JobStreet fields). You can publish to all channels simultaneously or selectively.
        </p>
      </div>

      {/* ── Channel Performance Insights ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[13px] font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Channel Performance Insights
            </CardTitle>
            <span className="text-[10px] text-muted-foreground">After 48+ hours of posting &middot; Based on this job</span>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold">CHANNEL</TableHead>
                <TableHead className="text-[10px] font-bold text-right">APPLICATIONS RECEIVED</TableHead>
                <TableHead className="text-[10px] font-bold text-right">AVG AI SCORE</TableHead>
                <TableHead className="text-[10px] font-bold text-right">COST / APPLICATION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERFORMANCE_DATA.map(row => (
                <TableRow key={row.channel}>
                  <TableCell className="text-xs font-medium text-primary">{row.channel}</TableCell>
                  <TableCell className="text-xs text-right">{row.apps}</TableCell>
                  <TableCell className="text-xs text-right text-primary font-semibold">{row.aiScore}</TableCell>
                  <TableCell className="text-xs text-right">{row.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-[10px] text-primary font-semibold mt-3">
            LinkedIn delivers the highest quality candidates (82% avg AI score). Detailed analytics available in{' '}
            <span className="underline cursor-pointer">Reports & Analytics &rarr; Channel Analytics</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function VisibilityGroup({ checked, onToggle, label, subtitle, icon, indicatorColor, children }) {
  return (
    <Collapsible open={checked} className="border-t">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${checked ? 'bg-muted/40' : 'hover:bg-muted/20'}`}
        onClick={onToggle}
      >
        <div className={`h-2 w-2 rounded-full shrink-0 ${indicatorColor}`} />
        <Checkbox checked={checked} onCheckedChange={onToggle} onClick={e => e.stopPropagation()} />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-muted-foreground">{icon}</span>
          <div>
            <span className="text-xs font-bold">{label}</span>
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${checked ? 'rotate-180' : ''}`} />
      </div>
      <CollapsibleContent>
        <div className="border-t bg-muted/10">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChannelRow({ channel: ch, showQuota, onPublish, onQuotaChange, actionLabel }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b last:border-b-0">
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={
          ch.id === 'instagram'
            ? { background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)' }
            : { background: ch.color || '#666' }
        }
      >
        {ch.badge}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold">{ch.name}</span>
        <div className="mt-0.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">Connected</Badge>
        </div>
      </div>
      {showQuota && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Max applicants:</span>
          <Input
            type="number"
            placeholder="∞"
            value={ch.maxApplicants}
            onChange={e => onQuotaChange?.(e.target.value)}
            className="w-16 h-8 text-xs text-center"
          />
        </div>
      )}
      {ch.published ? (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-3 py-1">Published</Badge>
      ) : (
        <Button size="sm" className="text-[11px] h-8 px-4" onClick={onPublish}>{actionLabel}</Button>
      )}
    </div>
  );
}
