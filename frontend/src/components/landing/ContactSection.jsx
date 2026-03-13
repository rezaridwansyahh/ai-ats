import { useState, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { create } from "@/api/landing.api.js"
import BookingCalendar from "./BookingCalendar"

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", size: "1–100 employees", message: "", booking_date: "", session_slot: "" })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [errors, setErrors] = useState({})
  const [showCaptcha, setShowCaptcha] = useState(false)
  const captchaRef = useRef(null)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = "Full name is required"
    if (!form.email.trim()) e.email = "Email is required"
    if (!form.message.trim()) e.message = "Message is required"
    if (!form.booking_date || !form.session_slot) e.slot = "Please select a date and session from the calendar above"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmitClick = (e) => {
    e.preventDefault()
    setStatus(null)
    if (!validate()) return
    if (RECAPTCHA_SITE_KEY) {
      setShowCaptcha(true)
    } else {
      submitForm(null)
    }
  }

  const onCaptchaChange = (token) => {
    if (!token) return
    setShowCaptcha(false)
    captchaRef.current?.reset()
    submitForm(token)
  }

  const submitForm = async (captchaToken) => {
    setLoading(true)
    setStatus(null)
    try {
      await create({
        name: form.name,
        email: form.email,
        company_size: form.size,
        message: form.message,
        booking_date: form.booking_date,
        session_slot: form.session_slot,
        ...(captchaToken && { captcha_token: captchaToken }),
      })
      setStatus("success")
      setForm({ name: "", email: "", size: "1–100 employees", message: "", booking_date: "", session_slot: "" })
      setErrors({})
    } catch {
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSlotSelect = ({ date, session }) => {
    setForm((f) => ({ ...f, booking_date: date, session_slot: session.key }))
    if (errors.slot) setErrors((prev) => { const n = { ...prev }; delete n.slot; return n })
  }

  const selectedLabel = form.booking_date && form.session_slot
    ? `${form.booking_date} | ${({ "10-12": "10 AM – 12 PM", "1-3": "1 PM – 3 PM", "4-6": "4 PM – 6 PM" })[form.session_slot]}`
    : null

  return (
    <section className="con" id="contact">
      <div className="inn">
        <div className="sl">SCHEDULE A DEMO</div>
        <div className="st">Book Your Free Demo Session</div>
        <p className="sd">Pick a date and time slot that works for you, then fill in your details below.</p>
        <div className="bcal-wrapper">
          <BookingCalendar onSelectSlot={handleSlotSelect} />
        </div>
        {selectedLabel && (
          <div className="bcal-selected-banner">
            Selected: <strong>{selectedLabel}</strong>
          </div>
        )}
        {errors.slot && <p className="fsm fse" style={{ maxWidth: 820, margin: "0 auto .75rem", textAlign: "center" }}>{errors.slot}</p>}
        <div className="cog">
          <form className="cof" onSubmit={handleSubmitClick}>
            <div className="fg2">
              <label>Full Name <span style={{ color: "#E11D48" }}>*</span></label>
              <input type="text" placeholder="Your name" value={form.name} onChange={update("name")} />
              {errors.name && <span className="fve">{errors.name}</span>}
            </div>
            <div className="fg2">
              <label>Email <span style={{ color: "#E11D48" }}>*</span></label>
              <input type="email" placeholder="you@company.com" value={form.email} onChange={update("email")} />
              {errors.email && <span className="fve">{errors.email}</span>}
            </div>
            <div className="fg2">
              <label>Company Size</label>
              <select value={form.size} onChange={update("size")}>
                <option>1–100 employees</option>
                <option>101–400 employees</option>
                <option>400+ employees</option>
              </select>
            </div>
            <div className="fg2">
              <label>Message <span style={{ color: "#E11D48" }}>*</span></label>
              <textarea placeholder="Tell us about your hiring challenges..." value={form.message} onChange={update("message")} />
              {errors.message && <span className="fve">{errors.message}</span>}
            </div>
            {showCaptcha && RECAPTCHA_SITE_KEY && (
              <div className="fcaptcha">
                <ReCAPTCHA ref={captchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={onCaptchaChange} />
              </div>
            )}
            {status === "success" && <p className="fsm fss">Thank you! We'll be in touch soon.</p>}
            {status === "error" && <p className="fsm fse">Something went wrong. Please try again.</p>}
            <button type="submit" className="fsb" disabled={loading || showCaptcha}>
              {loading ? "Submitting…" : "Schedule Your Free Demo →"}
            </button>
          </form>
          <div className="coi">
            <div className="coc"><h4>📧 Email</h4><p><a href="mailto:Info@myralix.com">Info@myralix.com</a></p></div>
            <div className="coc"><h4>📍 Office</h4><p>Menara Cakrawala, Jl. M.H. Thamrin No.9 Lt 12, Unit 1205A, Kebon Sirih, Kec. Menteng, Jakarta – 10340</p></div>
            <div className="coc"><h4>📞 Phone</h4><p><a href="tel:+622150106260">+62 21 5010 6260</a></p></div>
            <div className="coc"><h4>📱 WhatsApp</h4><p><a href="https://wa.me/6281382327732">+62 813 8232 7732</a> (Sales)<br/><a href="https://wa.me/628118886578">+62 811 888 6578</a> (Support)</p></div>
            <div className="coc"><h4>🌐 Website</h4><p><a href="https://www.myralix.com" target="_blank" rel="noopener noreferrer">www.myralix.com</a></p></div>
            <div className="coc" style={{ background: "var(--tl)" }}>
              <h4 style={{ color: "var(--am)" }}>🎁 Pilot Program</h4>
              <p style={{ color: "rgba(255,255,255,.8)" }}>1-month complimentary strategic partnership to gain authentic experience. No credit card required.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
