import { useState } from "react"

export default function LandingNav({ scrolled }) {
  const [open, setOpen] = useState(false)

  const scrollTo = (e, id) => {
    e.preventDefault()
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className={scrolled || open ? "s" : ""}>
      <a href="#home" className="nb" onClick={(e) => scrollTo(e, "home")}>
        <img src="/Myralix_Logo_White.png" alt="Myralix" className="logo-img" />
      </a>
      <button
        type="button"
        className={`nav-toggle${open ? " open" : ""}`}
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div className={`nm${open ? " open" : ""}`}>
        <a href="#home" onClick={(e) => scrollTo(e, "home")}>Home</a>
        <a href="#challenge" onClick={(e) => scrollTo(e, "challenge")}>Why Us</a>
        <a href="#steps" onClick={(e) => scrollTo(e, "steps")}>How It Works</a>
        <a href="#impact" onClick={(e) => scrollTo(e, "impact")}>Impact</a>
        <a href="#contact" onClick={(e) => scrollTo(e, "contact")}>Contact</a>
        <a href="#contact" className="nc" onClick={(e) => scrollTo(e, "contact")}>Book a Demo</a>
      </div>
    </nav>
  )
}
