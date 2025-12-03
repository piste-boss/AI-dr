import { type FormEvent, useState } from 'react'
import { useSettings } from '../state/SettingsContext.tsx'
import type { Settings } from '../state/SettingsContext.tsx'

export default function AdminPage() {
  const { settings, updateSettings } = useSettings()
  const [draft, setDraft] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <section className="admin">
      <header className="mode-header">
        <div>
          <p className="eyebrow">設定</p>
          <h1>管理画面</h1>
          <p className="lede">APIキーとプロンプトをここで編集できます。変更はローカルに保存されます。</p>
        </div>
        {saved && <span className="pill subtle">保存しました</span>}
      </header>

      <form className="card" onSubmit={onSubmit}>
        <div className="input">
          <label>Gemini APIキー</label>
          <input
            type="password"
            placeholder="AIza..."
            value={draft.apiKey}
          onChange={(e) => setDraft((prev: Settings) => ({ ...prev, apiKey: e.target.value }))}
          />
          <p className="hint">キーはブラウザのローカルストレージにのみ保存されます。</p>
        </div>

        <div className="input">
          <label>モデル</label>
          <input
            type="text"
            placeholder="gemini-1.5-flash"
            value={draft.model}
            onChange={(e) => setDraft((prev: Settings) => ({ ...prev, model: e.target.value }))}
          />
        </div>

        <div className="input">
          <label>メディカル用プロンプト</label>
          <textarea
            rows={4}
            value={draft.medicalPrompt}
            onChange={(e) => setDraft((prev: Settings) => ({ ...prev, medicalPrompt: e.target.value }))}
          />
        </div>

        <div className="input">
          <label>フィットネス用プロンプト</label>
          <textarea
            rows={4}
            value={draft.fitnessPrompt}
            onChange={(e) => setDraft((prev: Settings) => ({ ...prev, fitnessPrompt: e.target.value }))}
          />
        </div>

        <div className="actions">
          <button type="submit" className="btn primary">
            保存
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setDraft(settings)}
          >
            元に戻す
          </button>
        </div>
      </form>
    </section>
  )
}
