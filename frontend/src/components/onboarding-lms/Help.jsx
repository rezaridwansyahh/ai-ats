import { useState } from 'react';
import {
  MessageCircle, Calendar, ExternalLink, ChevronRight, ChevronDown,
  FileText, Monitor, Flag, Plus, ArrowRight, PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';


//TEMPLATE
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


// blocks
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

// Main Component