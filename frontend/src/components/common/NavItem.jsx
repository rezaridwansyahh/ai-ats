// import { SidebarMenuButton, SidebarMenuSubButton } from '@/components/ui/sidebar';
// import { SoonBadge } from './SoonBadge';

// export function NavItem({
//   label,
//   icon: Icon,
//   active   = false,
//   onClick,
//   sub      = false,
//   soon     = false,
//   isNew    = false,
//   count,
//   chevron,
// }) {

//   // ── Sub-item ──
//   if (sub) {
//     return (
//       <SidebarMenuSubButton
//         className={`
//           cursor-pointer transition-all duration-200 rounded-md h-7 text-xs
//           ${active
//             ? 'bg-primary/10 text-primary font-semibold'
//             : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
//           }
//         `}
//         onClick={onClick}
//       >
//         {active && (
//           <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
//         )}
//         <span className="flex-1 truncate">{label}</span>
//         {soon  && !active && <SoonBadge variant="inline" />}
//         {isNew && !active && <SoonBadge variant="new" label="NEW" count={count} />}
//       </SidebarMenuSubButton>
//     );
//   }

//   // ── Top-level item ──
//   return (
//     <SidebarMenuButton
//       className={`
//         cursor-pointer transition-all duration-200 rounded-lg h-8 gap-2.5
//         ${active
//           ? 'bg-primary/10 text-primary font-semibold'
//           : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
//         }
//       `}
//       onClick={onClick}
//     >
//       {Icon && (
//         <div className={`
//           h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0
//           transition-all duration-200
//           ${active ? 'bg-primary/15' : 'bg-transparent'}
//         `}>
//           <Icon className={`h-3.5 w-3.5 ${active ? 'text-primary' : 'text-muted-foreground/70'}`} />
//         </div>
//       )}

//       <span className="text-xs flex-1 truncate">{label}</span>

//       {soon  && !active && <SoonBadge variant="inline" />}
//       {isNew && !active && <SoonBadge variant="new" label="NEW" count={count} />}

//       {chevron}
//     </SidebarMenuButton>
//   );
// }





import { SidebarMenuButton, SidebarMenuSubButton } from '@/components/ui/sidebar';
import { SoonBadge } from './SoonBadge';

export function NavItem({
  label,
  icon: Icon,
  active   = false,
  onClick,
  sub      = false,
  soon     = false,
  isNew    = false,
  count,
  chevron,
}) {

  // ── Sub-item (indented under collapsible section) ──
  if (sub) {
    return (
      <SidebarMenuSubButton
        className={`
          cursor-pointer transition-all duration-200 rounded-lg h-8 gap-2.5
          ${active
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
          }
        `}
        onClick={onClick}
      >
        {Icon && (
          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground/70'}`} />
        )}
        <span className="flex-1 truncate text-xs">{label}</span>
        {count != null && !soon && !isNew && (
          <span className="ml-auto text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
            {count}
          </span>
        )}
        {soon  && !active && <SoonBadge variant="inline" />}
        {isNew && !active && <SoonBadge variant="new" label="NEW" count={count} />}
      </SidebarMenuSubButton>
    );
  }

  // ── Top-level item ──
  return (
    <SidebarMenuButton
      className={`
        cursor-pointer transition-all duration-200 rounded-lg h-8 gap-2.5
        ${active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        }
      `}
      onClick={onClick}
    >
      {Icon && (
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground/70'}`} />
      )}

      <span className="text-xs flex-1 truncate">{label}</span>

      {count != null && !soon && !isNew && (
        <span className="ml-auto text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
          {count}
        </span>
      )}
      {soon  && !active && <SoonBadge variant="inline" />}
      {isNew && !active && <SoonBadge variant="new" label="NEW" count={count} />}

      {chevron}
    </SidebarMenuButton>
  );
}