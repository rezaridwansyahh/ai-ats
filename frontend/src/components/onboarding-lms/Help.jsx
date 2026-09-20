import { useState } from 'react';
import {
  MessageCircle, Calendar, ExternalLink, ChevronRight, ChevronDown,
  FileText, Monitor, Flag, Plus, ArrowRight, PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ---------- local content (no backend / no mock data yet for this screen) ---------- */

const CONTACTS = [
  { id: 'buddy', name: 'Rizky Wijaya', role: 'Your buddy · Senior Engineer', initials: 'RW', avatarBg: 'bg-blue-700', channel: 'Slack DM', meta: '@rizky.w', online: true },
  { id: 'manager', name: 'Sari Hapsari', role: 'Hiring manager · Eng. Platform', initials: 'SH', avatarBg: 'bg-emerald-700', channel: 'Slack DM', meta: '@sari.h', online: true },
  { id: 'peopleops', name: 'People Ops', role: 'HR · onboarding & relations', initials: 'PO', avatarBg: 'bg-amber-800', channel: '#people-help', meta: 'avg reply 2h', online: false },
  { id: 'it', name: 'IT Helpdesk', role: 'Laptops · access · VPN · email', initials: 'IT', avatarBg: 'bg-amber-900', channel: '#it-helpdesk', meta: '24/7 SLA', online: true },
  { id: 'office', name: 'Office Admin', role: 'Building · parking · supplies', initials: 'OA', avatarBg: 'bg-neutral-800', channel: '#office', meta: 'Jakarta HQ', online: true },
  { id: 'ethics', name: 'EthicsLine', role: 'Confidential · anonymous option', initials: 'EL', avatarBg: 'bg-orange-800', channel: 'External portal', meta: '24/7', online: true },
];

const UPCOMING_SYNCS = [
  { when: 'Tomorrow · 09:30', title: 'Code review walkthrough — your first PR', dur: '30 min' },
  { when: 'Fri Mar 28 · 14:00', title: 'Sprint rituals — what to expect Monday', dur: '25 min' },
  { when: 'Mon Mar 31 · 10:00', title: 'Mid-phase check-in with Sari', dur: '20 min' },
];

const FAQS = [
  {
    q: 'What happens if I miss a module deadline?',
    a: "Nothing punitive on the first miss — you'll get a nudge and the due date quietly rolls forward a few days. If a module goes more than a week overdue, your buddy gets looped in so they can check whether something's blocking you.",
  },
  {
    q: 'Can I retake a post-test if I failed?',
    a: 'Yes — unlimited attempts, with a 24-hour cooldown between each. The cooldown is intentional: it gives you time to review material rather than guess again. Your highest score is what counts toward completion; earlier attempts are kept for your private review only.',
  },
  {
    q: 'How is my progress visible to my manager?',
    a: 'Your manager sees phase-level completion and overall pace — not quiz answers or time spent per screen. Anything below that granularity stays between you and the platform.',
  },
  {
    q: 'What if my buddy is unresponsive or not a good fit?',
    a: 'Message People Ops directly, or use "Request a different buddy" on this page. Reassignments happen quietly — your original buddy isn\'t notified of the reason unless you want them to be.',
  },
  {
    q: 'Can I learn modules out of order?',
    a: "Within a phase, yes — reorder freely. Phases themselves stay locked in sequence since later material assumes you've covered the earlier compliance content.",
  },
  {
    q: 'Where do I report something sensitive — harassment, safety, ethics?',
    a: 'Use EthicsLine (external, confidential, anonymous option available) or go straight to People Ops. Neither your buddy nor your manager are in that loop unless you choose to include them.',
  },
];

const RESOURCES = [
  { title: 'Employee Handbook — 2026 edition', source: 'SharePoint · HR/Handbook', icon: FileText },
  { title: 'Org chart — engineering', source: 'SharePoint · People/Org', icon: Monitor },
  { title: 'Benefits & insurance — what you have', source: 'SharePoint · HR/Benefits', icon: FileText },
  { title: 'Slack channel guide for new hires', source: 'Notion · Onboarding', icon: FileText },
  { title: 'Glossary — acronyms we use daily', source: 'Notion · Onboarding', icon: FileText },
  { title: 'EthicsLine reporting portal', source: 'ethicsline.abhimeta.id', icon: Flag },
];

const UNREAD_MESSAGES = [
  { name: 'Rizky Wijaya', initials: 'RW', avatarBg: 'bg-blue-700', when: '12 min ago', text: 'Quick heads-up — moved our Friday sync 30 min later. Same agenda. Confirm if it still works?', unread: true },
  { name: 'Sari Hapsari', initials: 'SH', avatarBg: 'bg-emerald-700', when: 'Yesterday', text: 'Saw you cleared the K3 module ahead of schedule. Nice. Want to pair on the on-call shadow next week?', unread: true },
  { name: 'Rizky Wijaya', initials: 'RW', avatarBg: 'bg-blue-700', when: '2 days ago', text: 'Sent you the deploy runbook draft — let me know if Section 3 makes sense.', unread: false },
];

/* ---------- small building blocks ---------- */

function SectionCard({ seq, title, subtitle, right, children }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b">
        <span className="font-serif text-lg text-muted-foreground w-6 flex-shrink-0 pt-0.5">{seq}</span>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-base font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-0.5 max-w-xl">{subtitle}</div>}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ContactCard({ c, onOpenChat }) {
  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-full ${c.avatarBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
          {c.initials}
        </div>
        <span className={`h-1.5 w-1.5 rounded-full mt-1 ${c.online ? 'bg-emerald-600' : 'bg-muted-foreground/30'}`} />
      </div>
      <div className="text-sm font-semibold">{c.name}</div>
      <div className="text-xs text-muted-foreground mt-0.5 mb-4">{c.role}</div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 mt-auto">
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {c.channel}
        </span>
        <span>{c.meta}</span>
      </div>
      <button
        onClick={onOpenChat}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted/40"
      >
        Open chat
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function FaqRow({ item, open, onToggle }) {
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <span className={`text-sm font-medium ${open ? 'text-emerald-700' : ''}`}>{item.q}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-emerald-700 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {item.a}
        </div>
      )}
    </div>
  );
}

