import { useState } from 'react';
import { Search, Users, Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import SearchForm from '@/components/source-candidate/SearchForm';
import SearchResults from '@/components/source-candidate/SearchResults';
import { searchSourcing } from '@/api/sourcing.api';

const STEPS = [
  { key: 'search',  label: 'Search Parameters', icon: Search },
  { key: 'results', label: 'Candidates',        icon: Users },
];

export default function SourceCandidatePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [sourcingId, setSourcingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSearchStart = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await searchSourcing(payload);
      setSourcingId(data.sourcing?.id);
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to queue search');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSourcingId(null);
    setActiveStep(0);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Source Candidate</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search LinkedIn Recruiter for candidates matching your criteria.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 py-2">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < activeStep
                  ? 'bg-primary text-white'
                  : i === activeStep
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < activeStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-[11px] font-bold transition-colors ${
                i === activeStep ? 'text-primary' : 'text-muted-foreground'
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 mx-1 -mt-4 ${i < activeStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Back nav (only on step 2) */}
      {activeStep === 1 && (
        <div className="flex">
          <Button variant="ghost" size="sm" className="text-xs" onClick={handleRetry}>
            <ChevronLeft className="h-4 w-4 mr-1" /> New Search
          </Button>
        </div>
      )}

      {/* Step content */}
      {activeStep === 0 && (
        <SearchForm
          onSearchStart={handleSearchStart}
          loading={submitting}
          error={error}
        />
      )}
      {activeStep === 1 && sourcingId && (
        <SearchResults sourcingId={sourcingId} onRetry={handleRetry} />
      )}
    </div>
  );
}
