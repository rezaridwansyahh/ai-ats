import { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Lets a page override the last breadcrumb crumb with a dynamic label
// (e.g. a fetched job title). The override is scoped to the current path and
// auto-clears when the page unmounts or the label changes.
export const BreadcrumbContext = createContext(null);

export function useDynamicBreadcrumb(label) {
  const ctx = useContext(BreadcrumbContext);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!ctx) return undefined;
    ctx.set(pathname, label || null);
    return () => ctx.set(pathname, null);
  }, [ctx, pathname, label]);
}
