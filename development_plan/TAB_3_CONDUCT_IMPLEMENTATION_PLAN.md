# 🎯 TAB 3: CONDUCT — IMPLEMENTATION PLAN

**Priority:** 🔴 CRITICAL (Week 10 — Tue 16 Jun)
**Effort:** ~3 hours
**Dependencies:** `interview_round` table must exist first
**Status:** 0% → 100% by Tue 16 Jun 17:00

---

## 📋 OVERVIEW

### **What is Conduct Tab?**
The Conduct tab is where the **interviewer conducts the actual interview** and captures notes in real-time. This is the "in-flight" stage where the interview is happening or has just finished.

### **User Story:**
> As an **interviewer (panelist)**, I want to **capture interview notes during or after the interview** so that **I can evaluate the candidate later in the Evaluate tab**.

### **Current State:**
```jsx
{activeSection === 'conduct' && (
  <ComingSoonSection label="Conduct" />  // ❌ Placeholder
)}
```

**Target State:**
```jsx
{activeSection === 'conduct' && (
  <ConductSection
    interviewId={interviewId}
    interview={interview}
    setInterview={setInterview}
    setBanner={setBanner}
    setError={setError}
  />  // ✅ Full component
)}
```

---

## 🎨 UI DESIGN SPECIFICATION

### **Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Conduct Tab                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📋 Interview Questions (Reference)                    │  │
│  │ ───────────────────────────────────────────────────── │  │
│  │ Collapsible panel showing AI-generated questions      │  │
│  │ from Prep tab as a guide for the interviewer         │  │
│  │                                                        │  │
│  │ 1. Tell me about your experience with...             │  │
│  │    Competency: HRD-03 (Problem Solving)               │  │
│  │                                                        │  │
│  │ 2. How do you approach team conflicts?               │  │
│  │    Competency: HRD-06 (Teamwork)                      │  │
│  │                                                        │  │
│  │ [Show 5 questions, Click "Show all 12" to expand]    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ⏱️  Interview Duration: 47 min 32 sec                 │  │
│  │     Started at: 14:30 | Current time: 15:17          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✏️  Interview Notes                                    │  │
│  │ ───────────────────────────────────────────────────── │  │
│  │ ┌─────────────────────────────────────────────────┐  │  │
│  │ │ Capture notes during or after the interview...  │  │  │
│  │ │                                                  │  │  │
│  │ │ • Technical skills discussed:                   │  │  │
│  │ │   - Candidate demonstrated strong React skills  │  │  │
│  │ │   - Good understanding of state management      │  │  │
│  │ │                                                  │  │  │
│  │ │ • Cultural fit observations:                    │  │  │
│  │ │   - Collaborative mindset                       │  │  │
│  │ │   - Aligns with company values                  │  │  │
│  │ │                                                  │  │  │
│  │ │ • Red flags or concerns:                        │  │  │
│  │ │   - None identified                             │  │  │
│  │ │                                                  │  │  │
│  │ │ • Follow-up questions needed:                   │  │  │
│  │ │   - Ask about previous team size in next round  │  │  │
│  │ │                                                  │  │  │
│  │ └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │ 💾 Auto-saved 3 seconds ago                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Actions                                                │  │
│  │ ───────────────────────────────────────────────────── │  │
│  │                                                        │  │
│  │  [💾 Save Draft]  [✅ Mark Interview Complete →]      │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPONENT BREAKDOWN

### **1. Interview Questions Reference Panel**

**Purpose:** Show AI-generated questions as a guide for the interviewer.

**Features:**
- 📋 Display questions from `prep.questions` (loaded from parent)
- 🎯 Show competency code for each question
- 📖 Collapsible (default: show first 5, "Show all X" to expand)
- 🔒 Read-only (no editing in Conduct tab)

**UI Specs:**
- Border: Light border, subtle background (`bg-muted/20`)
- Typography: Question text 13px, competency badge 10px
- Spacing: Gap between questions 12px
- Collapse: Smooth animation, chevron icon rotation

**Data:**
```js
const questions = prep?.questions || [];
// Each question:
// {
//   text: "Tell me about...",
//   competency: "HRD-03",
//   follow_up: "Can you give an example?"
// }
```

