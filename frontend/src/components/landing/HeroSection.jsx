export default function HeroSection() {
  const scrollToContact = (e) => {
    e.preventDefault()
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="hero" id="home">
      <div className="hi">
        <div>
          <div className="he"><span className="dt"></span>AI-POWERED HR PLATFORM</div>
          <h1>Transforming Talent Experience with <em>AI</em></h1>
          <p className="hd">From hiring the right people to helping them succeed. The most intelligent ATS built for Indonesia — reduce time-to-hire by 50%, cut costs, and build teams that thrive.</p>
          <div className="ha">
            <a href="#contact" className="ba" onClick={scrollToContact}>Schedule Your Free Demo →</a>
          </div>
          <div className="hm">
            <div className="met"><div className="n">50%</div><div className="l">Faster Hiring</div></div>
            <div className="met"><div className="n">50%</div><div className="l">Lower Cost-Per-Hire</div></div>
            <div className="met"><div className="n">3,000+</div><div className="l">Positions Supported</div></div>
          </div>
        </div>
        <div className="hv">
          <img src="/Myralix_DNA_Helix.svg" alt="Myralix DNA Helix" className="hero-helix" />
        </div>
      </div>
    </section>
  )
}
