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
const PAY_TYPES    = ['Hourly', 'Monthly', 'Annually'];
const CURRENCIES   = ['AUD', 'HKD', 'IDR', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'USD'];
const DISPLAY_OPTS = ['Show', 'Hide'];

export function SeekFormDialog({ open, onOpenChange, userId, accounts = [], onSubmit, loading }) {
  const [accountId,   setAccountId]   = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [jobDesc,     setJobDesc]    = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [workOption,  setWorkOption]  = useState('');
  const [workType,    setWorkType]    = useState('');
  const [payType,     setPayType]     = useState('');
  const [currency,    setCurrency]    = useState('');
  const [min,         setMin]         = useState('');
  const [max,         setMax]         = useState('');
  const [display,     setDisplay]     = useState('');
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!open) return;
    setAccountId(accounts.length === 1 ? String(accounts[0].id) : '');
    setJobTitle('');
    setJobDesc('');
    setJobLocation('');
    setWorkOption('');
    setWorkType('');
    setPayType('');
    setCurrency('');
    setMin('');
    setMax('');
    setDisplay('');
    setError('');
  }, [open, accounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!accountId) { setError('Please select an account'); return; }
    if (!jobTitle.trim()) { setError('Job title is required'); return; }

    try {
      await onSubmit({
        user_id: userId,
        account_id: Number(accountId),
        service: 'seek',
        dataForm: {
          job_title:    jobTitle.trim(),
          job_desc:     jobDesc.trim()     || null,
          job_location: jobLocation.trim() || null,
          work_option:  workOption          || null,
          work_type:    workType            || null,
          pay_type:     payType             || null,
          currency:     currency            || null,
          pay_min:      min ? Number(min) : null,
          pay_max:      max ? Number(max) : null,
          pay_display:  display             || null,
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
          <DialogTitle>Create Seek Job Posting</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit a new Seek job posting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto flex-1 px-1">
          {/* ── Account Selection ── */}
          <div className="flex flex-col gap-2">
            <Label>Seek Account <span className="text-destructive">*</span></Label>
            {accounts.length === 0 ? (
              <p className="text-sm text-destructive">No Seek accounts found. Please add one first.</p>
            ) : (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ── Job Details ── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="seek-title">Job Title <span className="text-destructive">*</span></Label>
              <Input
                id="seek-title"
                placeholder="e.g. Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="seek-desc">Job Description</Label>
              <Textarea
                id="seek-desc"
                placeholder="Describe the role..."
                rows={3}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="seek-location">Location</Label>
              <Input
                id="seek-location"
                placeholder="e.g. Melbourne, VIC"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Work Option</Label>
                <Select value={workOption} onValueChange={setWorkOption}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select option" />
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
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Pay Details ── */}
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
                <Label htmlFor="seek-min">Min</Label>
                <Input
                  id="seek-min"
                  type="number"
                  placeholder="e.g. 60000"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="seek-max">Max</Label>
                <Input
                  id="seek-max"
                  type="number"
                  placeholder="e.g. 90000"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Display on Ad</Label>
              <Select value={display} onValueChange={setDisplay}>
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Posting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