**Edge Cases:**
- No questions generated yet → Show message: "No questions available. Generate questions in Prep tab first."
- Empty prep → Graceful degradation, hide panel

---

### **2. Interview Duration Timer**

**Purpose:** Track how long the interview has been running.

**Features:**
- ⏱️ Real-time elapsed time counter
- 🕐 Start time display
- 🕑 Current time display
- ⏸️ Pause/Resume (optional enhancement)

**UI Specs:**
- Display format: `"47 min 32 sec"` or `"1 hr 23 min"`
- Icon: Clock icon (from lucide-react)
- Position: Below questions panel, above notes
- Color: Muted foreground
- Update frequency: Every second

**Technical Implementation:**
```js
const [startTime] = useState(new Date()); // or load from backend
const [elapsed, setElapsed] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000); // seconds
    setElapsed(diff);
  }, 1000);

  return () => clearInterval(timer);
}, [startTime]);

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min ${secs} sec`;
};
```

**Edge Cases:**
- Timer > 2 hours → Show warning: "Interview has been running for over 2 hours"
- Timer paused → Show "Paused" badge

---

### **3. Interview Notes Textarea**

**Purpose:** Capture free-form notes during the interview.

**Features:**
- ✏️ Large textarea (min-height: 400px)
- 💾 Auto-save every 30 seconds
- 📝 Character counter (optional)
- 🖊️ Markdown preview (optional enhancement)

**UI Specs:**
- Font: Monospace (`font-mono`) for better note-taking
- Size: `text-sm` (13px)
- Placeholder: Multi-line prompt with examples
- Border: Standard border, focus ring
- Resize: Vertical resize allowed

**Placeholder Text:**
```
Capture notes during or after the interview...

• Technical skills discussed:
  -

• Cultural fit observations:
  -

• Red flags or concerns:
  -

• Follow-up questions needed:
  -
```

**Auto-Save Logic:**
```js
const [notes, setNotes] = useState('');
const [lastSaved, setLastSaved] = useState(null);
const [isSaving, setIsSaving] = useState(false);

// Debounced auto-save
useEffect(() => {
  const timer = setTimeout(() => {
    if (notes !== interview?.notes) {
      saveNotes();
    }
  }, 30000); // 30 seconds

  return () => clearTimeout(timer);
}, [notes]);

const saveNotes = async () => {
  setIsSaving(true);
  try {
    await updateInterviewStatus(interviewId, {
      notes,
      status: 'in_progress' // keep status if already in_progress
    });
    setLastSaved(new Date());
  } catch (err) {
    setError('Failed to auto-save notes');
  } finally {
    setIsSaving(false);
  }
};
```

**Auto-Save Indicator:**
```jsx
<div className="text-xs text-muted-foreground flex items-center gap-1.5">
  {isSaving ? (
    <>
      <Loader2 className="h-3 w-3 animate-spin" />
      Saving...
    </>
  ) : lastSaved ? (
    <>
      <Check className="h-3 w-3 text-green-600" />
      Auto-saved {formatTimeAgo(lastSaved)}
    </>
  ) : (
    <>
      <AlertCircle className="h-3 w-3 text-amber-600" />
      Not saved yet
    </>
  )}
