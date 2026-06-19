import { SidebarGroupLabel } from '@/components/ui/sidebar';

export function SectionLabel({ children }) {
  return (
    <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground/70 font-bold px-2 mb-0.5 h-5">
      {children}
    </SidebarGroupLabel>
  );
}