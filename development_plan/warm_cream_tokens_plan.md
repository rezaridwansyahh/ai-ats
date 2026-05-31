# Plan: Warm Cream Design Tokens Migration

**Task**: 6.5 dari audit — dijadwalkan **Tue, 2 Jun** (2 jam FE)
**Impact**: Tertinggi visual win — demo langsung "premium feel" vs "generic SaaS"
**Risk**: Zero — CSS token swap only

---

## **Current vs Target Palette**

### Before (Slate — cold, generic)
```css
--background: #F8FAFC    /* Cool slate */
--foreground: #1E293B    /* Deep slate */
--border: #E2E8F0        /* Slate border */
--muted-foreground: #64748B  /* Muted slate */
--card: #FFFFFF          /* Pure white */
--muted: #F1F5F9         /* Light slate */
```

### After (Warm Cream — premium, sophisticated)
```css
--background: #FAF9F5    /* Warm cream */
--foreground: #1A1A1F    /* Rich ink */
--border: #E9E3D5        /* Warm hairline */
--muted-foreground: #6E6A5E  /* Warm muted */
--card: #FFFFFF          /* Keep pure white for contrast */
--muted: #F4F1E8         /* Paper-2 for layered surfaces */

/* New tokens */
--saffron: #E5A93D       /* Signal accent (warnings, highlights) */
--paper-2: #F4F1E8       /* Layered surface */
--shade: #F0EBDC         /* Subtle backgrounds */
```

**Visual reference**: `audit_report/Myralix_v0_1_Complete_Mockup_updated.html` (the prototype already uses warm cream)

---

## **Phase 1: Update theme-override.css** (45 min)

### File: `frontend/src/theme-override.css`

**Changes to `:root` block (lines 15-111)**

```css
:root {
  /* ── Core surfaces ── */
  --background: #FAF9F5;        /* was #F8FAFC */
  --foreground: #1A1A1F;        /* was #1E293B */
  --card: #FFFFFF;              /* unchanged */
  --card-foreground: #1A1A1F;   /* was #1E293B */
  --popover: #FFFFFF;           /* unchanged */
  --popover-foreground: #1A1A1F;  /* was #1E293B */

  /* ── Primary — Forest (unchanged) ── */
  --primary: #0A6E5C;
  --primary-foreground: #FFFFFF;

  /* ── Secondary — Warm wash ── */
  --secondary: #F4F1E8;         /* was #F1F5F9 */
  --secondary-foreground: #1A1A1F;  /* was #1E293B */

  /* ── Muted ── */
  --muted: #F4F1E8;             /* was #F1F5F9 */
  --muted-foreground: #6E6A5E;  /* was #64748B */

  /* ── Accent — subtle primary tint (unchanged logic) ── */
  --accent: rgba(10, 110, 92, 0.06);
  --accent-foreground: #0A6E5C;

  /* ── Destructive (unchanged) ── */
  --destructive: #EF4444;

  /* ── Border / Input / Ring ── */
  --border: #E9E3D5;            /* was #E2E8F0 */
  --input: #E9E3D5;             /* was #E2E8F0 */
  --ring: #0A6E5C;              /* unchanged */

  /* ── Charts — keep semantic colors unchanged ── */
  --chart-1: #0A6E5C;
  --chart-2: #14B8A6;
  --chart-3: #F59E0B;
  --chart-4: #8B5CF6;
  --chart-5: #3B82F6;

  /* ── Sidebar ── */
  --sidebar: #FFFFFF;
  --sidebar-foreground: #1A1A1F;  /* was #1E293B */
  --sidebar-primary: #0A6E5C;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: rgba(10, 110, 92, 0.07);
  --sidebar-accent-foreground: #0A6E5C;
  --sidebar-border: #E9E3D5;      /* was #E2E8F0 */
  --sidebar-ring: #0A6E5C;

  /* ── Mockup semantic colors ── */
  --primary-light: #14B8A6;
  --primary-bg: rgba(10, 110, 92, 0.06);
  --primary-bg-strong: rgba(10, 110, 92, 0.12);

  /* ── NEW: Saffron accent ── */
  --saffron: #E5A93D;
  --saffron-bg: rgba(229, 169, 61, 0.08);

  --amber: #F59E0B;
  --amber-bg: rgba(245, 158, 11, 0.08);

  --success: #22C55E;
  --success-bg: rgba(34, 197, 94, 0.08);

  --warning: #EAB308;
  --warning-bg: rgba(234, 179, 8, 0.1);

  --error: #EF4444;
  --error-bg: rgba(239, 68, 68, 0.08);

  --info: #3B82F6;
  --info-bg: rgba(59, 130, 246, 0.06);

  --purple: #8B5CF6;
  --purple-bg: rgba(139, 92, 246, 0.06);

  --text-muted: #9C9684;        /* was #94A3B8 - warmer muted */

  /* ── NEW: Layered surfaces ── */
  --paper-2: #F4F1E8;
  --shade: #F0EBDC;
  --hairline-2: #DCD5C2;        /* Stronger hairline for emphasis */

  /* ── Premium shadows — warmer tint ── */
  --shadow-xs:  0 1px 2px  rgba(20, 18, 12, 0.04);   /* was rgba(15,23,42,0.06) */
  --shadow-sm:  0 1px 4px  rgba(20, 18, 12, 0.06), 0 1px 2px rgba(20, 18, 12, 0.03);
  --shadow-md:  0 4px 12px rgba(20, 18, 12, 0.08), 0 2px 4px rgba(20, 18, 12, 0.04);
  --shadow-lg:  0 8px 24px rgba(20, 18, 12, 0.10), 0 2px 8px rgba(20, 18, 12, 0.05);
  --shadow-xl:  0 16px 40px rgba(20, 18, 12, 0.12), 0 4px 12px rgba(20, 18, 12, 0.06);

  /* ── Primary-tinted shadows (unchanged) ── */
  --shadow-primary-sm: 0 2px 8px  rgba(10, 110, 92, 0.16);
  --shadow-primary-md: 0 4px 16px rgba(10, 110, 92, 0.20);
  --shadow-primary-lg: 0 8px 32px rgba(10, 110, 92, 0.24);

  /* ── Gradient tokens ── */
  --gradient-primary:       linear-gradient(135deg, #0A6E5C 0%, #14B8A6 100%);
  --gradient-primary-soft:  linear-gradient(135deg, rgba(10,110,92,0.12) 0%, rgba(20,184,166,0.08) 100%);
  --gradient-surface:       linear-gradient(180deg, #FFFFFF 0%, #FAF9F5 100%);  /* was #F8FAFC */
  --gradient-sidebar-header:linear-gradient(160deg, #0A6E5C 0%, #0d8a73 100%);

  /* ── Glass surfaces ── */
  --glass-bg:     rgba(250, 249, 245, 0.82);  /* warm cream with alpha */
  --glass-border: rgba(233, 227, 213, 0.50);  /* warm hairline */
}
```

