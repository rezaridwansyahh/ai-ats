const FooterLogo = () => (
  <svg viewBox="0 0 320 42" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 28, width: "auto" }}>
    <text x="0" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF">M</text>
    <text x="38" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF">Y</text>
    <text x="68" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF">R</text>
    <text x="97" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF">A</text>
    <text x="128" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF">L</text>
    <g transform="translate(153,2)">
      <path d="M4 0C12 4 20 14 12 18C4 22 12 32 20 36" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M20 0C12 4 4 14 12 18C20 22 12 32 4 36" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <circle cx="8" cy="9" r="1.8" fill="#F59E0B"/>
      <circle cx="16" cy="9" r="1.8" fill="#14B8A6"/>
      <circle cx="12" cy="18" r="2.2" fill="#FFF"/>
      <circle cx="8" cy="27" r="1.8" fill="#14B8A6"/>
      <circle cx="16" cy="27" r="1.8" fill="#F59E0B"/>
    </g>
    <text x="180" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF">X</text>
  </svg>
)

export default function FooterSection() {
  const scrollTo = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <footer>
      <div className="fi2">
        <div className="fb2">
          <div><FooterLogo /></div>
          <p>AI-powered ATS built for Indonesia's talent future. From hiring the right people to helping them succeed.</p>
        </div>
        <div className="fc2">
          <h4>Product</h4>
          <a href="#steps" onClick={(e) => scrollTo(e, "steps")}>How It Works</a>
          <a href="#impact" onClick={(e) => scrollTo(e, "impact")}>Impact</a>
          <a href="#">Security</a>
        </div>
        <div className="fc2">
          <h4>Company</h4>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
          <a href="#">Press</a>
        </div>
        <div className="fc2">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">API Docs</a>
          <a href="#contact" onClick={(e) => scrollTo(e, "contact")}>Contact</a>
          <a href="#">Privacy</a>
        </div>
      </div>
      <div className="fbt">© 2025 Myralix. All rights reserved. | Transforming Talent Experience with AI</div>
    </footer>
  )
}
