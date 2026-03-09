import { useState, useEffect, useCallback } from 'react';
import {
  Search, Users, Briefcase, Loader2, X,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge }    from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { TagInput } from '@/components/linkedin-sourcing/TagInput';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';
import { recruiteSearch } from '@/api/linkedin.api';

export default function CandidateSearchPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // ── Accounts ──
  const [accounts, setAccounts]   = useState([]);
  const [accountId, setAccountId] = useState('');

  // ── Form fields ──
  const [jobTitle, setJobTitle]     = useState([]);
  const [location, setLocation]     = useState([]);
  const [skill, setSkill]           = useState([]);
  const [company, setCompany]       = useState([]);
  const [school, setSchool]         = useState([]);
  const [yearsGrad, setYearsGrad]   = useState('');
  const [industry, setIndustry]     = useState([]);
  const [keywords, setKeywords]     = useState('');

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [result, setResult]         = useState(null);

  // ── Candidates (empty for now) ──
  const [candidates] = useState([]);

  // ── Fetch linkedin accounts ──
  const fetchAccounts = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await getJobAccountsByUserId(userId);
      setAccounts((data.accounts || []).filter(a => a.portal_name === 'linkedin'));
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  }, [userId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // Auto-select account if only one
  useEffect(() => {
    if (accounts.length === 1) setAccountId(String(accounts[0].id));
  }, [accounts]);

  // ── Reset form ──
  const resetForm = () => {
    setJobTitle([]);
    setLocation([]);
    setSkill([]);
    setCompany([]);
    setSchool([]);
    setYearsGrad('');
    setIndustry([]);
    setKeywords('');
    setFormError('');
    setResult(null);
  };

  // ── Submit search ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setResult(null);

    if (!accountId) {
      setFormError('Please select a LinkedIn account');
      return;
    }

    // Filter out empty rows from tag inputs
    const clean = (arr) => arr.map((s) => s.trim()).filter(Boolean);
    const cJobTitle  = clean(jobTitle);
    const cLocation  = clean(location);
    const cSkill     = clean(skill);
    const cCompany   = clean(company);
    const cSchool    = clean(school);
    const cIndustry  = clean(industry);

    // At least one field must be filled
    const hasAnyField = cJobTitle.length > 0 || cLocation.length > 0 || cSkill.length > 0 ||
      cCompany.length > 0 || cSchool.length > 0 || yearsGrad.trim() ||
      cIndustry.length > 0 || keywords.trim();

    if (!hasAnyField) {
      setFormError('Please fill at least one search field');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        account_id: Number(accountId),
        dataForm: {
          ...(cJobTitle.length > 0 && { job_titles: cJobTitle }),
          ...(cLocation.length > 0 && { locations: cLocation }),
          ...(cSkill.length > 0 && { skills: cSkill }),
          ...(cCompany.length > 0 && { companies: cCompany }),
          ...(cSchool.length > 0 && { schools: cSchool }),
          ...(yearsGrad.trim() && { year_grads: yearsGrad.trim() }),
          ...(cIndustry.length > 0 && { industries: cIndustry }),
          ...(keywords.trim() && { keywords: keywords.trim() }),
        },
      };

      const { data } = await recruiteSearch(payload);
      setResult(data);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Search failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Search className="h-5 w-5 text-[#0A66C2]" />
            Candidate Search
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search for candidates on LinkedIn Recruiter using advanced filters. Max 5 values per field.
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" />
            Candidate Search
          </CardTitle>
          <CardDescription className="text-xs">
            Fill in the filters below to search for candidates via LinkedIn Recruiter RPA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Selection */}
            <div className="flex flex-col gap-2">
              <Label>LinkedIn Account <span className="text-destructive">*</span></Label>
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No LinkedIn accounts found. Add one in{' '}
                  <a href="/job-postings/account" className="text-primary underline">Integrations</a>.
                </p>
              ) : (
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select LinkedIn account" />
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

            {/* Tag-based fields: 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Job Titles</Label>
                <TagInput
                  value={jobTitle}
                  onChange={setJobTitle}
                  placeholder="e.g. Frontend Developer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Locations</Label>
                <TagInput
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g. Jakarta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Skills</Label>
                <TagInput
                  value={skill}
                  onChange={setSkill}
                  placeholder="e.g. JavaScript"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Companies</Label>
                <TagInput
                  value={company}
                  onChange={setCompany}
                  placeholder="e.g. Bank Central Asia"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Schools</Label>
                <TagInput
                  value={school}
                  onChange={setSchool}
                  placeholder="e.g. Binus"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Year of Graduation</Label>
                <Input
                  value={yearsGrad}
                  onChange={(e) => setYearsGrad(e.target.value)}
                  placeholder="e.g. 2022 - 2025"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Industries</Label>
                <TagInput
                  value={industry}
                  onChange={setIndustry}
                  placeholder="e.g. Software Engineering"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Keywords</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. IT and software"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            {result && (
              <div className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                <Badge variant="outline" className="border-green-500 text-green-600">Success</Badge>
                Search executed successfully via RPA.
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button type="submit" disabled={submitting || !accountId}>
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    Search Candidates
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Candidates Table (empty for now) */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Extracted Candidates
          </CardTitle>
          <CardDescription className="text-xs">
            Candidates extracted from LinkedIn Recruiter search results will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <div className="rounded-full bg-muted p-4">
                <Briefcase className="h-8 w-8 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">No candidates yet</p>
                <p className="text-xs mt-1 max-w-sm">
                  Run a candidate search above. Extracted candidates from LinkedIn Recruiter will be displayed in this table.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Position</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.last_position}</TableCell>
                      <TableCell>{c.address}</TableCell>
                      <TableCell>{c.education}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.candidate_status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.date ? new Date(c.date).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