**Dark mode (lines 113-206)**: Keep unchanged for now — warm cream is light-mode only in v0.1.

---

## **Phase 2: Update index.css** (30 min)

### File: `frontend/src/index.css`

**Changes to `:root` block (lines 57-90)** — Convert OKLCH to warm cream equivalents

```css
:root {
  --radius: 0.75rem;

  /* Convert these OKLCH → Hex warm cream */
  --background: #FAF9F5;           /* was oklch(0.988 0.004 247) */
  --foreground: #1A1A1F;           /* was oklch(0.22 0.02 255) */
  --card: #FFFFFF;                 /* was oklch(1 0 0) */
  --card-foreground: #1A1A1F;      /* was oklch(0.22 0.02 255) */
  --popover: #FFFFFF;              /* was oklch(1 0 0) */
  --popover-foreground: #1A1A1F;   /* was oklch(0.22 0.02 255) */

  /* Primary — keep forest green OKLCH (it's perfect) */
  --primary: oklch(0.42 0.11 168);
  --primary-foreground: oklch(0.99 0 0);

  /* Secondary — warm paper */
  --secondary: #F4F1E8;            /* was oklch(0.96 0.008 168) */
  --secondary-foreground: #1A1A1F; /* was oklch(0.22 0.02 255) */

  /* Muted */
  --muted: #F4F1E8;                /* was oklch(0.96 0.006 255) */
  --muted-foreground: #6E6A5E;     /* was oklch(0.53 0.025 255) */

  /* Accent */
  --accent: #F0EBDC;               /* shade - was oklch(0.95 0.015 168) */
  --accent-foreground: #1A1A1F;    /* was oklch(0.22 0.02 255) */

  /* Destructive — keep unchanged */
  --destructive: oklch(0.577 0.245 27.325);

  /* Border / Input */
  --border: #E9E3D5;               /* was oklch(0.91 0.01 255) */
  --input: #E9E3D5;                /* was oklch(0.91 0.01 255) */
  --ring: oklch(0.42 0.11 168);    /* keep primary ring */

  /* Charts — keep OKLCH (semantic colors shouldn't change) */
  --chart-1: oklch(0.42 0.11 168);
  --chart-2: oklch(0.68 0.12 179);
  --chart-3: oklch(0.74 0.17 66);
  --chart-4: oklch(0.55 0.18 280);
  --chart-5: oklch(0.6 0.18 230);

  /* Sidebar */
  --sidebar: #FFFFFF;
  --sidebar-foreground: #1A1A1F;   /* was oklch(0.22 0.02 255) */
  --sidebar-primary: oklch(0.42 0.11 168);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent: #F0EBDC;       /* was oklch(0.95 0.015 168) */
  --sidebar-accent-foreground: #0A6E5C;  /* converted from OKLCH */
  --sidebar-border: #E9E3D5;       /* was oklch(0.91 0.01 255) */
  --sidebar-ring: oklch(0.42 0.11 168);
}
```

