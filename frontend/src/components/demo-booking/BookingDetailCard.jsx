import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Mail,
  Building2,
  Clock,
  MessageSquare,
  Link2,
  XCircle,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"

const SESSION_LABELS = {
  "10-12": "10:00 AM – 12:00 PM",
  "1-3": "1:00 PM – 3:00 PM",
  "4-6": "4:00 PM – 6:00 PM",
}

const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-500",
    lightBg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Pending Review",
    icon: AlertCircle,
  },
  approved: {
    bg: "bg-[#0A6E5C]",
    lightBg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Approved",
    icon: CheckCircle,
  },
  rejected: {
    bg: "bg-red-500",
    lightBg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    label: "Rejected",
    icon: XCircle,
  },
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-4 w-4 text-muted-foreground/60 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  )
}

export default function BookingDetailCard({ booking, open, onOpenChange, onApprove, onReject, canUpdate }) {
  const [mode, setMode] = useState(null)
  const [conferenceLink, setConferenceLink] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(false)

  if (!booking) return null

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  let dateStr
  if (booking.booking_date instanceof Date) {
    const y = booking.booking_date.getFullYear()
    const m = String(booking.booking_date.getMonth() + 1).padStart(2, "0")
    const d = String(booking.booking_date.getDate()).padStart(2, "0")
    dateStr = `${y}-${m}-${d}`
  } else {
    dateStr = String(booking.booking_date).split("T")[0]
  }

  // Format date for display
  const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const handleApprove = async () => {
    setLoading(true)
    try {
      await onApprove(booking.id, conferenceLink)
      onOpenChange(false)
    } finally {
      setLoading(false)
      setMode(null)
      setConferenceLink("")
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await onReject(booking.id, rejectionReason)
      onOpenChange(false)
    } finally {
      setLoading(false)
      setMode(null)
      setRejectionReason("")
    }
  }

  const handleClose = (val) => {
    setMode(null)
    setConferenceLink("")
    setRejectionReason("")
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" showCloseButton={false}>
        {/* Colored header strip */}
        <div className={`${status.bg} px-5 py-4 relative`}>
          <DialogClose className="absolute top-3 right-3 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <div className="flex items-center justify-between pr-8">
            <DialogHeader className="p-0 space-y-0">
              <DialogTitle className="text-white text-base font-semibold">
                Booking Detail
              </DialogTitle>
              <p className="text-white/70 text-xs mt-0.5">{displayDate}</p>
            </DialogHeader>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
              <StatusIcon className="h-3.5 w-3.5 text-white" />
              <span className="text-[11px] font-semibold text-white">{status.label}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-5 py-3">
          <div className="divide-y divide-border/50">
            <DetailRow icon={User} label="Name">
              <span className="font-medium">{booking.name}</span>
            </DetailRow>

            <DetailRow icon={Mail} label="Email">
              <span>{booking.email}</span>
            </DetailRow>

            <DetailRow icon={Building2} label="Company Size">
              <span>{booking.company_size || "—"}</span>
            </DetailRow>

            <DetailRow icon={Clock} label="Session">
              <span className="font-medium">{SESSION_LABELS[booking.session_slot] || booking.session_slot}</span>
            </DetailRow>

            {booking.message && (
              <DetailRow icon={MessageSquare} label="Message">
                <span className="whitespace-pre-wrap text-muted-foreground">{booking.message}</span>
              </DetailRow>
            )}

            {booking.conference_link && (
              <DetailRow icon={Link2} label="Conference Link">
                <a
                  href={booking.conference_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline underline-offset-2 truncate block"
                >
                  {booking.conference_link}
                </a>
              </DetailRow>
            )}

            {booking.rejection_reason && (
              <DetailRow icon={XCircle} label="Rejection Reason">
                <span className="text-red-600">{booking.rejection_reason}</span>
              </DetailRow>
            )}
          </div>

          {/* Approve form */}
          {mode === "approve" && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
              <label className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Conference Link
              </label>
              <Input
                placeholder="https://meet.google.com/..."
                value={conferenceLink}
                onChange={(e) => setConferenceLink(e.target.value)}
                className="h-9 text-sm bg-white"
              />
            </div>
          )}

          {/* Reject form */}
          {mode === "reject" && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <label className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Rejection Reason (optional)
              </label>
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="text-sm bg-white resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="px-5 py-3 border-t border-border/50 bg-muted/30 gap-2">
          {booking.status === "pending" && canUpdate && !mode && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setMode("reject")}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Reject
              </Button>
              <Button size="sm" onClick={() => setMode("approve")}>
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Approve
              </Button>
            </>
          )}
          {mode === "approve" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>Cancel</Button>
              <Button size="sm" onClick={handleApprove} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Confirm Approve
                  </>
                )}
              </Button>
            </>
          )}
          {mode === "reject" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Confirm Reject
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
