import { Calendar } from 'lucide-react';
import { StepCard, StatusPill } from './shared';

const BOOKING_TONE = {
  confirmed: { pill: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Confirmed' },
  pending:   { pill: 'border-amber-200  bg-amber-50  text-amber-700',    dot: 'bg-amber-500',   label: 'Pending' },
};

export function ScheduleStep({ data, onNext }) {
  const { heading, subtitle, bookings, footerLeft } = data;

  return (
    <StepCard
      icon={Calendar}
      title={heading}
      subtitle={subtitle}
      footerLeft={footerLeft}
      footerRight={
        <button type="button" onClick={onNext} className="font-semibold text-foreground hover:underline">
          Next: Examine →
        </button>
      }
    >
      <table className="w-full text-sm">
        <thead className="bg-muted/30 border-b">
          <tr className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-2.5 text-left">Candidate</th>
            <th className="px-5 py-2.5 text-left">Package</th>
            <th className="px-5 py-2.5 text-left">Clinic</th>
            <th className="px-5 py-2.5 text-left">When</th>
            <th className="px-5 py-2.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.candidate} className="border-b last:border-b-0">
              <td className="px-5 py-3.5 font-semibold text-foreground whitespace-nowrap">{b.candidate}</td>
              <td className="px-5 py-3.5 text-muted-foreground">{b.package}</td>
              <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{b.clinic}</td>
              <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{b.when}</td>
              <td className="px-5 py-3.5"><StatusPill status={b.status} toneMap={BOOKING_TONE} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </StepCard>
  );
}