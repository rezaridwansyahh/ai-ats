import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Calendar, User, Briefcase } from 'lucide-react';
import { getOnboardingWorkboard } from '@/api/onboarding.api';

export default function OnboardingWorkboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardings, setOnboardings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    loadOnboardings();
  }, []);

  const loadOnboardings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOnboardingWorkboard();
      setOnboardings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load onboarding data');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredOnboardings = onboardings.filter(item => {
    const matchesSearch = item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.position_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = filterStage === 'all' || item.current_stage === filterStage;
    return matchesSearch && matchesStage;
  });

  const handleViewCandidate = (onboardingId) => {
    navigate(`/selection/onboarding/${onboardingId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="font-semibold text-lg">Failed to load onboarding data</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={loadOnboardings}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Onboarding Workboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track new hires through pre-boarding, first 30 days, and probation
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Stages</option>
          <option value="pre-boarding">Pre-boarding</option>
          <option value="day-1-30">Day 1-30</option>
          <option value="probation">Probation</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Onboarding</div>
          <div className="text-2xl font-semibold mt-1">{onboardings.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Pre-boarding</div>
          <div className="text-2xl font-semibold mt-1">
            {onboardings.filter(o => o.current_stage === 'pre-boarding').length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Day 1-30</div>
          <div className="text-2xl font-semibold mt-1">
            {onboardings.filter(o => o.current_stage === 'day-1-30').length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Probation</div>
          <div className="text-2xl font-semibold mt-1">
            {onboardings.filter(o => o.current_stage === 'probation').length}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredOnboardings.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            {searchTerm || filterStage !== 'all'
              ? 'No onboarding records match your filters'
              : 'No onboarding records yet'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Candidate</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Progress</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOnboardings.map((item) => {
                const checklistProgress = item.checklist_total > 0
                  ? Math.round((item.checklist_done / item.checklist_total) * 100)
                  : 0;
                const milestoneProgress = item.milestones_total > 0
                  ? Math.round((item.milestones_done / item.milestones_total) * 100)
                  : 0;
                const overallProgress = Math.round((checklistProgress + milestoneProgress) / 2);

                return (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => handleViewCandidate(item.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="font-medium">{item.candidate_name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        {item.position_title}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(item.start_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.current_stage === 'pre-boarding' ? 'bg-blue-100 text-blue-700' :
                        item.current_stage === 'day-1-30' ? 'bg-purple-100 text-purple-700' :
                        item.current_stage === 'probation' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.current_stage === 'pre-boarding' ? 'Pre-boarding' :
                         item.current_stage === 'day-1-30' ? 'Day 1-30' :
                         item.current_stage === 'probation' ? 'Probation' :
                         'Confirmed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10">{overallProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.onboarding_status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.onboarding_status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        item.onboarding_status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.onboarding_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCandidate(item.id);
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
