import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, UserPlus, Search, Briefcase, Calendar, Sparkles, AlertTriangle,
  Building2, GraduationCap, Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/cards/StatCard';
import AddToJobDialog from '@/components/talent-pool/AddToJobDialog';

import { getAll } from '@/api/applicant.api';

const PLATFORM_COLORS = {
  seek:      'bg-blue-50 text-blue-600 border-blue-200',
  linkedin:  'bg-sky-50 text-sky-600 border-sky-200',
  internal:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  glints:    'bg-orange-50 text-orange-600 border-orange-200',
  instagram: 'bg-pink-50 text-pink-600 border-pink-200',
  facebook:  'bg-indigo-50 text-indigo-600 border-indigo-200',
  whatsapp:  'bg-green-50 text-green-600 border-green-200',
};

const PLATFORM_OPTIONS = ['seek', 'linkedin', 'internal', 'glints'];
const PAGE_SIZE = 10;

export default function TalentPoolPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAll();
      setApplicants(data.applicants || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  const filtered = useMemo(() => {
    return applicants.filter(a => {
      const matchesSearch = !searchQuery
        || a.name?.toLowerCase().includes(searchQuery.toLowerCase())
        || a.last_position?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || a.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });
  }, [applicants, searchQuery, platformFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery, platformFilter]);

  const stats = useMemo(() => {
    const total = applicants.length;
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = applicants.filter(a => a.date && new Date(a.date).getTime() >= weekAgo).length;
    const platforms = new Set(applicants.map(a => a.platform).filter(Boolean)).size;
    const avgExperience = (() => {
      const years = applicants.map(a => a.information?.years_experience).filter(v => typeof v === 'number');
      if (years.length === 0) return '—';
      const avg = years.reduce((s, y) => s + y, 0) / years.length;
      return `${avg.toFixed(1)} yrs`;
    })();
    return { total, newThisWeek, platforms, avgExperience };
  }, [applicants]);

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
  };

  return (
    <div className="space-y-5 p-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Talent Pool</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse and source applicants from all connected platforms. Add top candidates to a job.
          </p>
        </div>
        <Button size="sm" className="text-xs">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Suggest
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Total Applicants"
          value={stats.total}
          loading={loading}
        />
        <StatCard
          icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="New This Week"
          value={stats.newThisWeek}
          loading={loading}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Active Platforms"
          value={stats.platforms}
          loading={loading}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-orange-600" />}
          iconBg="bg-orange-50"
          label="Avg Experience"
          value={stats.avgExperience}
          loading={loading}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Applicant List ── */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">All Applicants</CardTitle>
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-[300px] flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name or last position..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px] text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORM_OPTIONS.map(p => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[22%] text-[10px] font-bold uppercase">Name</TableHead>
                <TableHead className="w-[22%] text-[10px] font-bold uppercase">Last Position</TableHead>
                <TableHead className="w-[18%] text-[10px] font-bold uppercase">Education</TableHead>
                <TableHead className="w-[12%] text-[10px] font-bold uppercase">Platform</TableHead>
                <TableHead className="w-[13%] text-[10px] font-bold uppercase">Applied</TableHead>
                <TableHead className="w-[13%] text-[10px] font-bold uppercase text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    Loading applicants...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No applicants found.
                  </TableCell>
                </TableRow>
              ) : paginated.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">{a.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{a.address}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{a.last_position || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{a.education || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.platform ? (
                      <Badge variant="outline" className={`text-[10px] px-2 py-0 ${PLATFORM_COLORS[a.platform] || ''}`}>
                        {a.platform}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(a.date)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 px-2.5"
                      onClick={() => { setSelectedApplicant(a); setDialogOpen(true); }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <span className="text-[10px] text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="text-[11px] text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddToJobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicant={selectedApplicant}
        onSuccess={() => fetchApplicants()}
      />
    </div>
  );
}
