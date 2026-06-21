// components/offer-contract/PlaceholderStep.jsx
import { ChevronRight } from 'lucide-react';
import { StepCard } from './shared';

export function PlaceholderStep({ icon: Icon, title, description, onBack, onNext, nextLabel }) {
  return (
    <StepCard
      icon={Icon}
      title={title}
      subtitle={description}
      footerLeft={
        onBack && (
          <button type="button" onClick={onBack} className="font-semibold text-foreground hover:underline">
            Back
          </button>
        )
      }
      footerRight={
        onNext && (
          <button
            type="button"
            onClick={onNext}
            className="font-semibold text-foreground flex items-center gap-1 hover:underline"
          >
            Next: {nextLabel} <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )
      }
    >
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          This step hasn't been built yet — coming soon.
        </p>
      </div>
    </StepCard>
  );
}