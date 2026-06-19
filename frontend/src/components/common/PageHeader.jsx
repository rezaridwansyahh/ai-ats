export function PageHeader({ title, highlight, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-bold tracking-tight leading-none">
          {title}
          {highlight && (
            <>
              {' '}
              <span className="font-display text-primary italic">{highlight}</span>
            </>
          )}
          .
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}