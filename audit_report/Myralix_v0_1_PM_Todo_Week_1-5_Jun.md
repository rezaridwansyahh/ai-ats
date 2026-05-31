# Myralix v0.1 — PM To-Do · Week of 1-5 June 2026

> **Context.** Week 7 closed with AI Screening at 100% and Psych Assessment at 85% — both real wins. Interview wasn't started. 37 days to pilot (6 Jul), zero calendar buffer. This week's PM job is (a) get the schedule decisions made cleanly, (b) keep the engineers unblocked on Interview kickoff, (c) catch any slip on Friday rather than W10.

---

## 🔥 Tonight or Monday morning (before the standup)

- [ ] Re-read audit v4.0 — focus on §6 (next-week plan), §7 R-1, §8 D-7 and D-8
- [ ] Write down my own recommendation for D-7 in one sentence — what I'd argue if put on the spot
- [ ] **1:1 pre-brief with CEO and Eng Lead on D-7 before the meeting, not in it.** Surprise decisions in a group setting go badly; 15 min each ahead of time is the unlock
- [ ] Ping both engineers: any carried-over blockers? Can they actually start Interview Monday morning, both parallel?
- [ ] Get the current pilot-recruitment count from GTM — even rough is fine, but I need a number, not a vibe

---

## 📋 At Monday's weekly meeting (1 Jun)

- [ ] Open with what shipped — Q&A engine, Psych portal. Celebrate first, then math
- [ ] Walk through §3 progress bars (48%) and §6 schedule in ≤5 minutes
- [ ] **Force a decision on D-7.** Don't let it become "we'll see how the week goes." The three options:
  - **Hold 6 Jul** → triggers D-8 (scope reduction) immediately, today
  - **Slip to 13 Jul** → cleanest path, communicate to pilots this week (my recommendation in the audit)
  - **Hybrid (private slip, public hold)** → discourage; either commits half-heartedly
- [ ] Get D-8 contingent decisions if D-7 = hold (BG MVP? Onboarding MVP? Offer MVP?)
- [ ] Confirm tasks **6.5 (warm cream tokens, 2h)** and **6.9 (CLAUDE.md cleanup, 5 min)** land this week — these have been deferred two weeks running
- [ ] Confirm engineer split for Interview: **BE on services + 5 migration tables, FE on L1/L2/L3 shells**
- [ ] Capture decisions in writing before EOD Monday, share back to attendees same day

---

## 📆 Daily standups (Tue-Fri) — 5 min each

Five signals to track. If any is red, surface it that morning, not Friday.

- [ ] **Tue:** Did Mon's tasks 6.1, 6.2, 6.3 land? (BE scaffold mounted at `/api/interview`, 5 migration tables, FE L1 shell at `/selection/interview`)
- [ ] **Wed:** Is L2 Position visible? Did warm cream tokens get applied? (tasks 6.4, 6.5)
- [ ] **Thu:** Does L3 candidate detail render? Did sidebar reshape to 6 groups land? (tasks 6.7, 6.8)
- [ ] **Fri morning:** Is Prep brief AI generation streaming end-to-end? Is Schedule tab saving? (tasks 6.10, 6.11)
- [ ] **Fri afternoon: Run the smoke test from task 6.14. This is the go/no-go signal for D-7.**

---

## 🚦 Friday 5 June — the go/no-go gate

The full smoke: login as Myralix user → create job → post to Seek → AI screen → send Q&A → advance top candidate to Interview → open Interview L3 → generate prep brief → schedule R1.

- [ ] **If it works end-to-end:** 6 Jul stays plausible. Continue per audit §6 W9 plan (Conduct, Evaluate, Decide tabs in W9)
- [ ] **If it doesn't:** activate the D-7 = slip fallback today. Don't wait for Monday's standup. Slipping in W8 costs 1 week to communicate. Slipping in W10 costs trust.

---

## 📣 If D-7 = slip to 13 Jul (communications work)

- [ ] Update pilot pitch deck — change "6 Jul launch" to "13 Jul launch"
- [ ] Draft the pilot email Monday afternoon, send by Tuesday. Short, factual, CEO-signed. One reason given, not three. No apology theater
- [ ] Update Linear / Notion / wherever the pilot date is referenced (search for "6 Jul", "6 July", "July 6")
- [ ] Update GTM-facing surfaces — landing site, demo booking page if it mentions a date
- [ ] Update D-4 (pilot cohort floor) deadlines proportionally — 27 Jun → 4 Jul

---

## ⚙️ If D-7 = hold 6 Jul (scope reduction work)

- [ ] Write a 1-page D-8 memo by Monday EOD: which de-scopes, which v0.1.5 items, what pilots will and won't see
- [ ] Share with both engineers Monday afternoon — they need this before committing to W10-W12 estimates
- [ ] Tag affected items in Module Guide §11 (BG) / §12 (Offer) / §13 (Onboarding) with "v0.1.5 deferred"
- [ ] Add a "v0.1 scope" section to pilot onboarding docs so pilots aren't surprised in W12

---

## 📊 Pilot recruitment (parallel track all week)

- [ ] Get an honest count from GTM by Monday afternoon. If under 10 → escalate to leadership this week, not next
- [ ] If still under 10 by Friday 5 Jun, raise R-5 at next standup with proposed contingency (smaller cohort of 10-15)
- [ ] Document the outreach plan for the next 2 weeks: who's contacting whom, by when
- [ ] Lock in pilot kickoff calendar invites for the launch week (6 Jul or 13 Jul depending on D-7) by EOW

---

## 🧹 Personal admin (Friday afternoon, 2h block)

- [ ] Write next week's audit refresh — read GitHub Friday afternoon, write Saturday morning, share Sunday for Monday meeting
- [ ] Brief 1-page exec summary (CEO version, not engineering version): what shipped, what slipped, what decided, what's open
- [ ] Block calendar for next Friday's smoke test — it's a 2-hour session with both engineers, don't let it get scheduled over

---

## 🔭 What I'm watching this week (risk signals)

| Risk | Signal that it's becoming real | What I do if I see it |
|---|---|---|
| **R-1** Interview slip past 12 Jun | Tue or Wed standup shows tasks 6.1–6.3 not landed | Activate D-7 = slip on Wed, not Fri |
| **R-2** PPh21/BPJS math | N/A this week — Offer module starts W11 | Park; review week of 22 Jun |
| **R-5** Pilot count <10 | GTM can't give a number Monday | Escalate to CEO same day |
| **Two-week pattern** Depth over breadth recurs | Standup signals "let's polish Psych more" | Push back hard. Interview is the only thing that matters this week |

---

## 🎯 The one-sentence test

At the end of the week, the answer to this question should be **yes**:

> *Did Interview move from 0% to ~30% — backend mounted, frontend L1/L2 visible, prep brief AI working end-to-end — and did I have D-7 decided in writing by Monday EOD?*

If yes, the pilot is back on a credible path. If no, we're in W8 of "depth over breadth" and the schedule is no longer real.
