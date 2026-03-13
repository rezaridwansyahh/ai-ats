import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const SESSION_LABELS = {
  "10-12": "10:00 AM – 12:00 PM",
  "1-3": "1:00 PM – 3:00 PM",
  "4-6": "4:00 PM – 6:00 PM",
}

function StatusBadge({ status }) {
  const styles = {
    pending:  "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  )
}

export default function BookingDetailCard({ booking, open, onOpenChange, onApprove, onReject, canUpdate }) {
  const [mode, setMode] = useState(null) // null | 'approve' | 'reject'
  const [conferenceLink, setConferenceLink] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(false)

  if (!booking) return null

  let dateStr
  if (booking.booking_date instanceof Date) {
    const y = booking.booking_date.getFullYear()
    const m = String(booking.booking_date.getMonth() + 1).padStart(2, "0")
    const d = String(booking.booking_date.getDate()).padStart(2, "0")
    dateStr = `${y}-${m}-${d}`
  } else {
    dateStr = String(booking.booking_date).split("T")[0]
  }

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Booking Detail <StatusBadge status={booking.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-[100px_1fr] gap-y-2">
            <span className="text-muted-foreground font-medium">Name</span>
            <span>{booking.name}</span>

            <span className="text-muted-foreground font-medium">Email</span>
            <span>{booking.email}</span>

            <span className="text-muted-foreground font-medium">Company</span>
            <span>{booking.company_size || "—"}</span>

            <span className="text-muted-foreground font-medium">Date</span>
            <span>{dateStr}</span>

            <span className="text-muted-foreground font-medium">Session</span>
            <span>{SESSION_LABELS[booking.session_slot] || booking.session_slot}</span>

            {booking.message && (
              <>
                <span className="text-muted-foreground font-medium">Message</span>
                <span className="whitespace-pre-wrap">{booking.message}</span>
              </>
            )}

            {booking.conference_link && (
              <>
                <span className="text-muted-foreground font-medium">Link</span>
                <a href={booking.conference_link} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate">
                  {booking.conference_link}
                </a>
              </>
            )}

            {booking.rejection_reason && (
              <>
                <span className="text-muted-foreground font-medium">Reason</span>
                <span className="text-red-600">{booking.rejection_reason}</span>
              </>
            )}
          </div>

          {/* Approve form */}
          {mode === "approve" && (
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-medium">Conference Link</label>
              <Input
                placeholder="https://meet.google.com/..."
                value={conferenceLink}
                onChange={(e) => setConferenceLink(e.target.value)}
              />
            </div>
          )}

          {/* Reject form */}
          {mode === "reject" && (
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-medium">Rejection Reason (optional)</label>
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {booking.status === "pending" && canUpdate && !mode && (
            <>
              <Button variant="outline" size="sm" onClick={() => setMode("reject")}>
                Reject
              </Button>
              <Button size="sm" onClick={() => setMode("approve")}>
                Approve
              </Button>
            </>
          )}
          {mode === "approve" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>Cancel</Button>
              <Button size="sm" onClick={handleApprove} disabled={loading}>
                {loading ? "Approving..." : "Confirm Approve"}
              </Button>
            </>
          )}
          {mode === "reject" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleReject} disabled={loading}>
                {loading ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
