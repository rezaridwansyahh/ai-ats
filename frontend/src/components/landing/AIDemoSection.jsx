export default function AIDemoSection() {
  return (
    <section className="aid">
      <div className="inn" style={{ textAlign: "center" }}>
        <div className="sl" style={{ justifyContent: "center" }}>LIVE PREVIEW</div>
        <div className="st">See AI Screening in Action</div>
        <div className="sd" style={{ margin: "0 auto" }}>Experience how Myralix's AI assistant screens candidates in real-time.</div>
        <div className="cb">
          <div className="cbh">
            <span className="bl"></span>
            <span>Myralix AI Screener</span>
          </div>
          <div className="cbb">
            <div className="mg ai">Hi! I'm the Myralix AI assistant. I'll help screen your application for the Senior Developer role at PT TechNova. Ready?</div>
            <div className="mg us">Yes, I'm ready!</div>
            <div className="mg ai">Great! I see 5+ years of React from your CV. Can you describe a complex state management challenge you solved?</div>
            <div className="mg us">I redesigned our global state with Redux Toolkit and RTK Query, cutting API calls by 60%...</div>
            <div className="mg ai">Excellent! ✅ Flagging as <strong>Top Match (92%)</strong> — forwarding to hiring manager for interview scheduling.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