</div>
```

**Edge Cases:**
- Network error during auto-save → Show warning, retry
- User leaves tab before auto-save → Warn: "You have unsaved notes"
- Notes exceed 10,000 chars → Show warning

---

### **4. Action Buttons**

**Purpose:** Save draft or mark interview complete.

**Features:**
- 💾 **Save Draft** button (secondary)
  - Saves notes immediately
  - Doesn't change status
  - Shows success toast

- ✅ **Mark Interview Complete** button (primary)
  - Saves notes
  - Transitions status: `in_progress → done`
  - Enables Evaluate tab
  - Shows confirmation dialog (optional)

**UI Specs:**
- Layout: Horizontal flex, gap 8px
- Save Draft: Outlined button, smaller
- Mark Complete: Filled primary button, larger
- Icon: Save icon for draft, Check icon for complete
- Disabled state: If notes empty (optional rule)

**Mark Complete Logic:**
```js
const handleMarkComplete = async () => {
  if (!notes.trim()) {
    if (!confirm('No notes captured. Mark complete anyway?')) {
      return;
    }
  }

  setLoading(true);
  try {
    // Save notes + update status
    await updateInterviewStatus(interviewId, {
      notes,
      status: 'done'  // Key transition
    });

    // Update parent state
    setInterview({ ...interview, status: 'done', notes });

    // Show success
    setBanner({
      ok: true,
      text: 'Interview marked complete. You can now evaluate the candidate.'
    });

    // Auto-switch to Evaluate tab (optional)
    // setActiveSection('evaluate');

  } catch (err) {
    setError(err.response?.data?.message || 'Failed to mark complete');
  } finally {
    setLoading(false);
  }
};
```

**Confirmation Dialog:**
```jsx
// Optional: Show confirmation before marking complete
const confirmComplete = () => {
  return window.confirm(
    'Mark interview as complete?\n\n' +
    'This will:\n' +
    '• Save your notes\n' +
    '• Enable the Evaluate tab\n' +
    '• Change status to "Done"\n\n' +
    'Continue?'
  );
};
```

---

## 🔌 BACKEND INTEGRATION

### **API Endpoints Needed:**

#### **1. Get Current Round Data**
```
GET /api/interview/:interview_id/rounds/:round_number

Response:
{
  "round": {
    "id": 123,
    "interview_id": 456,
    "round_number": 1,
    "status": "in_progress",
    "notes": "Candidate showed strong...",
    "started_at": "2026-06-16T14:30:00Z",
    "created_at": "2026-06-15T10:00:00Z"
  }
}
```

#### **2. Update Round (Save Notes / Mark Complete)**
```
PATCH /api/interview/rounds/:round_id

Body:
{
  "notes": "Updated notes text...",
  "status": "done"  // Optional: only if marking complete
}

