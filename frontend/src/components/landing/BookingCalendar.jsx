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

export default function BookingCalendar({ open, onClose, onConfirm }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [availability, setAvailability] = useState({})
  const [loading, setLoading] = useState(false)
  const [tempDate, setTempDate] = useState(null)
  const [tempSession, setTempSession] = useState(null)

  useEffect(() => {
    if (!open) return
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
  }, [current, open])

  useEffect(() => {
    if (!open) {
      setTempDate(null)
      setTempSession(null)
    }
  }, [open])

  if (!open) return null

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const prevMonth = () => { setCurrent(new Date(year, month - 1, 1)); setTempDate(null); setTempSession(null) }
  const nextMonth = () => { setCurrent(new Date(year, month + 1, 1)); setTempDate(null); setTempSession(null) }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getDateStr = (d) => `${year}-${pad(month + 1)}-${pad(d)}`

  const isWeekend = (d) => {
    const day = new Date(year, month, d).getDay()
    return day === 0 || day === 6
  }

  const isPast = (d) => new Date(year, month, d) < today

  const getSlotStatus = (d, sessionKey) => {
    const dayData = availability[getDateStr(d)]
    if (!dayData) return "available"
    return dayData[sessionKey] || "available"
  }

  const hasAnyBooking = (d) => {
    const dayData = availability[getDateStr(d)]
    if (!dayData) return false
    return Object.values(dayData).some((s) => s !== "available")
  }

  const handleDateClick = (d) => {
    if (isWeekend(d) || isPast(d)) return
    setTempDate(tempDate === d ? null : d)
    setTempSession(null)
  }

  const handleSlotClick = (session) => {
    const status = getSlotStatus(tempDate, session.key)
    if (status === "booked") return
    setTempSession(session)
  }

  const handleConfirm = () => {
    if (!tempDate || !tempSession) return
    onConfirm({ date: getDateStr(tempDate), session: tempSession })
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="bcal-overlay" onClick={handleOverlayClick}>
      <div className="bcal-modal">
        <div className="bcal-modal-title">Select Date & Time</div>

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
            const isSelected = tempDate === d
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

        {tempDate && !isWeekend(tempDate) && !isPast(tempDate) && (
          <div className="bcal-panel">
            <div className="bcal-panel-title">
              {new Date(year, month, tempDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="bcal-panel-slots">
              {SESSIONS.map((s) => {
                const status = getSlotStatus(tempDate, s.key)
                const isChosen = tempSession?.key === s.key
                return (
                  <div
                    key={s.key}
                    className={`bcal-slot bcal-slot-${status}${isChosen ? " bcal-slot-chosen" : ""}`}
                    onClick={() => handleSlotClick(s)}
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

        <div className="bcal-modal-footer">
          <button type="button" className="bcal-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="bcal-btn-confirm" disabled={!tempDate || !tempSession} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
