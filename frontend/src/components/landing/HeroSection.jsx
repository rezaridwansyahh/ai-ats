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
          <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A6E5C"/>
                <stop offset="100%" stopColor="#14B8A6"/>
              </linearGradient>
              <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B"/>
                <stop offset="50%" stopColor="#14B8A6"/>
                <stop offset="100%" stopColor="#0A6E5C"/>
              </linearGradient>
            </defs>
            <path d="M120,40 C210,70 290,155 200,200 C110,245 200,330 290,360" stroke="url(#g1)" strokeWidth="7" fill="none" strokeLinecap="round" opacity=".75">
              <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="35s" repeatCount="indefinite"/>
            </path>
            <path d="M280,40 C190,70 110,155 200,200 C290,245 200,330 110,360" stroke="url(#g2)" strokeWidth="7" fill="none" strokeLinecap="round" opacity=".75">
              <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="-360 200 200" dur="35s" repeatCount="indefinite"/>
            </path>
            <circle cx="155" cy="115" r="6" fill="#F59E0B" opacity=".85">
              <animate attributeName="r" values="6;9;6" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="245" cy="115" r="6" fill="#14B8A6" opacity=".85">
              <animate attributeName="r" values="6;9;6" dur="3s" begin=".5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="200" cy="200" r="10" fill="#FFF" opacity=".9">
              <animate attributeName="r" values="10;14;10" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="155" cy="285" r="6" fill="#14B8A6" opacity=".85">
              <animate attributeName="r" values="6;9;6" dur="3s" begin="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="245" cy="285" r="6" fill="#F59E0B" opacity=".85">
              <animate attributeName="r" values="6;9;6" dur="3s" begin="1.5s" repeatCount="indefinite"/>
            </circle>
            <line x1="155" y1="115" x2="245" y2="115" stroke="#FFF" strokeWidth="1" opacity=".12"/>
            <line x1="155" y1="285" x2="245" y2="285" stroke="#FFF" strokeWidth="1" opacity=".12"/>
          </svg>
        </div>
      </div>
    </section>
  )
}
