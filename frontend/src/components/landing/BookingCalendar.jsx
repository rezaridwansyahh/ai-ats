import { useState, useEffect } from "react"
import { getAvailability } from "@/api/landing.api.js"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const SESSIONS = [
  { key: "10-12", label: "10 AM – 12 PM" },
  { key: "1-3", label: "1 PM – 3 PM" },
  { key: "4-6", label: "4 PM – 6 PM" },
]

function pad(n) {
  return String(n).padStart(2, "0")
}

function formatMonth(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function getMonthLabel(date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" })
}

export default function BookingCalendar({ onSelectSlot }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAvailability(formatMonth(current))
      .then((res) => {
        if (!cancelled) setAvailability(res.data?.data || {})
      })
      .catch(() => {
        if (!cancelled) setAvailability({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [current])

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getDateStr = (d) => `${year}-${pad(month + 1)}-${pad(d)}`

  const isWeekend = (d) => {
    const day = new Date(year, month, d).getDay()
    return day === 0 || day === 6
  }

  const isPast = (d) => {
    const date = new Date(year, month, d)
    return date < today
  }

  const getSlotStatus = (d, sessionKey) => {
    const dateStr = getDateStr(d)
    const dayData = availability[dateStr]
    if (!dayData) return "available"
    return dayData[sessionKey] || "available"
  }

  const hasAnyBooking = (d) => {
    const dateStr = getDateStr(d)
    const dayData = availability[dateStr]
    if (!dayData) return false
    return Object.values(dayData).some((s) => s !== "available")
  }

  const handleDateClick = (d) => {
    if (isWeekend(d) || isPast(d)) return
    setSelectedDate(selectedDate === d ? null : d)
  }

  const handleSlotClick = (d, session) => {
    const status = getSlotStatus(d, session.key)
    if (status === "booked") return
    if (onSelectSlot) {
      onSelectSlot({ date: getDateStr(d), session })
    }
  }

  return (
    <div className="bcal">
      <div className="bcal-hdr">
        <button type="button" className="bcal-nav" onClick={prevMonth}>&lsaquo;</button>
        <span className="bcal-title">{getMonthLabel(current)}</span>
        <button type="button" className="bcal-nav" onClick={nextMonth}>&rsaquo;</button>
      </div>

      {loading && <div className="bcal-loading">Loading availability...</div>}

      <div className="bcal-days">
        {DAYS.map((d) => (
          <div key={d} className="bcal-day-label">{d}</div>
        ))}
      </div>

      <div className="bcal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} className="bcal-cell bcal-empty" />

          const weekend = isWeekend(d)
          const past = isPast(d)
          const disabled = weekend || past
          const isSelected = selectedDate === d
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasBkng = hasAnyBooking(d)

          let cls = "bcal-cell"
          if (disabled) cls += " bcal-disabled"
          if (isSelected) cls += " bcal-selected"
          if (isToday) cls += " bcal-today"

          return (
            <div key={d} className={cls} onClick={() => handleDateClick(d)}>
              <span className="bcal-date">
                {d}
                {hasBkng && !disabled && <span className="bcal-dot" />}
              </span>
            </div>
          )
        })}
      </div>

      {selectedDate && !isWeekend(selectedDate) && !isPast(selectedDate) && (
        <div className="bcal-panel">
          <div className="bcal-panel-title">
            {new Date(year, month, selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div className="bcal-panel-slots">
            {SESSIONS.map((s) => {
              const status = getSlotStatus(selectedDate, s.key)
              return (
                <div
                  key={s.key}
                  className={`bcal-slot bcal-slot-${status}`}
                  onClick={() => handleSlotClick(selectedDate, s)}
                >
                  <span className="bcal-slot-time">{s.label}</span>
                  <span className="bcal-slot-badge">{status}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bcal-legend">
        <div className="bcal-legend-item"><span className="bcal-leg-dot bcal-leg-avail" />Available</div>
        <div className="bcal-legend-item"><span className="bcal-leg-dot bcal-leg-pending" />Pending</div>
        <div className="bcal-legend-item"><span className="bcal-leg-dot bcal-leg-booked" />Booked</div>
      </div>
    </div>
  )
}
