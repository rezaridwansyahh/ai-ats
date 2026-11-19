import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, MapPin, AlertTriangle, Eye, Home, Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from '@/components/ui/skeleton';

import { getJobAccountsByUserId } from '@/features/job-account/api/account.api';
import { getJobPostingByJobId } from '@/api/job-postings.api';

import linkedin from '@/assets/logos/linkedin.png';
import seek from '@/assets/logos/seek.png';
import glints from '@/assets/logos/glints.png';
import instagram from '@/assets/logos/instagram.png';
import facebook from '@/assets/logos/facebook.png';
import whatsapp from '@/assets/logos/whatsapp.png';

import JobPreviewModal from './JobPreviewModal';

const LOGOS = { linkedin, seek, glints, instagram, facebook, whatsapp };

const STATUS_COLORS = {
  Draft: 'bg-orange-50 text-orange-600 border-orange-200',
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Running: 'bg-blue-50 text-blue-600 border-blue-200',
  Expired: 'bg-gray-50 text-gray-500 border-gray-200',
  Failed: 'bg-red-50 text-red-500 border-red-200',
  Blocked: 'bg-gray-50 text-gray-500 border-gray-200',
};

const PORTAL_NAMES = {
  linkedin: 'LinkedIn',
  seek: 'Seek',
  glints: 'Glints',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
};

// ── Component ────────────────────────────────────────────────────────

export default function JobPosting({ selectedJob, onSelectionChange }) {
  const [group, setGroup] = useState(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [jobPost,  setJobPost]  = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);

  const toggleAccount = (accountId) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    );
  };

  const toggleGroup = (value) => {
    setGroup(value);
    setSelectedAccountIds([]);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accounts = await getJobAccountsByUserId();
      setAccounts(accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load job accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobSourcing = useCallback(async () => {
    if (selectedJob?.status !== 'Active') {
      setJobPost([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await getJobPostingByJobId(selectedJob.id);
      setJobPost(data.jobPosts || []);
    } catch(err) {
      setError(err.response?.data?.message || err.message || 'Failed to load job post');
    } finally {
      setLoading(false);
    }
  }, [selectedJob?.id, selectedJob?.status]);

  // Bubble selection up to the parent — the actual publish action happens
  // when the "Publish Job" button is clicked, not from this component.
  useEffect(() => {
    if (!onSelectionChange) return;
    if (group !== 'channels') {
      onSelectionChange([]);
      return;
    }
    const selection = accounts
      .filter(acc => selectedAccountIds.includes(acc.id))
      .map(acc => ({ platform: acc.portal_name, account_id: acc.id }));
    onSelectionChange(selection);
  }, [group, accounts, selectedAccountIds, onSelectionChange]);

  useEffect(() => {
    fetchAccounts();
    fetchJobSourcing();
  }, [fetchAccounts, fetchJobSourcing]);

  // Prefill selection from existing job_post when job is Active
  useEffect(() => {
    if (selectedJob?.status !== 'Active' || !Array.isArray(jobPost) || jobPost.length === 0) return;

    const hasInternal = jobPost.some(p => p.type === 'Internal' || p.platform === 'internal');
    const postedPlatforms = jobPost.map(p => p.platform).filter(p => p && p !== 'internal');

    if (hasInternal && postedPlatforms.length === 0) {
      setGroup('internal');
      return;
    }

    setGroup('channels');
    setSelectedAccountIds(
      accounts.filter(acc => postedPlatforms.includes(acc.portal_name)).map(acc => acc.id)
    );
  }, [jobPost, accounts, selectedJob?.status]);

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
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest">STEP 4</span>
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

      <RadioGroup value={group} onValueChange={toggleGroup}>
        {/* ── Internal Hire Only ── */}
        <Card className="py-0 gap-0">
          <CardContent className="py-3.5 px-5">
            <label htmlFor="internal">
              <div className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value="internal" className="cursor-pointer" id="internal"/>
                <Home className="h-4 w-4 text-primary" />
                <div>
                  <span className="text-xs font-bold">Internal Hire Only</span>
                  <p className="text-[10px] text-muted-foreground">Source from talent pool — no external posting</p>
                </div>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* ── Publish to Connected Accounts ── */}
        <Card className="py-0 gap-0">
          <CardHeader className="py-3 px-5">
            <label htmlFor="channels">
              <div className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value="channels" className="cursor-pointer" id="channels"/>
                <Globe className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-[13px] font-bold">Publish to Connected Accounts</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Choose which connected job account(s) to post this job to</p>
                </div>
              </div>
            </label>
          </CardHeader>
          {group === 'channels' && (
            <CardContent className="px-0 py-0">
              {loading ? (
                <div className="p-4 space-y-3 border-t">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center border-t">
                  No job accounts connected yet. Connect one in Settings &rarr; Integrations.
                </div>
              ) : (
                <div className="border-t">
                  {accounts.map(account => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      jobPost={jobPost}
                      isSelected={selectedAccountIds.includes(account.id)}
                      onToggle={() => toggleAccount(account.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </RadioGroup>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button variant="outline" className="text-xs h-9" onClick={() => setPreviewOpen(true)}>
        <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
      </Button>

      <JobPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        job={selectedJob}
      />

    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function AccountRow({ account, jobPost, isSelected, onToggle }) {
  const name = PORTAL_NAMES[account.portal_name] || account.portal_name;
  const jobPosted = jobPost?.find(jp => jp.platform === account.portal_name);
  const connected = account.status_connection === 'Connected';

  return (
    <div className="flex flex-col gap-3 w-full px-4 py-3 border-b last:border-b-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Checkbox
          checked={isSelected}
          disabled={!connected}
          onCheckedChange={onToggle}
        />
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-muted/40">
          <img src={LOGOS[account.portal_name]} alt={name} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 sm:w-44 sm:shrink-0">
          <span className="text-sm font-semibold">{name}</span>
          <div className="text-[11px] text-muted-foreground truncate" title={account.email || ''}>
            Account: {account.email || '—'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 ${
            connected
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : account.status_connection === 'Re-connecting'
                ? 'bg-gray-50 text-gray-600 border-gray-200'
                : 'bg-red-50 text-red-600 border-red-200'
          }`}
        >
          {account.status_connection === 'Re-connecting' ? 'Re-connecting…' : (account.status_connection || 'Not connected')}
        </Badge>

        {jobPosted && (
          <Badge className={`text-[10px] px-2 py-0.5 ${STATUS_COLORS[jobPosted.status] || ''}`}>
            {jobPosted.status}
          </Badge>
        )}
      </div>
    </div>
  );
}
