import { useState } from 'react';
import {
  Briefcase, MapPin, AlertTriangle, Eye, Save, Rocket,
  Info, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

const DEFAULT_CHANNELS = [
  { id: 'linkedin',  name: 'LinkedIn',  badge: 'in', color: '#0A66C2', type: 'job_board', connected: true, published: false, maxApplicants: '' },
  { id: 'jobstreet', name: 'JobStreet', badge: 'JS', color: '#5843BE', type: 'job_board', connected: true, published: false, maxApplicants: '' },
  { id: 'kalibrr',   name: 'Kalibrr',   badge: 'K',  color: '#E91E63', type: 'job_board', connected: true, published: false, maxApplicants: '' },
  { id: 'glints',    name: 'Glints',    badge: 'G',  color: '#0A6E5C', type: 'job_board', connected: true, published: false, maxApplicants: '' },
  { id: 'instagram', name: 'Instagram', badge: 'IG', color: null,      type: 'social',    connected: true, published: false, maxApplicants: '' },
  { id: 'facebook',  name: 'Facebook',  badge: 'FB', color: '#1877F2', type: 'social',    connected: true, published: false, maxApplicants: '' },
  { id: 'whatsapp',  name: 'WhatsApp',  badge: 'WA', color: '#25D366', type: 'social',    connected: true, published: false, maxApplicants: '' },
];

const PERFORMANCE_DATA = [
  { channel: 'LinkedIn',    apps: 128, aiScore: '82%', cost: 'Rp 45K' },
  { channel: 'JobStreet',   apps: 96,  aiScore: '74%', cost: 'Rp 32K' },
  { channel: 'Glints',      apps: 67,  aiScore: '68%', cost: 'Free' },
  { channel: 'Career Page', apps: 21,  aiScore: '79%', cost: 'Free' },
];

// ── Component ────────────────────────────────────────────────────────

export default function JobPosting({ selectedJob }) {
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);

  const updateChannel = (id, field, value) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const handlePublish = (id) => {
    updateChannel(id, 'published', true);
  };

  const handlePublishAll = () => {
    setChannels(prev => prev.map(ch => ({ ...ch, published: true })));
  };

  // ── No job selected guard ──
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

      {/* ── Section A: Selected Job Banner ── */}
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
                  {selectedJob.job_location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.job_location}</span>
                  )}
                  {selectedJob.work_type && <span>{selectedJob.work_type}</span>}
                  {selectedJob.work_option && <span>{selectedJob.work_option}</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 3</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Section B: Prerequisite Warning ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border-l-[3px] border-amber-400 bg-amber-50/60 text-[11px] text-muted-foreground">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          <strong>Prerequisite:</strong> Recruitment channels must be connected in{' '}
          <span className="text-primary font-semibold cursor-pointer underline">Settings &rarr; Integrations</span>{' '}
          before first use. API credentials for job boards and social media authorization are required.
        </span>
      </div>

      {/* ── Section C: Publish to Channels ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5">
          <div>
            <CardTitle className="text-[13px] font-bold">Publish to Channels</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">Select channels to publish your job posting</p>
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

          {/* Channel rows */}
          <div className="flex flex-col">
            {channels.map(ch => (
              <div key={ch.id} className="flex items-center gap-3 px-5 py-3 border-t">
                {/* Badge */}
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

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold">{ch.name}</span>
                  <div className="mt-0.5">
                    {ch.connected ? (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-gray-50 text-gray-400 border-gray-200">
                        Not Connected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Max applicants (job boards only) */}
                {ch.type === 'job_board' && (
                  <Input
                    type="number"
                    placeholder="&infin;"
                    value={ch.maxApplicants}
                    onChange={e => updateChannel(ch.id, 'maxApplicants', e.target.value)}
                    className="w-28 h-8 text-xs text-center"
                    title="Max applicants"
                  />
                )}

                {/* Action button */}
                {ch.published ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-3 py-1">
                    Published
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant={ch.type === 'social' ? 'outline' : 'default'}
                    className="text-[11px] h-8 px-4"
                    onClick={() => handlePublish(ch.id)}
                  >
                    {ch.type === 'job_board' && 'Publish'}
                    {ch.id === 'whatsapp' && 'Broadcast'}
                    {ch.type === 'social' && ch.id !== 'whatsapp' && 'Share'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section D: Action Buttons ── */}
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

      {/* ── Section E: Info Note ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Myralix automatically customizes the job information form to suit each channel's requirements.
        </p>
      </div>

      {/* ── Section F: Channel Performance Insights ── */}
      <Card className="pt-0 gap-0">
        <CardHeader className="py-3 px-5">
          <div>
            <CardTitle className="text-[13px] font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Channel Performance Insights
            </CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">After 48+ hours of posting &middot; Based on this job</p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold">CHANNEL</TableHead>
                <TableHead className="text-[10px] font-bold text-right">APPLICATIONS</TableHead>
                <TableHead className="text-[10px] font-bold text-right">AVG AI SCORE</TableHead>
                <TableHead className="text-[10px] font-bold text-right">COST / APP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERFORMANCE_DATA.map(row => (
                <TableRow key={row.channel}>
                  <TableCell className="text-xs font-medium">{row.channel}</TableCell>
                  <TableCell className="text-xs text-right">{row.apps}</TableCell>
                  <TableCell className="text-xs text-right">{row.aiScore}</TableCell>
                  <TableCell className="text-xs text-right">{row.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-[10px] text-primary font-semibold mt-3">
            LinkedIn delivers the highest quality candidates (82% avg AI score).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
