// import { Building2 } from 'lucide-react';

// export function TenantCard({ company, tier }) {
//   if (!company) return null;

//   // Initials fallback (e.g. "PT Cahaya Nusantara" → "CN")
//   const initials = company.name
//     ? company.name
//         .split(' ')
//         .filter(Boolean)
//         .slice(-2)
//         .map((w) => w[0].toUpperCase())
//         .join('')
//     : '?';

//   return (
//     <div className="px-3 pt-3 pb-2 border-b border-sidebar-border/70">
//       <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5 shadow-sm">

//         {/* Icon / Avatar */}
//         <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
//           <Building2 className="h-4 w-4 text-primary" />
//         </div>

//         {/* Text */}
//         <div className="min-w-0 flex-1">
//           <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 leading-none mb-0.5">
//             Tenant
//           </p>
//           <p className="text-xs font-bold truncate" title={company.name}>
//             {company.name}
//           </p>

//           {/* Email or tier badge */}
//           <div className="flex items-center gap-1.5 mt-0.5">
//             {company.email && (
//               <p className="text-[10px] text-muted-foreground truncate" title={company.email}>
//                 {company.email}
//               </p>
//             )}
//             {tier && (
//               <span className="text-[9px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
//                 {tier}
//               </span>
//             )}
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }


export function TenantCard({ company, tier }) {
  // Use company data if available, fall back to the Myralix brand header
  const initial     = company?.name ? company.name.trim()[0].toUpperCase() : 'M';
  const displayName = company?.name ?? 'Myralix';
  const subLine     = company?.email ?? null;

  return (
    <div className="px-4 py-3 border-b border-sidebar-border/70">
      <div className="flex items-center gap-3">

        {/* Green square avatar */}
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-sm font-bold text-white">{initial}</span>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate leading-tight" title={displayName}>
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {subLine && (
              <p className="text-[10px] text-muted-foreground truncate" title={subLine}>
                {subLine}
              </p>
            )}
            {tier && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-primary border border-primary/30 px-1.5 py-0.5 rounded flex-shrink-0">
                {tier}
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}