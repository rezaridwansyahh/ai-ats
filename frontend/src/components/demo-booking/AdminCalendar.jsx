import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import BookingDetailCard from "./BookingDetailCard"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SESSIONS = [
  { key: "10-12", label: "10:00 AM – 12:00 PM", short: "10–12 AM" },
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

function statusColor(status) {
  switch (status) {
    case "approved": return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "pending":  return "bg-amber-100 text-amber-800 border-amber-200"
    case "rejected": return "bg-red-50 text-red-400 border-red-100 line-through opacity-60"
    default:         return "bg-gray-100 text-gray-500 border-gray-200"
  }
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
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Pad to full weeks
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

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-lg font-semibold">{getMonthLabel(current)}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) {
            return <div key={`e-${i}`} className="min-h-[120px] border-b border-r bg-muted/30" />
          }

          const weekend = isWeekend(d)
          const todayCell = isToday(d)
          const dateStr = formatDateStr(year, month, d)

          return (
            <div
              key={d}
              className={`min-h-[120px] border-b border-r p-1.5 transition-colors ${
                weekend ? "bg-muted/40" : "bg-white hover:bg-accent/30"
              }`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    todayCell
                      ? "bg-primary text-primary-foreground font-bold"
                      : weekend
                        ? "text-muted-foreground/50"
                        : "text-foreground"
                  }`}
                >
                  {d}
                </span>
              </div>

              {/* Session chips */}
              {!weekend && (
                <div className="flex flex-col gap-0.5">
                  {SESSIONS.map((session) => {
                    const slotBookings = getBookingsForDateSlot(d, session.key)
                    if (slotBookings.length === 0) return null

                    return slotBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => setSelected(booking)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight border truncate cursor-pointer transition-all hover:shadow-sm ${statusColor(booking.status)}`}
                      >
                        <span className="font-semibold">{session.short}</span>{" "}
                        <span className="opacity-80">{booking.name}</span>
                      </button>
                    ))
                  })}
                </div>
              )}
            </div>
          )
        })}
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
