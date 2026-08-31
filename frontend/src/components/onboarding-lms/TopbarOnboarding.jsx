import { Bell } from 'lucide-react';

export default function Topbar({ crumbs }) {
  return (
    <header className="h-14 flex-shrink-0 border-b bg-card flex items-center px-6 gap-4">
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span className={i === crumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
              {c}
            </span>
          </span>
        ))}
      </div>

      <div className="flex-1" />

      <button className="relative h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted/50">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
      </button>
    </header>
  );
}