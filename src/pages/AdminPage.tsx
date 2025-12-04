import { type ChangeEvent, type FormEvent, useRef, useState } from 'react'
import { useSettings } from '../state/SettingsContext.tsx'
import type { Settings } from '../state/SettingsContext.tsx'

export default function AdminPage() {
  const { settings, updateSettings } = useSettings()
  const [draft, setDraft] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const onExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ai-dr-settings.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<Settings>
        const merged = { ...settings, ...parsed }
        updateSettings(merged)
        setDraft(merged)
        setSaved(true)
        setImportError(null)
        setTimeout(() => setSaved(false), 1800)
      } catch (error) {
        console.error(error)
        setImportError('インポートに失敗しました。JSONファイルを確認してください。')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <section className="admin">
      <header className="mode-header">
        <div>
          <p className="eyebrow">設定</p>
          <h1>管理画面</h1>
          <p className="lede">APIキーとプロンプトをここで編集できます。変更はローカルに保存されます。別端末ではエクスポート/インポートしてください。</p>
        </div>
      </header>
      {saved && (
        <div className="save-toast-overlay" role="status" aria-live="polite">
          <div className="save-toast">保存しました</div>
        </div>
      )}

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
          <button
            type="button"
            className="btn secondary"
            onClick={onExport}
          >
            設定をエクスポート
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            設定をインポート
          </button>
        </div>
        {importError && <p className="error">{importError}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={onImport}
        />
      </form>
    </section>
  )
}
