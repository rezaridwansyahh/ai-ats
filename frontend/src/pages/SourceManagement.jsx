import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import { getJobAccountsByUserId } from '@/api/job-accounts.api';
import AccountSelection from '@/components/source-management/AccountSelection';
import ListSource from '@/components/source-management/ListSource';
import SourceSetup from '@/components/source-management/SourceSetup';
import ListCandidate from '@/components/source-management/ListCandidate';
import SourceManagementWizard, { useSourceManagementWizard } from '@/components/tours/SourceManagementWizard';

const STEPS = [
  { key: 'selection', label: 'Account Select'},
  { key: 'sourcing',  label: 'List Source'   },
  { key: 'setting',   label: 'Source Setup'  },
  { key: 'candidate', label: 'List Candidate'},
];

export default function SourceManagementPage() {
 const [activeStep, setActiveStep] = useState(0);
  const [accounts, setAccounts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const { run: wizardRun, setRun: setWizardRun, markSeen: markWizardSeen, restart: restartWizard } = useSourceManagementWizard();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.id) { setAccounts([]); return; }
      const res = await getJobAccountsByUserId(user.id);
      setAccounts(res.data.accounts || []);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const handlePrev = () => setActiveStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Source"
          highlight="Management"
          subtitle="End-to-end job lifecycle — create, configure stages, publish, source, and manage applicants."
        />
        <Button variant="ghost" size="sm" className="text-xs" onClick={restartWizard}>
          <HelpCircle className="h-3.5 w-3.5 mr-1" /> Take the tour
        </Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center py-2 border-b pb-5">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive    = i === activeStep;

          return (
            <div key={step.key} className="flex items-center">
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
                  text-[11px] font-semibold transition-colors whitespace-nowrap
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
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

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between">
        {activeStep > 0 ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous: {STEPS[activeStep - 1].label}
          </Button>
        ) : <div />}

        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            disabled={activeStep === 0 && !selectedAccount}
            onClick={handleNext}
          >
            Next: {STEPS[activeStep + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : <div />}
      </div>

      {/* Step content */}
      {activeStep === 0 && (
        <AccountSelection
          accounts={accounts}
          loading={loading}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
        />
      )}
      {activeStep === 1 && (
        <ListSource selectedAccount={selectedAccount} />
      )}
      {activeStep === 2 && (
        <SourceSetup selectedJob={null} />
      )}
      {activeStep === 3 && (
        <ListCandidate selectedJob={null} />
      )}

      <SourceManagementWizard 
        activeStep={activeStep}
        run={wizardRun}
        setRun={setWizardRun}
        markSeen={markWizardSeen}
      />

    </div>
  );
}