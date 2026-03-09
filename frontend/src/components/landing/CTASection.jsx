export default function CTASection() {
  const scrollToContact = (e) => {
    e.preventDefault()
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="cta2">
      <h2>We'll Help You Hire, Build, Engage, and Grow Your People.</h2>
      <p>Spiral smarter. Hire faster. Join companies across Indonesia transforming their hiring.</p>
      <a href="#contact" className="ba" onClick={scrollToContact}>Schedule Your Free Demo Now →</a>
    </section>
  )
}