/* ---------- main component ---------- */

export default function Help({ goTo }) {
  const [openFaq, setOpenFaq] = useState(1);

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px w-6 bg-emerald-700" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Support · People, not just policies
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold">
          Help & your <span className="text-emerald-700 italic">buddy.</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Two unread messages from your buddy and hiring manager. Everything below is the human
          side of onboarding — who to ask, what they handle, how fast they answer.
        </p>
      </div>

      {/* Buddy card + inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="h-1 bg-emerald-700" />
          <div className="p-6">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Your assigned buddy · since Mar 9
            </div>

            <div className="flex items-start gap-4 mb-5">
              <div className="h-14 w-14 rounded-full bg-blue-700 text-white flex items-center justify-center font-serif font-bold flex-shrink-0">
                RW
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold">Rizky Wijaya</span>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> online
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Senior Engineer · Platform team · 4 years at Abhimata</div>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-900 italic mb-5">
              "I onboard one new engineer a year. My job for the next six months is to be the
              dumb-question channel — nothing is too small. We sync once a week, async-first the
              rest of the time."
            </div>

            <div className="grid grid-cols-4 gap-4 pb-5 mb-5 border-b">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Time zone</div>
                <div className="text-sm font-medium">WIB · same as yours</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Best reach</div>
                <div className="text-sm font-medium">Slack DM</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Avg. reply</div>
                <div className="text-sm font-medium">~22 min</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Next sync</div>
                <div className="text-sm font-medium text-emerald-700">Tomorrow 09:30</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button>
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Send a message
              </Button>
              <Button variant="outline">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Schedule a sync
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Slack profile
              </Button>
            </div>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 mt-3">
              Request a different buddy →
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Unread messages
            </span>
            <button className="text-xs font-semibold text-emerald-700 hover:underline">Open inbox →</button>
          </div>
          <div className="space-y-4">
            {UNREAD_MESSAGES.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full ${m.avatarBg} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                  {m.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{m.name}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{m.when}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.text}</p>
                </div>
                {m.unread && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 01 — Upcoming buddy syncs */}
      <SectionCard
        seq="01"
        title="Upcoming buddy syncs"
        subtitle="Pre-planned 1:1s on your calendar. Move or cancel any of them — Rizky gets a heads-up."
        right={
          <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted/40">
            <Plus className="h-3.5 w-3.5" />
            Add ad-hoc sync
          </button>
        }
      >
        {UPCOMING_SYNCS.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-6 py-4 ${i !== 0 ? 'border-t' : ''}`}
          >
            <span className="text-xs font-semibold text-muted-foreground w-36 flex-shrink-0">{s.when}</span>
            <span className="text-sm font-medium flex-1 min-w-0">{s.title}</span>
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{s.dur}</span>
            <div className="flex gap-2 flex-shrink-0">
              <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted/40">
                Reschedule
              </button>
              <button className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted/40">
                Add agenda
              </button>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* 02 — Who to ask */}
      <SectionCard
        seq="02"
        title="Who to ask, for what"
        subtitle="Six channels covering nearly everything an onboarding hire runs into. If unsure, message your buddy — they'll route you."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {CONTACTS.map((c) => (
            <ContactCard key={c.id} c={c} onOpenChat={() => {}} />
          ))}
        </div>
      </SectionCard>

      {/* 03 — FAQ */}
      <SectionCard
        seq="03"
        title="Things new hires actually ask"
        subtitle="Pulled from the last 90 days of assistant logs — anonymised. Not finding yours? Ask the assistant or your buddy."
        right={
          <button
            onClick={() => goTo?.('assistant')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 text-xs font-semibold hover:bg-emerald-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Ask the assistant
          </button>
        }
      >
        {FAQS.map((item, i) => (
          <FaqRow
            key={i}
            item={item}
            open={openFaq === i}
            onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
          />
        ))}
      </SectionCard>

      {/* 04 — Resources */}
      <SectionCard
        seq="04"
        title="Resources & quick links"
        subtitle="Bookmarked by every new hire in their first month. All open in the relevant tool — SharePoint, Notion, or the external portal."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6">
          {RESOURCES.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-card border flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.source}</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Escalation banner */}
      <div className="rounded-xl bg-neutral-900 text-white px-8 py-7 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1.5">
            Still stuck?
          </div>
          <div className="font-serif text-xl font-bold italic mb-1.5">
            Skip the queue — talk to a human now.
          </div>
          <p className="text-sm text-neutral-400 max-w-md">
            For urgent matters that cannot wait for buddy office hours: HR Ops on-call rotates
            24/7 and answers within 30 minutes during weekdays.
          </p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
            Talk to HR Ops on-call
          </Button>
          <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800 bg-transparent">
            <Flag className="h-3.5 w-3.5 mr-1.5" />
            File a confidential report
          </Button>
        </div>
      </div>
    </div>
  );
}