import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAll } from '@/api/candidate.api';
import ReportCandidate from '@/components/report-candidate/report-candidate';

export default function JobManagementPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const res = await getAll();
        setCandidates(res.data.pipelines || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Row-click behavior: Draft → edit form, anything else → detail page.
  const handleSelectCandidate = (candidate) => {
    if (!candidate) return;
    navigate(`/report-candidate/${candidate.id}`);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Candidate</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All report in one. Click any other row to view its detailed progress.
        </p>
      </div>

      <ReportCandidate
        candidates={candidates}
        loading={loading}
        selectedCandidate={null}
        onSelectCandidate={handleSelectCandidate}
      />
    </div>
  );
}