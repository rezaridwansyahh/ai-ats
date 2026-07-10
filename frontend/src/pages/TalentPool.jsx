import { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddToJobDialog from '@/components/talent-pool/AddToJobDialog';
import TalentPoolStats from '@/components/talent-pool/TalentPoolStats';
import TalentPoolFilterSidebar from '@/components/talent-pool/TalentPoolFilterSidebar';
import TalentPoolTable from '@/components/talent-pool/TalentPoolTable';
import { getAllByCompanyWithScore } from '@/api/applicant.api';
import { PageHeader } from '@/components/common';

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
  position_q: '',
  skill_q: '',
  education_q: '',
  location_q: '',
};

/*
 * TalentPoolPage — owns ALL state, data fetching, and filtering logic.
 * TalentPoolStats / TalentPoolFilterSidebar / TalentPoolTable are purely
 * presentational: they receive computed values + callbacks as props and
 * don't manage their own state or call the API. Keeps the "brain" in one
 * place so filter logic only needs to be reasoned about here.
 *
 * Data source: getAllByCompanyWithScore() — one full fetch per company,
 * every row includes latest_score (most recent overall_score across any
 * job, per applicant.model.js). Filtering/pagination below are done
 * client-side with plain substring matching, not the backend's fuzzy
 * trigram search — fine for typical list sizes; ask backend for a
 * paginated + fuzzy-search version if the applicant list grows very large.
 */
export default function TalentPoolPage() {
  const [allApplicants, setAllApplicants] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const [filterDraft, setFilterDraft]     = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [minScore, setMinScore]           = useState(0);
  const [page, setPage]                   = useState(1);

  const [dialogOpen, setDialogOpen]               = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // ── One full fetch — includes latest_score per applicant ────────
  const loadApplicants = async () => {
    setLoading(true);
    setError(null);
    try {
      const storage = JSON.parse(localStorage.getItem('user'));
      const { data } = await getAllByCompanyWithScore(storage.company_id);
      setAllApplicants(data.applicants || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load applicants');
      setAllApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApplicants(); }, []);

  const hasActiveFilters = useMemo(
    () => Object.values(activeFilters).some(v => v.trim().length > 0) || minScore > 0,
    [activeFilters, minScore]
  );

  // ── Client-side filtering ────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const posQ = activeFilters.position_q.trim().toLowerCase();
    const skQ  = activeFilters.skill_q.trim().toLowerCase();
    const eduQ = activeFilters.education_q.trim().toLowerCase();
    const locQ = activeFilters.location_q.trim().toLowerCase();

    return allApplicants.filter((a) => {
      const info = a.information || {};

      if (posQ) {
        const hay = `${a.last_position || ''} ${info.job_position?.current || ''} ${info.job_position?.category || ''}`.toLowerCase();
        if (!hay.includes(posQ)) return false;
      }

      if (skQ) {
        const skills = Array.isArray(info.skills) ? info.skills : [];
        const hasSkill = skills.some((s) => (s || '').toLowerCase().includes(skQ));
        if (!hasSkill) return false;
      }

      if (eduQ) {
        const eduArr = Array.isArray(info.education) ? info.education : [];
        const hay = `${a.education || ''} ${eduArr.map((e) => `${e.school || ''} ${e.degree || ''}`).join(' ')}`.toLowerCase();
        if (!hay.includes(eduQ)) return false;
      }

      if (locQ) {
        if (!(a.address || '').toLowerCase().includes(locQ)) return false;
      }

      if (minScore > 0) {
        if ((a.latest_score ?? 0) < minScore) return false;
      }

      return true;
    });
  }, [allApplicants, activeFilters, minScore]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const paginationPages = useMemo(() => {
    const pages = [];
    pages.push(1);
    if (pageClamped > 3) pages.push('...');
    for (let i = Math.max(2, pageClamped - 1); i <= Math.min(totalPages - 1, pageClamped + 1); i++) {
      pages.push(i);
    }
    if (pageClamped < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [pageClamped, totalPages]);

  // ── Stats — derived from the same full fetch, no separate call needed ──
  const stats = useMemo(() => {
    const totalApplicants = allApplicants.length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = allApplicants.filter(a => a.date && new Date(a.date).getTime() >= weekAgo).length;
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

  // ── Handlers passed down to children ─────────────────────────────
  const setDraftField = (key) => (e) =>
    setFilterDraft(f => ({ ...f, [key]: e.target.value }));

  const handleSearchSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    setPage(1);
    setActiveFilters(filterDraft);
  };

  const handleClearAll = () => {
    setFilterDraft(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setMinScore(0);
    setPage(1);
  };

  const handleChipClick = (key, value) => {
    setFilterDraft((f) => {
      const next = f[key] === value ? '' : value;
      const updated = { ...f, [key]: next };
      setPage(1);
      setActiveFilters(updated);
      return updated;
    });
  };

  const handleMinScoreChange = (value) => {
    setMinScore(value);
    setPage(1);
  };

  const handleAddClick = (row) => {
    setSelectedApplicant({
      id:            row.id,
      name:          row.name,
      last_position: row.last_position,
      address:       row.address,
      information:   row.information,
    });
    setDialogOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5 p-6">

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Talent"
          highlight="Pool"
          subtitle={`${stats.total} candidates saved. Search by skill, filter by city or score, or browse all.`}
        />
        <Button size="sm" className="text-xs shrink-0 mt-1" disabled title="Coming soon">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Suggest
        </Button>
      </div>

      <TalentPoolStats stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
        <TalentPoolFilterSidebar
          totalCount={stats.total}
          hasActiveFilters={hasActiveFilters}
          onClearAll={handleClearAll}
          minScore={minScore}
          onMinScoreChange={handleMinScoreChange}
          activeLocation={activeFilters.location_q}
          activeSkill={activeFilters.skill_q}
          onChipClick={handleChipClick}
        />

        <TalentPoolTable
          rows={pagedRows}
          total={total}
          loading={loading}
          error={error}
          hasActiveFilters={hasActiveFilters}
          positionDraft={filterDraft.position_q}
          educationDraft={filterDraft.education_q}
          onPositionDraftChange={setDraftField('position_q')}
          onEducationDraftChange={setDraftField('education_q')}
          onSearchSubmit={handleSearchSubmit}
          onAddClick={handleAddClick}
          page={pageClamped}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          paginationPages={paginationPages}
          onPageChange={setPage}
        />
      </div>

      <AddToJobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicant={selectedApplicant}
        onSuccess={() => loadApplicants()}
      />
    </div>
  );
}