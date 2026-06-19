import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { JobBanner } from '@/components/source-management/JobBanner';
import { getAll } from '@/api/applicant.api';

const PLATFORM_OPTIONS = ['linkedin', 'seek', 'internal'];
const PAGE_SIZE = 10;

// ── Dummy data — shown when API returns empty ──────────────────────
const DUMMY_APPLICANTS = [
  { id: 1, name: 'Ayu Pratiwi',    address: 'Jakarta, Indonesia',   last_position: 'Frontend Engineer', education: 'Universitas Indonesia' },
  { id: 2, name: 'Budi Santoso',   address: 'Bandung, Indonesia',   last_position: 'UI Engineer',        education: 'Institut Teknologi Bandung' },
  { id: 3, name: 'Citra Lestari',  address: 'Singapore',            last_position: 'Product Designer',  education: 'NUS' },
  { id: 4, name: 'Dewi Anggraini', address: 'Jakarta, Indonesia',   last_position: 'Frontend Developer', education: 'Universitas Gadjah Mada' },
  { id: 5, name: 'Eko Nugroho',    address: 'Surabaya, Indonesia',  last_position: 'React Engineer',     education: 'Politeknik Elektronika Negeri Surabaya' },
];

export default function ListCandidate({ selectedJob }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(false);

  const [searchQuery, setSearchQuery]       = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [page, setPage]                     = useState(1);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAll();
      const data = res.data.applicants || [];
      // Fall back to dummy data so the UI isn't blank during development
      setApplicants(data.length > 0 ? data : DUMMY_APPLICANTS);
    } catch {
      setApplicants(DUMMY_APPLICANTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  // ── Filter — platformFilter now actually applied ───────────────
  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch =
        !searchQuery ||
        applicant.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform =
        platformFilter === 'all' || applicant.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [applicants, searchQuery, platformFilter]);

  const totalPages        = Math.ceil(filteredApplicants.length / PAGE_SIZE);
  const paginatedApplicants = filteredApplicants.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [searchQuery, platformFilter]);

  return (
    <div className="space-y-5">

      {/* Job context banner */}
      <JobBanner job={selectedJob} step={4} />

      {/* Threshold display — read-only, value set in SourceSetup (Step 3) */}
      {/* TODO: receive threshold range as a prop from SourceManagementPage
          once Step 3 saves to state/backend */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm">Threshold Score</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Candidates within this AI screening score range will appear below.
            Adjust the range in Step 3.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1 min-w-[64px]">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Min</span>
              <span className="text-lg font-bold text-primary">70</span>
            </div>
            <div className="flex-1">
              <Slider
                value={[70, 100]}
                min={0}
                max={100}
                step={1}
                disabled
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-muted-foreground">0</span>
                <span className="text-[9px] text-muted-foreground">50</span>
                <span className="text-[9px] text-muted-foreground">100</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[64px]">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Max</span>
              <span className="text-lg font-bold text-primary">100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applicants table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm shrink-0">
              All Applicants
              {!loading && (
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {filteredApplicants.length} {filteredApplicants.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-[250px] text-xs"
              />
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[150px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {PLATFORM_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase pl-6 w-[20%]">Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[20%]">Address</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[25%]">Last Position</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase w-[25%]">Education</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-right pr-6 w-[10%]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : paginatedApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                      {applicants.length === 0
                        ? 'No applicants found.'
                        : 'No applicants match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : paginatedApplicants.map(applicant => (
                  <TableRow
                    key={applicant.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-xs font-semibold pl-6 truncate">
                      {applicant.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate">
                      {applicant.address || '—'}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                      {applicant.last_position || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate">
                      {applicant.education || '—'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {/* TODO: wire up add-to-candidate endpoint */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 px-2.5"
                        onClick={() => {
                          // TODO: add applicant to job candidate list
                        }}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-2 py-4 border-t">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                {(() => {
                  const pages = [];
                  pages.push(1);
                  if (page > 3) pages.push('...');
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push('...');
                  if (totalPages > 1) pages.push(totalPages);
                  return pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="text-xs text-muted-foreground px-1">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={page === p ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 w-7 text-xs p-0"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ),
                  );
                })()}
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredApplicants.length)} of {filteredApplicants.length}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}