Response:
{
  "message": "Round updated",
  "round": { ...updated round }
}
```

### **State Machine Validation:**
Backend must validate status transitions:
- ✅ `in_progress → done` (allowed)
- ❌ `in_progress → decided` (blocked, must go through `done` first)

---

## 📝 COMPONENT CODE STRUCTURE

### **File Location:**
```
frontend/src/components/interview/Interview-Candidate.jsx
```

### **Code Placement:**
Add `ConductSection` function after `ScheduleSection` (around line 780):

```jsx
// ─── Conduct Section ──────────────────────────────────────────────────────────
function ConductSection({ interviewId, interview, setInterview, setBanner, setError }) {
  // State
  const [notes, setNotes] = useState(interview?.notes || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [startTime] = useState(new Date(interview?.started_at || Date.now()));
  const [elapsed, setElapsed] = useState(0);

  // Load prep questions from parent
  const questions = prep?.questions || [];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setElapsed(Math.floor((now - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== interview?.notes) {
        handleSaveDraft();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [notes]);

  // Handlers
  const handleSaveDraft = async () => { ... };
  const handleMarkComplete = async () => { ... };

  // Render
  return (
    <div className="space-y-4">
      {/* Questions Reference Panel */}
      <Card>...</Card>

      {/* Duration Timer */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Interview Duration: {formatDuration(elapsed)}
      </div>

      {/* Notes Textarea */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Interview Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={NOTES_PLACEHOLDER}
            className="min-h-[400px] font-mono text-sm"
          />

          {/* Auto-save indicator */}
          <div className="text-xs text-muted-foreground">
            {/* ... */}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleMarkComplete} disabled={saving}>
          <Check className="h-4 w-4 mr-2" />
          Mark Interview Complete →
        </Button>
      </div>
    </div>
  );
}

const NOTES_PLACEHOLDER = `Capture notes during or after the interview...

• Technical skills discussed:
  -

• Cultural fit observations:
  -

• Red flags or concerns:
  -

• Follow-up questions needed:
  - `;
```

### **Update Main Component Rendering:**
```jsx
// Line 252-254: Replace
{(activeSection === 'conduct' || activeSection === 'evaluate' || activeSection === 'decide') && (
  <ComingSoonSection label={SECTIONS.find((s) => s.key === activeSection)?.label} />
)}

// With:
{activeSection === 'conduct' && (
  <ConductSection
    interviewId={interviewId}
    interview={interview}
    setInterview={setInterview}
    setBanner={setBanner}
    setError={setError}
    prep={prep}
  />
)}

{(activeSection === 'evaluate' || activeSection === 'decide') && (
  <ComingSoonSection label={SECTIONS.find((s) => s.key === activeSection)?.label} />
)}
```

---

## ✅ ACCEPTANCE CRITERIA

### **Must Have (Core Features):**
- [ ] Interview questions reference panel displays (from Prep tab)
- [ ] Notes textarea with min-height 400px
- [ ] Auto-save every 30 seconds
- [ ] Auto-save indicator shows status
- [ ] "Mark Interview Complete" button works
- [ ] Status transitions `in_progress → done`
- [ ] Notes persist after page reload
- [ ] No console errors
- [ ] Mobile responsive (textarea resizes on mobile)

### **Should Have (Enhanced UX):**
- [ ] Duration timer shows elapsed time
- [ ] Save Draft button provides immediate feedback
- [ ] Success banner after marking complete
- [ ] Confirmation dialog before marking complete (if notes empty)
- [ ] Questions panel collapsible (show 5, expand to all)
- [ ] Graceful error handling (network issues)

### **Nice to Have (Optional):**
- [ ] Character counter on notes
- [ ] Markdown preview toggle
- [ ] Timer pause/resume functionality
- [ ] Keyboard shortcut (Ctrl+S to save)
- [ ] Warning before leaving page with unsaved notes
- [ ] Export notes to PDF

---

## 🧪 TESTING CHECKLIST

### **Manual Testing:**
1. **Load Tab:**
   - [ ] Navigate to Conduct tab → Component renders
   - [ ] Questions from Prep tab display correctly
   - [ ] Timer starts counting
   - [ ] Existing notes (if any) load in textarea

2. **Notes Capture:**
   - [ ] Type in textarea → Characters appear
   - [ ] Wait 30 seconds → Auto-save indicator shows "Saving..."
   - [ ] Wait for save → Indicator shows "Auto-saved X seconds ago"
   - [ ] Refresh page → Notes persist

3. **Save Draft:**
   - [ ] Click "Save Draft" → Loading state shows
   - [ ] Success → Success banner appears
   - [ ] Error (disconnect network) → Error message shows

4. **Mark Complete:**
   - [ ] Click "Mark Complete" → Confirmation dialog (if notes empty)
   - [ ] Confirm → Status changes to "done"
   - [ ] Success → Success banner shows
   - [ ] Check backend → `interview_round.status = 'done'`
   - [ ] Navigate to Evaluate tab → Should be accessible

5. **Edge Cases:**
   - [ ] No prep questions → Panel shows empty state message
   - [ ] Notes > 10,000 chars → Warning shows
   - [ ] Network error during auto-save → Retry logic works
   - [ ] Timer > 2 hours → Warning shows

6. **Mobile Responsiveness:**
   - [ ] Textarea resizes on mobile viewport
   - [ ] Buttons stack vertically on mobile
   - [ ] Questions panel readable on mobile

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     CONDUCT TAB DATA FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. LOAD PHASE
   ┌──────────────┐
   │ User clicks  │
   │ Conduct tab  │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────┐
   │ Frontend loads:     │
   │ • interview data    │    (from parent state)
   │ • prep.questions    │    (from parent state)
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ GET /rounds/:id     │    (if round exists)
   │ Load existing notes │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Render component:   │
   │ • Questions panel   │
   │ • Timer starts      │
   │ • Notes textarea    │
   └─────────────────────┘

2. EDIT PHASE
   ┌──────────────┐
   │ User types   │
   │ in textarea  │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────┐
   │ Update notes state  │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────┐
   │ Wait 30 seconds...  │
   └──────┬──────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ Auto-save triggered     │
   │ PATCH /rounds/:id       │
   │ { notes: "..." }        │
   └──────┬──────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ Update lastSaved time   │
   │ Show indicator          │
   └─────────────────────────┘

3. COMPLETE PHASE
   ┌──────────────────┐
   │ User clicks      │
   │ Mark Complete    │
   └──────┬───────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ Confirmation dialog     │
   │ (if notes empty)        │
   └──────┬──────────────────┘
          │ Confirm
          ▼
   ┌─────────────────────────────┐
   │ PATCH /rounds/:id           │
   │ {                           │
   │   notes: "...",             │
   │   status: "done"            │
   │ }                           │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Backend validates:          │
   │ • in_progress → done? ✅    │
   │ • Updates DB                │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Frontend updates:           │
   │ • interview.status = "done" │
   │ • Show success banner       │
   │ • Enable Evaluate tab       │
   └─────────────────────────────┘
```

---

## 🚨 RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Auto-save fails silently** | High (data loss) | Medium | Show clear error message, retry logic, local storage backup |
| **User leaves page with unsaved notes** | Medium (frustration) | High | `beforeunload` event warning, prompt to save |
| **Timer stops on page reload** | Low (informational only) | Medium | Store start_time in backend, recalculate on load |
| **Notes exceed DB field limit** | Medium (save fails) | Low | Character limit validation, show warning at 90% |
| **Status transition rejected** | High (broken flow) | Low | Backend validation + frontend pre-check |
| **Slow network → auto-save lag** | Medium (confusion) | Medium | Clear loading state, show retry count |

---

## 📅 IMPLEMENTATION TIMELINE

### **Tuesday 16 June (3 hours):**

**09:00 - 10:00** — Component Shell
- [ ] Create `ConductSection` function
- [ ] Set up state variables
- [ ] Add to main component rendering

**10:00 - 11:00** — Questions Panel + Timer
- [ ] Build questions reference panel
- [ ] Implement collapsible logic
- [ ] Add duration timer with formatting

**11:00 - 12:00** — Notes Textarea + Auto-Save
- [ ] Build notes textarea with placeholder
- [ ] Implement auto-save logic (debounced)
- [ ] Add auto-save indicator

**14:00 - 15:00** — Action Buttons + Integration
- [ ] Build Save Draft button
- [ ] Build Mark Complete button
- [ ] Wire up API calls
- [ ] Add error handling

**15:00 - 16:00** — Testing + Polish
- [ ] Manual testing checklist
- [ ] Fix bugs
- [ ] Mobile responsive check
- [ ] Code review

**16:00 - 17:00** — Buffer
- [ ] Handle any blockers
- [ ] Documentation
- [ ] Commit + push

---

## 🎯 SUCCESS METRICS

**Definition of Done:**
- [x] Can type notes in textarea
- [x] Auto-save works every 30 seconds
- [x] "Mark Complete" changes status to "done"
- [x] Notes persist after page reload
- [x] Evaluate tab becomes accessible after complete
- [x] No console errors
- [x] Mobile responsive

**Demo Scenario:**
1. Open Conduct tab → Questions panel shows 5 AI questions
2. Timer shows "0 min 5 sec" and counting
3. Type notes: "Candidate demonstrated strong React skills..."
4. Wait 30 seconds → Indicator shows "Auto-saved 2 seconds ago"
5. Click "Mark Complete" → Confirmation dialog appears
6. Confirm → Success banner: "Interview marked complete"
7. Status badge changes to "Done"
8. Evaluate tab is now clickable (not disabled)

---

## 🔗 RELATED DOCUMENTS

- **Main Plan:** `INTERVIEW_MODULE_TODO.md` (Task Group 2)
- **Flow:** `INTERVIEW_MODULE_FLOW.md` (Section: Stage ③ Conduct)
- **Current Code:** `frontend/src/components/interview/Interview-Candidate.jsx`
- **Backend Spec:** (To be created: `TAB_3_CONDUCT_BACKEND_SPEC.md`)

---

**Document Version:** 1.0
**Created:** 14 June 2026
**Owner:** Frontend Engineer
**Status:** Ready for Implementation
**Target:** Tue 16 Jun 17:00 ✅
