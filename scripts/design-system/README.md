# Design System Migration Scripts

Automation tools for maintaining Myralix warm cream design system.

## Scripts

### 1. `find-hardcoded-colors.sh`

Find all hardcoded hex colors in JSX/JS files that should use CSS variables.

**Usage**:
```bash
./find-hardcoded-colors.sh [directory]
```

**Examples**:
```bash
# Search in components
./find-hardcoded-colors.sh frontend/src/components

# Search entire frontend
./find-hardcoded-colors.sh frontend/src
```

**Output**:
- List of files with hardcoded colors
- Count per file
- Top 5 most common colors
- Recommendations for fixing

**Exit codes**:
- `0` - No hardcoded colors found ✅
- `1` - Hardcoded colors detected ❌

---

### 2. `replace-color.sh`

Batch replace a hex color across all JSX/JS files with confirmation.

**Usage**:
```bash
./replace-color.sh <OLD_COLOR> <NEW_COLOR> [directory]
```

**Examples**:
```bash
# Replace slate background with warm cream
./replace-color.sh '#F8FAFC' '#FAF9F5'

# Replace in specific directory
./replace-color.sh '#E2E8F0' '#E9E3D5' frontend/src/components/assessment-d

# Replace old muted text
./replace-color.sh '#64748B' '#6E6A5E'
```

**Features**:
- Validates hex color format
- Shows preview of files to be modified
- Requires confirmation before replacement
- Reports before/after counts
- Safe (prompts before changes)

**Exit codes**:
- `0` - Replacement successful
- `1` - Error or aborted by user

---

### 3. `verify-colors.sh`

Verify that warm cream migration is complete and no old slate colors remain in light mode.

**Usage**:
```bash
./verify-colors.sh [directory]
```

**Examples**:
```bash
# Verify entire frontend
./verify-colors.sh frontend/src

# Verify specific directory
./verify-colors.sh frontend/src/components
```

**Checks**:
1. ✅ **Old slate colors** - Should be 0 in light mode
2. ✅ **New warm cream colors** - Should exist in theme files
3. ✅ **Shadow base** - Should use warm `rgba(20, 18, 12)` not cool `rgba(15, 23, 42)`
4. ✅ **New tokens** - `--saffron`, `--paper-2`, `--shade`, `--hairline-2` should exist

**Notes**:
- Dark mode (`.dark`) is excluded - warm cream dark mode is a future enhancement
- Only checks light mode colors

**Exit codes**:
- `0` - Verification passed ✅
- `1` - Errors found ❌

---

## Warm Cream Color Reference

### Old Slate → New Warm Cream

| Token | Old (Slate) | New (Warm Cream) | Usage |
|-------|-------------|------------------|-------|
| Background | `#F8FAFC` | `#FAF9F5` | Page background |
| Foreground | `#1E293B` | `#1A1A1F` | Body text |
| Border | `#E2E8F0` | `#E9E3D5` | Dividers, outlines |
| Muted | `#F1F5F9` | `#F4F1E8` | Secondary background |
| Muted Text | `#64748B` | `#6E6A5E` | Muted foreground |
| Faint Text | `#94A3B8` | `#9C9684` | Very muted text |

### New Tokens (Added)

| Token | Hex | Usage |
|-------|-----|-------|
| `--saffron` | `#E5A93D` | Signal accent (warnings, highlights) |
| `--paper-2` | `#F4F1E8` | Layered surface |
| `--shade` | `#F0EBDC` | Subtle background tint |
| `--hairline-2` | `#DCD5C2` | Emphasis border |

---

## Workflow Example

### Scenario: Migrate a New Feature to Warm Cream

1. **Find hardcoded colors**:
   ```bash
   ./find-hardcoded-colors.sh frontend/src/components/new-feature
   ```

2. **Replace each color**:
   ```bash
   ./replace-color.sh '#F8FAFC' '#FAF9F5' frontend/src/components/new-feature
   ./replace-color.sh '#E2E8F0' '#E9E3D5' frontend/src/components/new-feature
   ./replace-color.sh '#64748B' '#6E6A5E' frontend/src/components/new-feature
   ```

3. **Verify migration**:
   ```bash
   ./verify-colors.sh frontend/src/components/new-feature
   ```

4. **Review changes**:
   ```bash
   git diff frontend/src/components/new-feature
   ```

5. **Commit**:
   ```bash
   git add frontend/src/components/new-feature
   git commit -m "refactor(new-feature): migrate to warm cream design tokens"
   ```

---

## ESLint Integration

The ESLint rule `local/no-hardcoded-hex` will warn on new hardcoded hex colors:

```bash
cd frontend && npm run lint
```

**Example warning**:
```
src/components/MyComponent.jsx
  42:25  warning  Avoid hardcoded hex colors. Use CSS variables instead (e.g., var(--background), var(--primary))  local/no-hardcoded-hex
```

**Fix**: Replace inline style with CSS variable or Tailwind class:
```jsx
// ❌ Before
<div style={{ background: '#FAF9F5' }}>

// ✅ After (preferred)
<div className="bg-background">

// ✅ After (acceptable if no Tailwind class)
<div style={{ background: 'var(--background)' }}>
```

---

## Troubleshooting

### Script won't run: "Permission denied"

Make scripts executable:
```bash
chmod +x scripts/design-system/*.sh
```

### False positives in verification

If verify script reports colors in dark mode, ignore - dark mode uses slate per plan.

Check the line numbers:
- Lines 122-206 in `theme-override.css` are dark mode (ignored by script)

### Colors in comments/strings

`replace-color.sh` may replace colors in code comments or string literals.

**Solution**: Review `git diff` before committing.

---

## Related Documentation

- **[CLAUDE.md](../../CLAUDE.md)** - Design system guidelines
- **[theme-override.css](../../frontend/src/theme-override.css)** - Warm cream CSS variables
- **[warm_cream_tokens_plan_ENHANCED.md](../../development_plan/warm_cream_tokens_plan_ENHANCED.md)** - Full migration plan and rationale

---

## Migration History

- **9a0f932** - Initial warm cream migration (33 files, 145 insertions)
- **53aec43** - Add enforcement tooling and documentation (19 files, 1462 insertions)

---

**Status**: ✅ Active tooling for ongoing design system maintenance
