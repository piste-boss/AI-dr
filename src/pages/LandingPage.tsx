import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <section className="landing">
      <div className="hero">
        <p className="eyebrow">AI Advisor</p>
        <h1>
          AI Dr.があなたの
          <br />
          測定結果を分析
        </h1>
        <div className="hero-actions">
          <Link to="/mode/medical" className="btn primary">
            メディカルモード
          </Link>
          <Link to="/mode/fitness" className="btn fitness">
            フィットネスモード
          </Link>
        </div>
      </div>
    </section>
  )
}
