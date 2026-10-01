import { useState, useMemo, useEffect, useCallback } from "react";
import { Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import AddToJobDialog from "@/components/talent-pool/AddToJobDialog";
import ApplicantHistoryModal from "@/components/talent-pool/ApplicantHistoryModal";
import TalentPoolStats from "@/components/talent-pool/TalentPoolStats";
import TalentPoolFilterSidebar from "@/components/talent-pool/TalentPoolFilterSidebar";
import TalentPoolTable from "@/components/talent-pool/TalentPoolTable";
import CvUploadCard from "@/components/talent-pool/CvUploadCard";
import { getAllByCompanyWithScore, getApplicantStats, getApplicantSkills } from "@/api/applicant.api";
import { PageHeader } from "@/components/common";
import { hasPermission } from "@/utils/permissions";

import PipelineTour, { usePipelineTour} from "@/components/tours/PipelineTour";
import { TALENT_POOL_STEPS } from "@/components/tours/tourSteps";

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
  position_q: '',
  education_q: '',
  location_q:'',
};

const EMPTY_STATS = { total: 0, newThisWeek: 0, positionCategories: 0, avgExperience: '-' };

export default function TalentPoolPage(){
  const canCreate = hasPermission('Sourcing', 'Talent Pool', 'create');

  // Current page's rows + total match count — both come straight from the
  // server now. Filtering/sorting/pagination all happen in SQL, not here.
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats + available skills are whole-pool aggregates, unaffected by the
  // current filter/page — fetched once, not re-fetched on every search.
  const [stats, setStats] = useState(EMPTY_STATS);
  const [availableSkills, setAvailableSkills] = useState([]);

  const [filterDraft, setFilterDraft] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [minScore, setMinScore] = useState(0);
  const [page, setPage] = useState(1);

  // Multi-select skill filter — a candidate must have ALL selected skills
  // to match (AND). Kept separate from activeFilters since it's a set, not text.
  const [skillFilters, setSkillFilters] = useState(() => new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  // id -> full row object. A Map (not just a Set of ids) because selection
  // can span multiple pages — once a page is left, its rows are gone from
  // `rows`, so the full object has to be captured at select-time instead of
  // looked up again later.
  const [selectedMap, setSelectedMap] = useState(() => new Map());
  const selectedIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyApplicant, setHistoryApplicant] = useState(null);

  const { run, setRun, markSeen, restart } = usePipelineTour('talent-pool');

  const companyId = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user'))?.company_id; } catch { return null; }
  }, []);

  const loadApplicants = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllByCompanyWithScore(companyId, {
        page,
        pageSize: PAGE_SIZE,
        position_q: activeFilters.position_q || undefined,
        education_q: activeFilters.education_q || undefined,
        location_q: activeFilters.location_q || undefined,
        min_score: minScore > 0 ? minScore : undefined,
        skills: skillFilters.size > 0 ? [...skillFilters].join(',') : undefined,
      });
      setRows(data.applicants || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load applicants');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, page, activeFilters, minScore, skillFilters]);

  useEffect(() => { loadApplicants(); }, [loadApplicants]);

  const loadStatsAndSkills = useCallback(async () => {
    if (!companyId) return;
    try {
      const [statsRes, skillsRes] = await Promise.all([
        getApplicantStats(companyId),
        getApplicantSkills(companyId),
      ]);
      const s = statsRes.data?.stats || {};
      setStats({
        total: s.total ?? 0,
        newThisWeek: s.new_this_week ?? 0,
        positionCategories: s.position_categories ?? 0,
        avgExperience: s.avg_experience != null ? `${Number(s.avg_experience).toFixed(1)} yrs` : '-',
      });
      setAvailableSkills(
        (skillsRes.data?.skills || []).map((row) => ({ skill: row.skill, count: row.count }))
      );
    } catch {
      // Stat tiles/skill picker are a nicety, not required for the table to work.
    }
  }, [companyId]);

  useEffect(() => { loadStatsAndSkills(); }, [loadStatsAndSkills]);

  const hasActiveFilters = useMemo(
    () => Object.values(activeFilters).some((v) => v.trim().length > 0) || minScore > 0 || skillFilters.size > 0,
    [activeFilters, minScore, skillFilters]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);

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

  // Handlers passed down to children
  const setDraftField = (key) => (e) =>
    setFilterDraft(f => ({ ...f, [key]: e.target.value }));

  const handleSearchSubmit = (e) => {
    if(e?.preventDefault) e.preventDefault();
    setPage(1);
    setActiveFilters(filterDraft);
  };

  const handleClearAll = () => {
    setFilterDraft(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setMinScore(0);
    setSkillFilters(new Set());
    setPage(1);
  };

  const handleChipClick = (key, value) => {
    setFilterDraft((f) => {
      const next = f[key] === value ? '' : value;
      const updated = { ...f, [key]: next};
      setPage(1);
      setActiveFilters(updated);
      return updated;
    });
  };

  const handleMinScoreChange = (value) => {
    setMinScore(value);
    setPage(1);
  }

  const handleToggleSkillFilter = (skill) => {
    setSkillFilters((prev) => new Set(prev).add(skill));
    setPage(1);
  };

  const handleRemoveSkillFilter = (skill) => {
    setSkillFilters((prev) => {
      const next = new Set(prev);
      next.delete(skill);
      return next;
    });
    setPage(1);
  };

  // ── Single-candidate "Add" (per-row button) — wraps in a 1-item array
  // so AddToJobDialog only has one code path (bulk or not, doesn't matter).
  const handleAddClick = (row) => {
    setSelectedApplicants([{
      id:            row.id,
      name:          row.name,
      email:         row.email,
      last_position: row.last_position,
      address:       row.address,
      information:   row.information,
    }]);
    setDialogOpen(true);
  };

  // BULK SELECT HANDLERS — store the full row (not just the id) since the
  // page it came from won't still be loaded once the user moves on.
  const toggleSelectOne = (row) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id); else next.set(row.id, row);
      return next;
    });
  };

  const toggleSelectAllPaged = () => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      const allSelected = rows.length > 0 && rows.every((r) => next.has(r.id));
      if (allSelected) {
        rows.forEach((r) => next.delete(r.id));
      } else {
        rows.forEach((r) => next.set(r.id, r));
      }
      return next;
    });
  };
  const clearSelection = () => setSelectedMap(new Map());

  const handleBulkAddClick = () => {
    setSelectedApplicants([...selectedMap.values()]);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    loadApplicants();
    loadStatsAndSkills();
    clearSelection();
  };

  const handleViewClick = (row) => {
    setHistoryApplicant(row);
    setHistoryOpen(true);
  };

   return (
    <div className="space-y-5 p-6">

      <div data-tour="talent-pool-header" className="flex items-start justify-between gap-4">
        <PageHeader
          title="Talent"
          highlight="Pool"
          subtitle={`${stats.total} candidates saved. Search by skill, filter by city or score, or browse all.`}
        />
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Button variant="ghost" size="sm" className="text-xs" onClick={restart}>
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> Take the tour
          </Button>
          <Button size="sm" className="text-xs" disabled title="Coming soon">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI Suggest
          </Button>
        </div>
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
          onChipClick={handleChipClick}
          skillFilters={skillFilters}
          availableSkills={availableSkills}
          onToggleSkill={handleToggleSkillFilter}
          onRemoveSkill={handleRemoveSkillFilter}
        />

        <TalentPoolTable
          rows={rows}
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
          onViewClick={handleViewClick}
          page={pageClamped}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          paginationPages={paginationPages}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onToggleSelectOne={toggleSelectOne}
          onToggleSelectAllPaged={toggleSelectAllPaged}
          onBulkAddClick={handleBulkAddClick}
          onClearSelection={clearSelection}
          canAdd={canCreate}
        />
      </div>

      <AddToJobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        applicants={selectedApplicants}
        onSuccess={handleDialogSuccess}
      />

      <ApplicantHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        applicant={historyApplicant}
      />

      {canCreate && <CvUploadCard />}

      <PipelineTour
        steps={TALENT_POOL_STEPS}
        tourKey="talent-pool"
        run={run}
        setRun={setRun}
        markSeen={markSeen}
      />
    </div>
  );
}
