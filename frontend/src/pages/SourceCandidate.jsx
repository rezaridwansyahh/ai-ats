import { useState } from 'react';
import { Search, Users, Check, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import SearchForm from '@/components/source-candidate/SearchForm';
import SearchResults from '@/components/source-candidate/SearchResults';
import { searchSourcing } from '@/api/sourcing.api';

const STEPS = [
  { key: 'search',  label: 'Search Parameters', icon: Search },
  { key: 'results', label: 'Candidates',         icon: Users  },
];

export default function SourceCandidatePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [sourcingId, setSourcingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

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
      <PageHeader
        title="Source"
        highlight="Candidate"
        subtitle="Search LinkedIn Recruiter for candidates matching your criteria."
      />

      {/* Stepper */}
      <div className="flex items-center justify-center py-2">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive    = i === activeStep;

          return (
            <div key={step.key} className="flex items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-200
                  ${isCompleted
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`
                  text-[11px] font-semibold transition-colors
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
              </div>

              {/* Connector — only between steps, not after the last */}
              {i < STEPS.length - 1 && (
                <div className={`
                  w-16 h-px mx-3 mb-5 transition-colors duration-200
                  ${isCompleted ? 'bg-primary/40' : 'bg-border'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* Back nav — step 2 only */}
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