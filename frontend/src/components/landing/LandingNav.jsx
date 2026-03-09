import { Link } from "react-router-dom"

const LogoSvg = () => (
  <svg viewBox="0 0 320 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
    <text x="0" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF" fontWeight="400">M</text>
    <text x="38" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF" fontWeight="400">Y</text>
    <text x="68" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF" fontWeight="400">R</text>
    <text x="97" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF" fontWeight="400">A</text>
    <text x="128" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF" fontWeight="400">L</text>
    <g transform="translate(153, 2)">
      <path d="M4 0C12 4 20 14 12 18C4 22 12 32 20 36" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M20 0C12 4 4 14 12 18C20 22 12 32 4 36" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <circle cx="8" cy="9" r="1.8" fill="#F59E0B"/>
      <circle cx="16" cy="9" r="1.8" fill="#14B8A6"/>
      <circle cx="12" cy="18" r="2.2" fill="#FFF"/>
      <circle cx="8" cy="27" r="1.8" fill="#14B8A6"/>
      <circle cx="16" cy="27" r="1.8" fill="#F59E0B"/>
    </g>
    <text x="180" y="34" fontFamily="'DM Serif Display',Georgia,serif" fontSize="38" fill="#FFF" fontWeight="400">X</text>
  </svg>
)

export default function LandingNav({ scrolled }) {
  const scrollTo = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className={scrolled ? "s" : ""}>
      <a href="#home" className="nb" onClick={(e) => scrollTo(e, "home")}>
        <LogoSvg />
      </a>
      <div className="nm">
        <a href="#home" onClick={(e) => scrollTo(e, "home")}>Home</a>
        <a href="#challenge" onClick={(e) => scrollTo(e, "challenge")}>Why Us</a>
        <a href="#steps" onClick={(e) => scrollTo(e, "steps")}>How It Works</a>
        <a href="#impact" onClick={(e) => scrollTo(e, "impact")}>Impact</a>
        <a href="#contact" onClick={(e) => scrollTo(e, "contact")}>Contact</a>
        <Link to="/login" className="nc">Login</Link>
      </div>
    </nav>
  )
}