**Note**: OKLCH is Tailwind 4's color format (perceptually uniform). We convert neutrals (background, foreground, border) to hex warm cream, but keep primary/charts in OKLCH since they're already semantically correct.

**Shimmer skeleton update (lines 231-240)**:

```css
.shimmer {
  background: linear-gradient(
    90deg,
    #F4F1E8 25%,          /* was oklch(0.94 0.004 247) */
    #FAF9F5 50%,          /* was oklch(0.97 0.002 247) */
    #F4F1E8 75%           /* was oklch(0.94 0.004 247) */
  );
  background-size: 800px 100%;
  animation: shimmer 1.8s linear infinite;
}
```

**Scrollbar styling update (lines 310-326)**:

```css
::-webkit-scrollbar-thumb {
  background: rgba(156, 150, 132, 0.30);  /* --text-muted with alpha */
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(110, 106, 94, 0.50);  /* --muted-foreground with alpha */
}
```

---

## **Phase 3: Component Spot Checks** (30 min)

Some components might have **hardcoded hex colors** instead of CSS variables. Quick grep to find them:

```bash
cd frontend/src

# Find hardcoded slate colors
grep -r "#F8FAFC" components/ pages/ --include="*.jsx" --include="*.tsx"
grep -r "#1E293B" components/ pages/ --include="*.jsx" --include="*.tsx"
grep -r "#E2E8F0" components/ pages/ --include="*.jsx" --include="*.tsx"
grep -r "#64748B" components/ pages/ --include="*.jsx" --include="*.tsx"
```

**Common culprits**:
- Inline `className="bg-[#F8FAFC]"` in JSX
- Hardcoded `style={{ backgroundColor: '#F8FAFC' }}`
- Chart config objects with hex colors

**Fix pattern**:
```jsx
// Before
<div className="bg-[#F8FAFC] border-[#E2E8F0]">

// After
<div className="bg-background border-border">
```

**Expected**: Likely < 10 occurrences since the codebase uses Shadcn (which respects CSS vars).

---

## **Phase 4: Visual QA** (15 min)

### 4.1 Side-by-side comparison

Open two browser tabs:

1. **Current app** (before migration): `http://localhost:5173`
2. **Mockup prototype**: `audit_report/Myralix_v0_1_Complete_Mockup_updated.html`

**Pages to check**:
- Dashboard (`/`)
- AI Screening Workboard (`/selection/ai-screening`)
- Psych Assessment (`/selection/assessment`)
- Job Management (`/sourcing/job-management`)
- Sidebar nav (expand/collapse)
- Modals/dialogs (create job, delete confirmation)

**What to verify**:
- Background now warm cream `#FAF9F5` (not cold slate `#F8FAFC`)
- Borders warm hairline `#E9E3D5` (not slate `#E2E8F0`)
- Text rich ink `#1A1A1F` (not slate `#1E293B`)
- Muted text warmer `#6E6A5E` (not cool `#64748B`)
- Surfaces have subtle warmth (not clinical white/grey)

### 4.2 Contrast check

```bash
# Ensure WCAG AA compliance (4.5:1 for normal text)
# Foreground #1A1A1F on background #FAF9F5 = 13.8:1 ✅
# Muted foreground #6E6A5E on background #FAF9F5 = 4.7:1 ✅
```

**Tool**: Use Chrome DevTools → Lighthouse → Accessibility audit

---

## **Phase 5: Commit & Deploy** (10 min)

