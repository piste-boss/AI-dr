import { Link } from 'react-router-dom'
import type { ModeType } from '../types'

const modes: Record<
  ModeType,
  { title: string; description: string; accent: string; badge: string }
> = {
  medical: {
    title: 'メディカルモード',
    description: '処方・検査結果・問診票などを解析し、リスクと次の一手を要約。',
    accent: '#60a5fa',
    badge: '医療向け',
  },
  fitness: {
    title: 'フィットネスモード',
    description: '身体データとPDFの内容から食事と運動を提案。実行しやすいメニューを提示。',
    accent: '#f97316',
    badge: 'トレーニング向け',
  },
}

export default function LandingPage() {
  return (
    <section className="landing">
      <div className="hero">
        <p className="eyebrow">AIドリブン・アドバイザー</p>
        <h1>
          メディカルとフィットネスの
          <br />
          PDF分析を一つの画面で。
        </h1>
        <p className="lede">
          Geminiベースの要約とアドバイス生成。管理画面からプロンプトとAPI設定を即座に更新できます。
        </p>
        <div className="hero-actions">
          <Link to="/mode/medical" className="btn primary">
            メディカルモード
          </Link>
          <Link to="/mode/fitness" className="btn ghost">
            フィットネスモード
          </Link>
        </div>
      </div>
      <div className="mode-grid">
        {(Object.keys(modes) as ModeType[]).map((mode) => {
          const info = modes[mode]
          return (
            <div key={mode} className="mode-card">
              <div className="mode-card__badge" style={{ backgroundColor: info.accent }}>
                {info.badge}
              </div>
              <div className="mode-card__title">{info.title}</div>
              <p className="mode-card__desc">{info.description}</p>
              <Link to={`/mode/${mode}`} className="btn subtle">
                このモードで開始
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
