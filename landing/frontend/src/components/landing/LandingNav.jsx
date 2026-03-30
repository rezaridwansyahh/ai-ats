export default function LandingNav({ scrolled }) {
  const scrollTo = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className={scrolled ? "s" : ""}>
      <a href="#home" className="nb" onClick={(e) => scrollTo(e, "home")}>
        <img src="/Myralix_Logo_White.png" alt="Myralix" className="logo-img" />
      </a>
      <div className="nm">
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