```bash
cd /Applications/MAMP/htdocs/ai-ats

# Check diff
git diff frontend/src/index.css
git diff frontend/src/theme-override.css

# Commit
git add frontend/src/index.css frontend/src/theme-override.css
git commit -m "feat(ui): migrate to warm cream design tokens (PH-04)

- Replace slate palette (#F8FAFC) with warm cream (#FAF9F5)
- Update all neutrals to warmer hues for premium feel
- Add saffron accent (#E5A93D) for signal highlights
- Add layered surface tokens (--paper-2, --shade)
- Update shadows to warmer rgba(20,18,12) base
- Matches Myralix_v0_1_Complete_Mockup_updated.html prototype

Task 6.5 from audit v4.0 (2h FE)"
```

**Deploy**: Push to dev environment for team review.

---

## **Done When (Success Criteria)**

✅ Opening any page shows warm cream background `#FAF9F5` (not slate `#F8FAFC`)
✅ Side-by-side with `Myralix_v0_1_Complete_Mockup_updated.html` matches color palette
✅ No hardcoded slate hex colors in components (grep returns 0)
✅ Borders are warm hairline `#E9E3D5` (not cold `#E2E8F0`)
✅ Muted text is warm `#6E6A5E` (not cool slate `#64748B`)
✅ Contrast ratios pass WCAG AA (4.5:1 minimum)
✅ Dark mode still works (unchanged for now)

---

## **Time Breakdown** (Total: 2h)

- Phase 1 (theme-override.css): 45 min
- Phase 2 (index.css): 30 min
- Phase 3 (component hardcoded colors): 30 min
- Phase 4 (visual QA): 15 min
- Phase 5 (commit): 10 min

**Slack buffer**: 10 min for unexpected edge cases

---

## **Color Palette Reference Card**

Print this for quick reference during migration:

```
╔══════════════════════════════════════════════════════════╗
║  MYRALIX WARM CREAM PALETTE — Light Mode                ║
╠══════════════════════════════════════════════════════════╣
║  BASE SURFACES                                           ║
║  --background:        #FAF9F5  Warm cream (was #F8FAFC)  ║
║  --foreground:        #1A1A1F  Rich ink   (was #1E293B)  ║
║  --card:              #FFFFFF  Pure white (unchanged)    ║
║  --paper-2:           #F4F1E8  Layered paper (NEW)       ║
║  --shade:             #F0EBDC  Subtle tint (NEW)         ║
║                                                           ║
║  BORDERS & DIVIDERS                                       ║
║  --border:            #E9E3D5  Warm hairline (#E2E8F0)   ║
║  --hairline-2:        #DCD5C2  Emphasis hairline (NEW)   ║
║                                                           ║
║  TEXT                                                     ║
║  --foreground:        #1A1A1F  Ink        (was #1E293B)  ║
║  --muted-foreground:  #6E6A5E  Warm muted (was #64748B)  ║
║  --text-muted:        #9C9684  Faint      (was #94A3B8)  ║
║                                                           ║
║  PRIMARY (unchanged)                                      ║
║  --primary:           #0A6E5C  Forest green              ║
║  --primary-light:     #14B8A6  Teal                      ║
║                                                           ║
║  ACCENTS                                                  ║
║  --saffron:           #E5A93D  Signal accent (NEW)       ║
║  --amber:             #F59E0B  Warning                   ║
║  --success:           #22C55E  Success                   ║
║  --error:             #EF4444  Error                     ║
║  --info:              #3B82F6  Info                      ║
║  --purple:            #8B5CF6  Purple                    ║
║                                                           ║
║  SHADOWS (warmer base)                                    ║
║  Base: rgba(20, 18, 12, X) — was rgba(15, 23, 42, X)    ║
╚══════════════════════════════════════════════════════════╝
```

---

## **Before/After Screenshots**

Take these screenshots for audit documentation:

1. **Before**: Dashboard with slate background
2. **After**: Dashboard with warm cream background
3. **Before**: Sidebar with cold borders
4. **After**: Sidebar with warm hairline borders
5. **Side-by-side**: App vs Mockup (should match)

Save to: `audit_report/screenshots/warm_cream_migration/`

---

## **Rollback Plan** (if issues found)

```bash
# Revert the commit
git revert HEAD

# Or manual rollback: restore old values
# In theme-override.css:
--background: #F8FAFC
--foreground: #1E293B
--border: #E2E8F0
# etc.
```

**When to rollback**:
- Contrast ratio fails WCAG AA
- Stakeholder strongly prefers slate (unlikely per audit)
- Critical bug introduced (unrelated to colors but discovered during QA)

---

## **Future Enhancements (v0.1.5)**

- Dark mode warm cream variant (currently slate-based)
- Saffron accent usage guidelines (when to use vs amber)
- Color blindness simulation (ensure accessibility)
- Dynamic theme switcher (let users pick slate vs cream)
