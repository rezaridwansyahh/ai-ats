import { useState } from "react"
import { create } from "@/api/landing.api.js"

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", size: "1–100 employees", message: "" })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      await create({
        name: form.name,
        email: form.email,
        company_size: form.size,
        message: form.message,
      })
      setStatus("success")
      setForm({ name: "", email: "", size: "1–100 employees", message: "" })
    } catch {
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <section className="con" id="contact">
      <div className="inn">
        <div className="sl">GET IN TOUCH</div>
        <div className="st">Let's Transform Your Hiring</div>
        <div className="cog">
          <form className="cof" onSubmit={handleSubmit}>
            <div className="fg2">
              <label>Full Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={update("name")} />
            </div>
            <div className="fg2">
              <label>Email</label>
              <input type="email" placeholder="you@company.com" value={form.email} onChange={update("email")} />
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
              <label>Message</label>
              <textarea placeholder="Tell us about your hiring challenges..." value={form.message} onChange={update("message")} />
            </div>
            {status === "success" && <p className="fsm fss">Thank you! We'll be in touch soon.</p>}
            {status === "error" && <p className="fsm fse">Something went wrong. Please try again.</p>}
            <button type="submit" className="fsb" disabled={loading}>
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
