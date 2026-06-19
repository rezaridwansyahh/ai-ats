import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, UserPlus, Briefcase, Calendar, Sparkles, AlertTriangle,
  Building2, GraduationCap, Plus, MapPin, Code2, X, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/cards/StatCard';
import AddToJobDialog from '@/components/talent-pool/AddToJobDialog';
import { searchScreening } from '@/api/screening.api';
import { getAll } from '@/api/applicant.api';
import { PageHeader } from '@/components/common';

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
  position_q: '',
  skill_q: '',
  education_q: '',
  location_q: '',
};

export default function TalentPoolPage() {
  // Stats — one-time full fetch, unaffected by search
  const [allApplicants, setAllApplicants] = useState([]);
  const [statsLoading, setStatsLoading]   = useState(true);

  // Search results — server-side, paginated
  const [rows, setRows]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError]             = useState(null);

  const [filterDraft, setFilterDraft]     = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [page, setPage]                   = useState(1);

  const [dialogOpen, setDialogOpen]           = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // ── Full fetch for stats ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const { data } = await getAll();
        if (!cancelled) setAllApplicants(data.applicants || []);
      } catch {
        if (!cancelled) setAllApplicants([]);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const draftHasContent  = useMemo(() => Object.values(filterDraft).some(v => v.trim().length > 0),  [filterDraft]);
  const activeHasContent = useMemo(() => Object.values(activeFilters).some(v => v.trim().length > 0), [activeFilters]);

  // ── Paginated search ───────────────────────────────────────────
  const fetchRows = useCallback(async () => {
    setSearchLoading(true);
    setError(null);
    try {
      const params = { mode: 'pool', page, limit: PAGE_SIZE };
      Object.entries(activeFilters).forEach(([k, v]) => {
        const trimmed = v.trim();
        if (trimmed) params[k] = trimmed;
      });
      const res = await searchScreening(params);
      setRows(res.data.rows   || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load applicants');
      setRows([]);
      setTotal(0);
    } finally {
      setSearchLoading(false);
    }
  }, [activeFilters, page]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleSearch = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!draftHasContent) return;
    setPage(1);
    setActiveFilters(filterDraft);
  };

  const handleClear = () => {
    setFilterDraft(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const setField = (key) => (e) =>
    setFilterDraft(f => ({ ...f, [key]: e.target.value }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalApplicants = allApplicants.length;
    const weekAgo         = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek     = allApplicants.filter(a => a.date && new Date(a.date).getTime() >= weekAgo).length;
    const positionCategories = new Set(
      allApplicants.map(a => a.information?.job_position?.category).filter(Boolean)
    ).size;
    const avgExperience = (() => {
      const years = allApplicants
        .map(a => a.information?.experience?.years_total ?? a.information?.years_experience)
        .filter(v => typeof v === 'number');
      if (years.length === 0) return '—';
      return `${(years.reduce((s, y) => s + y, 0) / years.length).toFixed(1)} yrs`;
    })();
    return { total: totalApplicants, newThisWeek, positionCategories, avgExperience };
  }, [allApplicants]);

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(); } catch { return '—'; }
  };

  const handleAddClick = (row) => {
    setSelectedApplicant({
      id:            row.applicant_id,
      name:          row.name,
      last_position: row.last_position,
      address:       row.address,
      information:   row.information,
    });
    setDialogOpen(true);
  };

  // ── Numbered pagination (mirrors JobCreation style) ────────────
  const paginationPages = useMemo(() => {
    const pages = [];
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-6">

      {/* Header — single AI Suggest button, no duplicate */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Talent"
          highlight="Pool"
          subtitle="Browse all applicants. Use the filters below to narrow by position, skill, education, or location."
        />
        <Button size="sm" className="text-xs shrink-0 mt-1">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Suggest
        </Button>
      </div>

      {/* Stat cards — tighter height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4 text-primary" />}
          iconBg="bg-primary/10"
          label="Total Applicants"
          value={stats.total}
          loading={statsLoading}
        />
        <StatCard
          icon={<UserPlus className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="New This Week"
          value={stats.newThisWeek}
          loading={statsLoading}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Position Categories"
          value={stats.positionCategories}
          loading={statsLoading}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-orange-600" />}
          iconBg="bg-orange-50"
          label="Avg Experience"
          value={stats.avgExperience}
          loading={statsLoading}
        />
      </div>

      {/* Results card — filters live in the card header as a toolbar */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm shrink-0">
              Results
              {!searchLoading && (
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  {total} {total === 1 ? 'result' : 'results'}
                </span>
              )}
              {searchLoading && (
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  Searching...
                </span>
              )}
            </CardTitle>

            {/* Filter toolbar */}
            <form
              onSubmit={handleSearch}
              className="flex items-end gap-2 flex-wrap"
            >
              <FacetInput
                icon={<Briefcase className="h-3 w-3" />}
                placeholder="Position"
                value={filterDraft.position_q}
                onChange={setField('position_q')}
              />
              <FacetInput
                icon={<Code2 className="h-3 w-3" />}
                placeholder="Skill"
                value={filterDraft.skill_q}
                onChange={setField('skill_q')}
              />
              <FacetInput
                icon={<GraduationCap className="h-3 w-3" />}
                placeholder="Education"
                value={filterDraft.education_q}
                onChange={setField('education_q')}
              />
              <FacetInput
                icon={<MapPin className="h-3 w-3" />}
                placeholder="Location"
                value={filterDraft.location_q}
                onChange={setField('location_q')}
              />
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleClear}
                  disabled={!draftHasContent && !activeHasContent}
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!draftHasContent || searchLoading}
                >
                  <Search className="h-3 w-3 mr-1" /> Search
                </Button>
              </div>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 mx-4 mt-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[20%] text-[10px] font-bold uppercase pl-6">Name</TableHead>
                  <TableHead className="w-[20%] text-[10px] font-bold uppercase">Last Position</TableHead>
                  <TableHead className="w-[24%] text-[10px] font-bold uppercase">Skills</TableHead>
                  <TableHead className="w-[16%] text-[10px] font-bold uppercase">Education</TableHead>
                  <TableHead className="w-[10%] text-[10px] font-bold uppercase">Applied</TableHead>
                  <TableHead className="w-[10%] text-[10px] font-bold uppercase text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                      Loading applicants...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                      {activeHasContent
                        ? 'No applicants match your filters.'
                        : 'No applicants found.'}
                    </TableCell>
                  </TableRow>
                ) : rows.map(r => {
                  const info        = r.information || {};
                  const skillTags   = Array.isArray(info.skills) ? info.skills.slice(0, 4) : [];
                  const moreSkills  = (Array.isArray(info.skills) ? info.skills.length : 0) - skillTags.length;
                  const eduTop      = Array.isArray(info.education) && info.education[0]
                    ? `${info.education[0].school || ''}${info.education[0].degree ? ` · ${info.education[0].degree}` : ''}`
                    : (r.education_text || '—');
                  const positionLabel  = info.job_position?.current || r.last_position || '—';
                  const categoryLabel  = info.job_position?.category;

                  return (
                    <TableRow
                      key={r.applicant_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Name */}
                      <TableCell className="text-xs pl-6">
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{r.address || '—'}</div>
                      </TableCell>

                      {/* Last Position — icon removed, category as muted sub-line */}
                      <TableCell className="text-xs">
                        <div className="truncate font-medium">{positionLabel}</div>
                        {categoryLabel && (
                          <div className="text-[10px] text-muted-foreground truncate">{categoryLabel}</div>
                        )}
                      </TableCell>

                      {/* Skills */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {skillTags.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          ) : (
                            <>
                              {skillTags.map(s => (
                                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                              ))}
                              {moreSkills > 0 && (
                                <span className="text-[10px] text-muted-foreground self-center">+{moreSkills}</span>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>

                      {/* Education — icon removed */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{eduTop}</span>
                        </div>
                      </TableCell>

                      {/* Applied */}
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(r.date)}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right pr-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => handleAddClick(r)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination — numbered, matches JobCreation style */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-2 py-4 border-t">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>

                {paginationPages.map((p, idx) =>
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
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>

              <span className="text-[10px] text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
            </div>
          )}

        </CardContent>
      </Card>

      <AddToJobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicant={selectedApplicant}
        onSuccess={() => fetchRows()}
      />
    </div>
  );
}

// ── Inline filter input — compact, no label, icon as prefix ───────
function FacetInput({ icon, placeholder, value, onChange }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="text-xs h-8 pl-7 w-[140px]"
      />
    </div>
  );
}