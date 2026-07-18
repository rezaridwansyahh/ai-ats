import { Circle } from 'lucide-react';
import { StepCard } from './shared';

function PackageCard({ pkg }) {
  return (
    <div className="border rounded-lg p-4 flex flex-col">
      <div className="font-serif text-base font-bold text-foreground">{pkg.name}</div>
      <div className="text-xs text-muted-foreground mb-3">{pkg.tier}</div>
      <ul className="space-y-1.5 mb-4 flex-1">
        {pkg.items.map((item) => (
          <li key={item} className="text-sm text-foreground flex items-start gap-1.5">
            <span className="text-muted-foreground">•</span> {item}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between pt-3 border-t text-sm">
        <span className="font-semibold text-foreground">{pkg.price}</span>
        <span className="text-muted-foreground">{pkg.duration}</span>
      </div>
    </div>
  );
}

export function ConfigureStep({ data, onNext }) {
  const { heading, subtitle, packages, footerLeft } = data;

  return (
    <StepCard
      icon={Circle}
      title={heading}
      subtitle={subtitle}
      footerLeft={footerLeft}
      footerRight={
        <button type="button" onClick={onNext} className="font-semibold text-foreground hover:underline">
          Save &amp; advance →
        </button>
      }
    >
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => <PackageCard key={pkg.name} pkg={pkg} />)}
      </div>
    </StepCard>
  );
}