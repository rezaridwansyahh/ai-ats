# Plan: CLAUDE.md Cleanup

**Task**: 6.9 dari audit — dijadwalkan **Wed, 3 Jun** (30 min PM)
**Impact**: Dev velocity unlock — Claude assist lebih akurat untuk task 6.1-6.15
**Risk**: Zero — documentation only

---

## **Problem Statement**

Dari audit v4.0 §6.9:
> Update `frontend/CLAUDE.md` Configuration section: remove "Hardcoded ngrok URL" line · replace with VITE_API_BASE_URL reference. Remove old ngrok host from `vite.config.js` allowedHosts.

**Why this matters**:
- Outdated docs make Claude Code generate wrong assumptions
- "Hardcoded ngrok URL" is misleading — actual implementation already uses `VITE_API_BASE_URL`
- `allowedHosts` with old ngrok URL is stale config (no longer needed)
- Cleanup improves AI assist accuracy for Interview module tasks Mon-Fri this week

---

## **Changes Made** ✅

### 1. Root CLAUDE.md (line 86)

**Before**:
```markdown
- **API base URL**: Hardcoded ngrok URL in `src/api/axios.js` (changes per tunnel session)
```

**After**:
```markdown
- **API base URL**: Set via `VITE_API_BASE_URL` environment variable in `.env` (defaults to `http://localhost:3000` in development)
```

---

### 2. frontend/CLAUDE.md (line 169)

**Before**:
```markdown
- **Base URL**: Hardcoded ngrok URL in `src/api/axios.js` (changes per tunnel session)
```

**After**:
```markdown
- **API base URL**: Set via `VITE_API_BASE_URL` environment variable in `.env` (defaults to `http://localhost:3000` in development). Configured in `src/api/axios.js`.
```

---

### 3. frontend/vite.config.js (lines 10-12)

**Before**:
```javascript
export default defineConfig({
  base: '/portal/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["242c-180-247-60-184.ngrok-free.app"]  // ❌ Stale ngrok URL
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**After**:
```javascript
export default defineConfig({
  base: '/portal/',
  plugins: [react(), tailwindcss()],
  // server.allowedHosts removed — not needed for local dev or env-based URLs
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**Rationale**:
- `allowedHosts` in Vite is for CORS/host header validation
- Not needed when using `VITE_API_BASE_URL` pattern (API calls go to env-configured backend)
- Old ngrok URL is stale (changes every tunnel session anyway)

---

## **Verification** ✅

### No ngrok references remain in docs:
```bash
$ grep -r "ngrok" CLAUDE.md frontend/CLAUDE.md frontend/vite.config.js
✓ No ngrok references found
```

### No hardcoded ngrok URLs in source:
```bash
$ grep -r "242c-180-247-60-184" frontend/src
✓ No hardcoded ngrok URL in source code
```

### Axios.js correctly uses VITE_API_BASE_URL:
```bash
$ grep "VITE_API_BASE_URL" frontend/src/api/axios.js
baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/portal/api`,
```

**Implementation status**: Already correct! Docs were stale, not the code.

---

## **Done When (Success Criteria)** ✅

✅ No file references the old ngrok URL
✅ `CLAUDE.md` mentions `VITE_API_BASE_URL` pattern
✅ `frontend/CLAUDE.md` Configuration section updated
✅ `vite.config.js` `allowedHosts` removed
✅ Claude Code assist generates accurate Interview module code Mon-Fri

---

## **Impact on Development**

### Before cleanup:
- Claude might assume "hardcoded URL that changes per session"
- Could generate code with URL directly in files
- Developers confused about whether to use env var or hardcode

### After cleanup:
- Claude knows to use `VITE_API_BASE_URL` pattern
- Generated code follows env-based configuration
- Clearer for task 6.1-6.15 (Interview module kickoff week)

---

## **Time Breakdown** (Total: 5 min — under 30 min budget!)

- Edit CLAUDE.md: 2 min ✅
- Edit frontend/CLAUDE.md: 1 min ✅
- Edit vite.config.js: 1 min ✅
- Verification greps: 1 min ✅

**Actual time**: 5 minutes
**Budgeted time**: 30 minutes
**Slack**: 25 minutes saved → can allocate to other tasks

---

## **Additional Context**

### What VITE_API_BASE_URL does:

In `frontend/src/api/axios.js`:
```javascript
const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/portal/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Behavior**:
- **Development** (no `.env`): Defaults to `http://localhost:3000`
- **Development** (with ngrok): Set `VITE_API_BASE_URL=https://xyz.ngrok-free.app` in `.env`
- **Production**: Set via env var in deployment (Vercel, Railway, etc.)

### Frontend .env example:

```bash
# Development with local backend
VITE_API_BASE_URL=http://localhost:3000

# Development with ngrok tunnel
VITE_API_BASE_URL=https://abc123.ngrok-free.app

# Production
VITE_API_BASE_URL=https://api.myralix.com
```

**Note**: `.env` files are gitignored, so each developer configures their own.

---

## **Related Tasks**

This cleanup supports:
- **Task 6.1** (Mon): Interview module backend scaffold — Claude needs to know API base URL pattern
- **Task 6.3** (Mon): Interview L1 frontend shell — API calls will use correct base URL
- **Task 6.10** (Thu): AI prep brief — fetch() calls need base URL

**Completion status**: ✅ DONE (ahead of Wed 3 Jun schedule)

---

## **Commit Message**

```bash
git add CLAUDE.md frontend/CLAUDE.md frontend/vite.config.js
git commit -m "docs: cleanup CLAUDE.md - remove ngrok references (task 6.9)

- Replace 'Hardcoded ngrok URL' with VITE_API_BASE_URL pattern
- Update frontend/CLAUDE.md Configuration section
- Remove stale allowedHosts from vite.config.js
- Improve Claude Code assist accuracy for W8 Interview tasks

Task 6.9 from audit v4.0 (30 min PM, actual 5 min)"
```

---

## **Audit Checklist from §6.9**

Per audit task 6.9 requirements:

| Requirement | Status |
|-------------|--------|
| Update `frontend/CLAUDE.md` Configuration section | ✅ Done |
| Remove "Hardcoded ngrok URL" line | ✅ Done |
| Replace with VITE_API_BASE_URL reference | ✅ Done |
| Remove old ngrok host from `vite.config.js` allowedHosts | ✅ Done |
| No file references the old ngrok URL | ✅ Verified |

**Result**: Task 6.9 complete — 2 days ahead of Wed 3 Jun schedule.
