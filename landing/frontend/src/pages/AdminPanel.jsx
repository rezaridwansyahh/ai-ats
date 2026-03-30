import { useEffect, useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { getAll, approve, reject } from "@/api/landing.api"
import * as emailNotifyApi from "@/api/email-notify.api"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SESSIONS = [
  { key: "10-12", label: "10:00 AM – 12:00 PM", short: "10–12" },
  { key: "1-3", label: "1:00 PM – 3:00 PM", short: "1–3 PM" },
  { key: "4-6", label: "4:00 PM – 6:00 PM", short: "4–6 PM" },
]
const STATUS = {
  pending:  { bg: "#f59e0b", light: "#fffbeb", border: "#fde68a", dark: "#92400e", label: "Pending" },
  approved: { bg: "#0A6E5C", light: "#ecfdf5", border: "#a7f3d0", dark: "#065f46", label: "Approved" },
  rejected: { bg: "#ef4444", light: "#fef2f2", border: "#fecaca", dark: "#991b1b", label: "Rejected" },
}

function pad(n) { return String(n).padStart(2, "0") }
function fmtDate(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }
function monthLabel(date) { return date.toLocaleString("en-US", { month: "long", year: "numeric" }) }

export default function AdminPanel() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState(null)
  const [conferenceLink, setConferenceLink] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [notifyEmails, setNotifyEmails] = useState([])
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [addingEmail, setAddingEmail] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem("user") || "null")
  const year = current.getFullYear(), month = current.getMonth()

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try { const { data } = await getAll(); setBookings(data.data || []) } catch { setBookings([]) } finally { setLoading(false) }
  }, [])
  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true)
    try { const r = await emailNotifyApi.getAll(); setNotifyEmails(r.data?.data || []) } catch { setNotifyEmails([]) } finally { setEmailsLoading(false) }
  }, [])

  useEffect(() => { if (!localStorage.getItem("token")) { navigate("/login"); return }; fetchBookings(); fetchEmails() }, [])

  const handleAddEmail = async (e) => { e.preventDefault(); if (!newEmail.trim()) return; setAddingEmail(true); try { await emailNotifyApi.create(newEmail.trim(), newLabel.trim() || null); setNewEmail(""); setNewLabel(""); fetchEmails() } catch (err) { alert(err.response?.data?.message || "Failed") } finally { setAddingEmail(false) } }
  const handleToggleEmail = async (id, v) => { try { await emailNotifyApi.update(id, { is_active: v }); fetchEmails() } catch {} }
  const handleDeleteEmail = async (id) => { try { await emailNotifyApi.remove(id); fetchEmails() } catch {} }

  const byDate = useMemo(() => { const m = {}; for (const b of bookings) { if (!b.booking_date) continue; const ds = b.booking_date instanceof Date ? `${b.booking_date.getFullYear()}-${pad(b.booking_date.getMonth()+1)}-${pad(b.booking_date.getDate())}` : String(b.booking_date).split("T")[0]; if (!m[ds]) m[ds] = []; m[ds].push(b) }; return m }, [bookings])
  const stats = useMemo(() => { let p=0,a=0,r=0; const ms = `${year}-${pad(month+1)}`; for (const b of bookings) { if (!b.booking_date) continue; const ds = b.booking_date instanceof Date ? `${b.booking_date.getFullYear()}-${pad(b.booking_date.getMonth()+1)}` : String(b.booking_date).slice(0,7); if (ds===ms) { if (b.status==="pending") p++; else if (b.status==="approved") a++; else if (b.status==="rejected") r++ } }; return {pending:p,approved:a,rejected:r} }, [bookings,year,month])

  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const dim = new Date(year, month + 1, 0).getDate()
  const cells = []; for (let i = 0; i < offset; i++) cells.push(null); for (let d = 1; d <= dim; d++) cells.push(d); while (cells.length % 7) cells.push(null)
  const now = new Date(); now.setHours(0,0,0,0)
  const isToday = d => d === now.getDate() && month === now.getMonth() && year === now.getFullYear()
  const isWk = d => { const w = new Date(year, month, d).getDay(); return w === 0 || w === 6 }
  const getDayB = d => { if (isWk(d)) return []; const ds = fmtDate(year, month, d); const db = byDate[ds] || []; const r = []; SESSIONS.forEach(s => { db.filter(b => b.session_slot === s.key).forEach(b => r.push({ ...b, session: s })) }); return r }

  const handleApprove = async () => { setActionLoading(true); try { await approve(selected.id, conferenceLink || null); setSelected(null); setMode(null); setConferenceLink(""); fetchBookings() } catch (e) { alert(e.response?.data?.message || "Failed") } finally { setActionLoading(false) } }
  const handleReject = async () => { setActionLoading(true); try { await reject(selected.id, rejectReason || null); setSelected(null); setMode(null); setRejectReason(""); fetchBookings() } catch (e) { alert(e.response?.data?.message || "Failed") } finally { setActionLoading(false) } }
  const closeDetail = () => { setSelected(null); setMode(null); setConferenceLink(""); setRejectReason("") }
  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))
  const goToday = () => { const d = new Date(); setCurrent(new Date(d.getFullYear(), d.getMonth(), 1)) }

  const displayDate = selected?.booking_date ? new Date(String(selected.booking_date).split("T")[0] + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : ""
  const sessionLabel = selected ? (SESSIONS.find(s => s.key === selected.session_slot)?.label || selected.session_slot) : ""

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .ap { min-height: 100vh; background: #f8fafc; font-family: 'DM Sans', system-ui, -apple-system, sans-serif; color: #1e293b; }
        .ap-hdr { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .ap-hdr h1 { font-size: 15px; font-weight: 700; line-height: 1.2; }
        .ap-hdr p { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .ap-lo { background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 14px; font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer; transition: all .15s; }
        .ap-lo:hover { background: #f1f5f9; color: #334155; }
        .ap-body { max-width: 1280px; margin: 0 auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .card { border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.04); }

        /* Calendar */
        .cal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }
        .cal-nav { display: flex; align-items: center; gap: 4px; }
        .cal-nb { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: #64748b; transition: all .15s; line-height: 1; }
        .cal-nb:hover { background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
        .cal-mo { font-size: 15px; font-weight: 600; margin-left: 8px; letter-spacing: -.01em; }
        .cal-ri { display: flex; align-items: center; gap: 14px; }
        .cal-st { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8; font-weight: 500; }
        .cal-st b { font-weight: 600; color: #64748b; }
        .cal-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .cal-tb { border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 600; color: #475569; background: #fff; cursor: pointer; transition: all .15s; }
        .cal-tb:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .cal-dl { display: grid; grid-template-columns: repeat(7,1fr); border-bottom: 1px solid #e2e8f0; }
        .cal-dl > div { padding: 7px 0; text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; background: #f8fafc; }
        .cal-dl > div.wk { color: #d1d5db; }

        .cal-g { display: grid; grid-template-columns: repeat(7,1fr); }
        .cal-c { min-height: 104px; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; padding: 4px; position: relative; transition: background .12s; }
        .cal-c:nth-child(7n) { border-right: none; }
        .cal-c.wk { background: #fafbfc; }
        .cal-c.td { background: rgba(10,110,92,.02); }
        .cal-c.emp { background: #fafbfc; }
        .cal-c:not(.wk):not(.emp):hover { background: #f8fffe; }

        .cal-dn { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; color: #64748b; margin: 0 0 3px 1px; }
        .cal-dn.td { background: #0A6E5C; color: #fff; font-weight: 700; }
        .cal-dn.wk { color: #d1d5db; }

        .cal-bar { display: block; width: 100%; text-align: left; border: none; border-radius: 4px; padding: 3px 6px; font-size: 10px; line-height: 1.3; cursor: pointer; color: #fff; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; font-family: inherit; transition: opacity .12s, transform .12s; }
        .cal-bar:hover { opacity: .88; transform: translateY(-0.5px); }
        .cal-bar span { font-weight: 700; }

        .cal-leg { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 8px 0; border-top: 1px solid #e2e8f0; }
        .cal-leg > span { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #94a3b8; font-weight: 500; }
        .cal-ld { width: 10px; height: 10px; border-radius: 3px; }

        /* Overlay */
        .ov { position: fixed; inset: 0; background: rgba(15,23,42,.32); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: ovIn .15s ease; }
        @keyframes ovIn { from { opacity: 0; } to { opacity: 1; } }
        .dlg { background: #fff; border-radius: 14px; width: 440px; max-width: 92vw; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.04); animation: dlgIn .2s cubic-bezier(.22,1,.36,1); }
        @keyframes dlgIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
        .dlg-hdr { padding: 18px 22px; position: relative; }
        .dlg-hdr h3 { font-size: 15px; font-weight: 600; color: #fff; }
        .dlg-hdr p { font-size: 11px; color: rgba(255,255,255,.65); margin-top: 2px; }
        .dlg-badge { position: absolute; top: 16px; right: 50px; background: rgba(255,255,255,.18); border-radius: 20px; padding: 3px 10px; font-size: 10px; font-weight: 700; color: #fff; letter-spacing: .03em; }
        .dlg-x { position: absolute; top: 12px; right: 14px; width: 28px; height: 28px; border-radius: 50%; border: none; background: rgba(255,255,255,.15); color: rgba(255,255,255,.8); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .dlg-x:hover { background: rgba(255,255,255,.3); }
        .dlg-body { padding: 6px 22px 14px; }
        .dlg-row { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .dlg-row:last-child { border: none; }
        .dlg-rl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; }
        .dlg-rv { font-size: 13px; color: #334155; line-height: 1.5; }
        .dlg-rv.bold { font-weight: 600; }
        .dlg-rv a { color: #0A6E5C; text-decoration: none; }
        .dlg-rv a:hover { text-decoration: underline; }
        .dlg-rv.red { color: #dc2626; }
        .dlg-rv.muted { color: #64748b; white-space: pre-wrap; }
        .dlg-form { margin-top: 14px; padding: 14px; border-radius: 10px; }
        .dlg-form label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 6px; }
        .dlg-form input, .dlg-form textarea { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; outline: none; transition: border-color .15s, box-shadow .15s; }
        .dlg-form input:focus, .dlg-form textarea:focus { border-color: #0A6E5C; box-shadow: 0 0 0 3px rgba(10,110,92,.08); }
        .dlg-form textarea { resize: vertical; min-height: 60px; }
        .dlg-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid #f1f5f9; }
        .btn { border-radius: 8px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; border: none; }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .btn-o { background: #fff; border: 1px solid #e2e8f0; color: #64748b; }
        .btn-o:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
        .btn-o.red { color: #dc2626; border-color: #fecaca; }
        .btn-o.red:hover:not(:disabled) { background: #fef2f2; }
        .btn-f { color: #fff; }
        .btn-f:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-.5px); box-shadow: 0 2px 8px rgba(0,0,0,.12); }

        /* Emails */
        .em-hdr { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
        .em-hdr h3 { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .em-hdr h3 span.cnt { font-size: 11px; font-weight: 400; color: #94a3b8; }
        .em-hdr p { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .em-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid #f8fafc; transition: background .1s; }
        .em-row:hover { background: #fafbfc; }
        .em-row.off { opacity: .45; }
        .em-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .em-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .em-addr { font-size: 13px; font-weight: 500; color: #334155; }
        .em-label { font-size: 11px; color: #94a3b8; }
        .em-acts { display: flex; align-items: center; gap: 2px; }
        .em-ib { width: 28px; height: 28px; border-radius: 6px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; color: #94a3b8; transition: all .12s; }
        .em-ib:hover { background: #f1f5f9; }
        .em-ib.del:hover { background: #fef2f2; color: #dc2626; }
        .em-empty { padding: 28px; text-align: center; color: #cbd5e1; font-size: 12px; }
        .em-form { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid #e2e8f0; background: #fafbfc; }
        .em-form input { flex: 1; height: 34px; padding: 0 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-family: inherit; outline: none; transition: border-color .15s; }
        .em-form input:focus { border-color: #0A6E5C; }
        .em-form input.label { flex: 0 0 130px; }
        .em-add { height: 34px; width: 34px; border-radius: 8px; border: none; background: #0A6E5C; color: #fff; font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
        .em-add:hover:not(:disabled) { background: #085c4d; transform: translateY(-.5px); }
        .em-add:disabled { opacity: .5; cursor: not-allowed; }

        .loading { text-align: center; color: #94a3b8; padding: 60px 20px; font-size: 13px; }
      `}</style>

      <div className="ap">
        <div className="ap-hdr">
          <div>
            <h1>Demo Booking</h1>
            <p>Logged in as {user?.email || "—"}</p>
          </div>
          <button className="ap-lo" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login") }}>Logout</button>
        </div>

        <div className="ap-body">
          {loading ? <div className="loading">Loading bookings...</div> : (
            <div className="card">
              {/* Calendar header */}
              <div className="cal-hdr">
                <div className="cal-nav">
                  <button className="cal-nb" onClick={prevMonth}>&#8249;</button>
                  <button className="cal-nb" onClick={nextMonth}>&#8250;</button>
                  <span className="cal-mo">{monthLabel(current)}</span>
                </div>
                <div className="cal-ri">
                  <span className="cal-st"><span className="cal-dot" style={{ background: "#f59e0b" }} /><b>{stats.pending}</b> pending</span>
                  <span className="cal-st"><span className="cal-dot" style={{ background: "#0A6E5C" }} /><b>{stats.approved}</b> approved</span>
                  <button className="cal-tb" onClick={goToday}>Today</button>
                </div>
              </div>

              {/* Day labels */}
              <div className="cal-dl">
                {DAYS.map((d, i) => <div key={d} className={i >= 5 ? "wk" : ""}>{d}</div>)}
              </div>

              {/* Grid */}
              <div className="cal-g">
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e-${i}`} className="cal-c emp" />
                  const wk = isWk(d), td = isToday(d), dayB = getDayB(d)
                  return (
                    <div key={d} className={`cal-c${wk ? " wk" : ""}${td ? " td" : ""}`}>
                      <div className={`cal-dn${td ? " td" : ""}${wk ? " wk" : ""}`}>{d}</div>
                      {dayB.map(b => (
                        <button key={b.id} className="cal-bar" style={{ background: STATUS[b.status]?.bg }} onClick={() => { setSelected(b); setMode(null) }} title={`${b.session.short} · ${b.name} · ${b.status}`}>
                          <span>{b.session.short}</span> {b.name}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="cal-leg">
                {Object.entries(STATUS).map(([k, s]) => (
                  <span key={k}><span className="cal-ld" style={{ background: s.bg }} />{s.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Email Notifications */}
          <div className="card">
            <div className="em-hdr">
              <h3>Notification Emails <span className="cnt">({notifyEmails.filter(e => e.is_active).length} active)</span></h3>
              <p>These emails receive notifications when new demo bookings are submitted.</p>
            </div>
            {emailsLoading ? <div className="em-empty">Loading...</div>
              : notifyEmails.length === 0 ? <div className="em-empty">No notification emails configured</div>
              : notifyEmails.map(item => (
                <div key={item.id} className={`em-row${item.is_active ? "" : " off"}`}>
                  <div className="em-info">
                    <span className="em-dot" style={{ background: item.is_active ? "#0A6E5C" : "#cbd5e1" }} />
                    <div>
                      <div className="em-addr">{item.email}</div>
                      {item.label && <div className="em-label">{item.label}</div>}
                    </div>
                  </div>
                  <div className="em-acts">
                    <button className="em-ib" title={item.is_active ? "Deactivate" : "Activate"} onClick={() => handleToggleEmail(item.id, !item.is_active)} style={{ color: item.is_active ? "#0A6E5C" : "#94a3b8" }}>{item.is_active ? "●" : "○"}</button>
                    <button className="em-ib del" title="Remove" onClick={() => handleDeleteEmail(item.id)}>×</button>
                  </div>
                </div>
              ))
            }
            <form className="em-form" onSubmit={handleAddEmail}>
              <input type="email" required placeholder="email@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <input type="text" className="label" placeholder="Label (optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
              <button type="submit" className="em-add" disabled={addingEmail || !newEmail.trim()}>+</button>
            </form>
          </div>
        </div>

        {/* Detail overlay */}
        {selected && (
          <div className="ov" onClick={closeDetail}>
            <div className="dlg" onClick={e => e.stopPropagation()}>
              <div className="dlg-hdr" style={{ background: STATUS[selected.status]?.bg }}>
                <button className="dlg-x" onClick={closeDetail}>✕</button>
                <span className="dlg-badge">{STATUS[selected.status]?.label}</span>
                <h3>Booking Detail</h3>
                <p>{displayDate}</p>
              </div>
              <div className="dlg-body">
                <div className="dlg-row"><div className="dlg-rl">Name</div><div className="dlg-rv bold">{selected.name}</div></div>
                <div className="dlg-row"><div className="dlg-rl">Email</div><div className="dlg-rv">{selected.email}</div></div>
                <div className="dlg-row"><div className="dlg-rl">Company Size</div><div className="dlg-rv">{selected.company_size || "—"}</div></div>
                <div className="dlg-row"><div className="dlg-rl">Session</div><div className="dlg-rv bold">{sessionLabel}</div></div>
                {selected.message && <div className="dlg-row"><div className="dlg-rl">Message</div><div className="dlg-rv muted">{selected.message}</div></div>}
                {selected.conference_link && <div className="dlg-row"><div className="dlg-rl">Conference Link</div><div className="dlg-rv"><a href={selected.conference_link} target="_blank" rel="noopener noreferrer">{selected.conference_link}</a></div></div>}
                {selected.rejection_reason && <div className="dlg-row"><div className="dlg-rl">Rejection Reason</div><div className="dlg-rv red">{selected.rejection_reason}</div></div>}

                {mode === "approve" && (
                  <div className="dlg-form" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <label style={{ color: "#065f46" }}>Conference Link (optional)</label>
                    <input type="url" placeholder="https://meet.google.com/..." value={conferenceLink} onChange={e => setConferenceLink(e.target.value)} />
                  </div>
                )}
                {mode === "reject" && (
                  <div className="dlg-form" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                    <label style={{ color: "#991b1b" }}>Rejection Reason (optional)</label>
                    <textarea placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="dlg-ft">
                {selected.status === "pending" && !mode && <>
                  <button className="btn btn-o red" onClick={() => setMode("reject")}>Reject</button>
                  <button className="btn btn-f" style={{ background: "#0A6E5C" }} onClick={() => setMode("approve")}>Approve</button>
                </>}
                {mode === "approve" && <>
                  <button className="btn btn-o" onClick={() => setMode(null)}>Cancel</button>
                  <button className="btn btn-f" style={{ background: "#0A6E5C" }} onClick={handleApprove} disabled={actionLoading}>{actionLoading ? "Approving..." : "Confirm Approve"}</button>
                </>}
                {mode === "reject" && <>
                  <button className="btn btn-o" onClick={() => setMode(null)}>Cancel</button>
                  <button className="btn btn-f" style={{ background: "#ef4444" }} onClick={handleReject} disabled={actionLoading}>{actionLoading ? "Rejecting..." : "Confirm Reject"}</button>
                </>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
