import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const WORK_OPTIONS = ['On-site', 'Hybrid', 'Remote'];
const WORK_TYPES   = ['Full-time', 'Part-time', 'Contract', 'Casual'];
const STATUSES     = ['Draft', 'Submitted', 'Running', 'Expired'];
const PAY_TYPES    = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES   = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const DISPLAY_OPTS = ['Show', 'Hide'];

export function JobPostingEditDialog({ open, onOpenChange, posting, userId, onSubmit, loading }) {
  const [jobTitle,    setJobTitle]    = useState('');
  const [jobDesc,     setJobDesc]     = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [workOption,  setWorkOption]  = useState('');
  const [workType,    setWorkType]    = useState('');
  const [status,      setStatus]      = useState('');
  // Seek pay fields
  const [currency,    setCurrency]    = useState('');
  const [payType,     setPayType]     = useState('');
  const [payMin,      setPayMin]      = useState('');
  const [payMax,      setPayMax]      = useState('');
  const [payDisplay,  setPayDisplay]  = useState('');
  const [error,       setError]       = useState('');

  const isSeek = posting?.platform === 'seek';

  useEffect(() => {
    if (!open || !posting) return;
    setJobTitle(posting.job_title || '');
    setJobDesc(posting.job_desc || '');
    setJobLocation(posting.job_location || '');
    setWorkOption(posting.work_option || '');
    setWorkType(posting.work_type || '');
    setStatus(posting.status || '');
    setCurrency(posting.currency || '');
    setPayType(posting.pay_type || '');
    setPayMin(posting.pay_min != null ? String(posting.pay_min) : '');
    setPayMax(posting.pay_max != null ? String(posting.pay_max) : '');
    setPayDisplay(posting.pay_display || '');
    setError('');
  }, [open, posting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!jobTitle.trim()) { setError('Job title is required'); return; }

    try {
      await onSubmit({
        job_posting_id: posting.id,
        user_id: userId,
        account_id: posting.account_id,
        service: 'seek',
        dataForm: {
          job_title:    jobTitle.trim(),
          job_desc:     jobDesc.trim()     || null,
          job_location: jobLocation.trim() || null,
          work_option:  workOption          || null,
          work_type:    workType            || null,
          pay_type:     payType             || null,
          currency:     currency            || null,
          pay_min:      payMin ? Number(payMin) : null,
          pay_max:      payMax ? Number(payMax) : null,
          pay_display:  payDisplay          || null,
        },
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Job Posting</DialogTitle>
          <DialogDescription>Update the posting details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto flex-1 px-1">
          {/* ── Job Details ── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-title">Job Title <span className="text-destructive">*</span></Label>
              <Input
                id="edit-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-desc">Job Description</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Work Option</Label>
                <Select value={workOption} onValueChange={setWorkOption}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Work Type</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Pay Details (Seek only) ── */}
          {isSeek && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-muted-foreground">Pay Details</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Pay Type</Label>
                  <Select value={payType} onValueChange={setPayType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select pay type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_TYPES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-min">Min</Label>
                  <Input
                    id="edit-min"
                    type="number"
                    placeholder="e.g. 60000"
                    value={payMin}
                    onChange={(e) => setPayMin(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-max">Max</Label>
                  <Input
                    id="edit-max"
                    type="number"
                    placeholder="e.g. 90000"
                    value={payMax}
                    onChange={(e) => setPayMax(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Display on Ad</Label>
                <Select value={payDisplay} onValueChange={setPayDisplay}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPLAY_OPTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
