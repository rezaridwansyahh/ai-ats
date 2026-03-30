import { useEffect, useState } from "react"
import "@/components/landing/landing.css"
import LandingNav from "@/components/landing/LandingNav"
import HeroSection from "@/components/landing/HeroSection"
import HiringChallengeSection from "@/components/landing/HiringChallengeSection"
import SolutionSection from "@/components/landing/SolutionSection"
import HowItWorksSection from "@/components/landing/HowItWorksSection"
import AIDemoSection from "@/components/landing/AIDemoSection"
import BusinessImpactSection from "@/components/landing/BusinessImpactSection"
import ContactSection from "@/components/landing/ContactSection"
import CTASection from "@/components/landing/CTASection"
import FooterSection from "@/components/landing/FooterSection"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("v")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    const elements = document.querySelectorAll(".landing .fi-o")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing">
      <LandingNav scrolled={scrolled} />
      <HeroSection />
      <HiringChallengeSection />
      <SolutionSection />
      <HowItWorksSection />
      <AIDemoSection />
      <BusinessImpactSection />
      <ContactSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
