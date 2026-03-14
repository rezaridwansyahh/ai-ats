import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import BookingDetailCard from "./BookingDetailCard"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SESSIONS = [
  { key: "10-12", label: "10:00 AM – 12:00 PM", short: "10–12" },
  { key: "1-3", label: "1:00 PM – 3:00 PM", short: "1–3 PM" },
  { key: "4-6", label: "4:00 PM – 6:00 PM", short: "4–6 PM" },
]

function pad(n) {
  return String(n).padStart(2, "0")
}

function formatDateStr(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function getMonthLabel(date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" })
}

const STATUS_STYLES = {
  approved: {
    bar: "bg-[#0A6E5C]",
    text: "text-white",
    dot: "bg-[#0A6E5C]",
    label: "Approved",
  },
  pending: {
    bar: "bg-amber-500",
    text: "text-white",
    dot: "bg-amber-500",
    label: "Pending",
  },
  rejected: {
    bar: "bg-red-400/60",
    text: "text-white/80",
    dot: "bg-red-400",
    label: "Rejected",
  },
}

export default function AdminCalendar({ bookings, onApprove, onReject, canUpdate }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(null)

  const year = current.getFullYear()
  const month = current.getMonth()

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))
  const goToday = () => {
    const d = new Date()
    setCurrent(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  // Group bookings by date
  const byDate = useMemo(() => {
    const map = {}
    if (!bookings) return map
    for (const b of bookings) {
      if (!b.booking_date) continue
      let dateStr
      if (b.booking_date instanceof Date) {
        const y = b.booking_date.getFullYear()
        const m = String(b.booking_date.getMonth() + 1).padStart(2, "0")
        const dd = String(b.booking_date.getDate()).padStart(2, "0")
        dateStr = `${y}-${m}-${dd}`
      } else {
        dateStr = String(b.booking_date).split("T")[0]
      }
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(b)
    }
    return map
  }, [bookings])

  // Build calendar grid (Monday-start)
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const isWeekend = (d) => {
    const day = new Date(year, month, d).getDay()
    return day === 0 || day === 6
  }

  const getBookingsForDateSlot = (d, sessionKey) => {
    const dateStr = formatDateStr(year, month, d)
    const dayBookings = byDate[dateStr] || []
    return dayBookings.filter((b) => b.session_slot === sessionKey)
  }

  // Count bookings for current month
  const monthStats = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0
    if (!bookings) return { pending, approved, rejected }
    for (const b of bookings) {
      if (!b.booking_date) continue
      const dateStr = b.booking_date instanceof Date
        ? `${b.booking_date.getFullYear()}-${pad(b.booking_date.getMonth() + 1)}`
        : String(b.booking_date).slice(0, 7)
      const monthStr = `${year}-${pad(month + 1)}`
      if (dateStr === monthStr) {
        if (b.status === "pending") pending++
        else if (b.status === "approved") approved++
        else if (b.status === "rejected") rejected++
      }
    }
    return { pending, approved, rejected }
  }, [bookings, year, month])

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
      {/* Header — Google Calendar style */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold tracking-tight select-none">{getMonthLabel(current)}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Mini stats */}
          <div className="hidden md:flex items-center gap-3 mr-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">{monthStats.pending} pending</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#0A6E5C]" />
              <span className="text-muted-foreground">{monthStats.approved} approved</span>
            </span>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-[11px] font-semibold uppercase tracking-wider ${
              i >= 5 ? "text-muted-foreground/40" : "text-muted-foreground/70"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) {
            return (
              <div
                key={`e-${i}`}
                className="min-h-[110px] border-b border-r border-border/30 bg-muted/15"
              />
            )
          }

          const weekend = isWeekend(d)
          const todayCell = isToday(d)

          // Collect all bookings for this day
          const dayBookings = []
          if (!weekend) {
            SESSIONS.forEach((session) => {
              const slotBookings = getBookingsForDateSlot(d, session.key)
              slotBookings.forEach((b) => {
                dayBookings.push({ ...b, session })
              })
            })
          }

          return (
            <div
              key={d}
              className={`min-h-[110px] border-b border-r border-border/30 p-1 transition-colors ${
                weekend
                  ? "bg-muted/20"
                  : todayCell
                    ? "bg-primary/[0.02]"
                    : "bg-card hover:bg-accent/30"
              }`}
            >
              {/* Day number */}
              <div className="flex items-start justify-between mb-0.5 px-0.5">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    todayCell
                      ? "bg-primary text-primary-foreground font-bold"
                      : weekend
                        ? "text-muted-foreground/40"
                        : "text-foreground/80"
                  }`}
                >
                  {d}
                </span>
              </div>

              {/* Event bars — Google Calendar style */}
              <div className="flex flex-col gap-[3px]">
                {dayBookings.map((booking) => {
                  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.pending
                  return (
                    <button
                      key={booking.id}
                      onClick={() => setSelected(booking)}
                      className={`group w-full text-left rounded-[4px] px-1.5 py-[3px] text-[10px] leading-tight truncate cursor-pointer transition-all ${style.bar} ${style.text} hover:opacity-90 hover:shadow-sm`}
                      title={`${booking.session.short} · ${booking.name} · ${booking.status}`}
                    >
                      <span className="font-semibold">{booking.session.short}</span>
                      {" "}
                      <span className="opacity-85">{booking.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 px-4 py-2.5 border-t border-border/40 bg-muted/20">
        {Object.entries(STATUS_STYLES).map(([key, style]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-sm ${style.bar}`} />
            {style.label}
          </span>
        ))}
      </div>

      {/* Booking detail dialog */}
      {selected && (
        <BookingDetailCard
          booking={selected}
          open={!!selected}
          onOpenChange={(open) => { if (!open) setSelected(null) }}
          onApprove={onApprove}
          onReject={onReject}
          canUpdate={canUpdate}
        />
      )}
    </div>
  )
}
