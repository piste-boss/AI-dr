import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '../state/SettingsContext.tsx'
import type { Settings } from '../state/SettingsContext.tsx'

export default function AdminPage() {
  const { settings, updateSettings } = useSettings()
  const [draft, setDraft] = useState<Settings>(settings)
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [syncKey, setSyncKey] = useState(() => (typeof window === 'undefined' ? '' : localStorage.getItem('ai-dr-sync-key') || ''))
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-dr-sync-key', syncKey)
    }
  }, [syncKey])

  const syncKeyValid = useMemo(() => syncKey && syncKey.length >= 6, [syncKey])

  const onSyncSave = async () => {
    if (!syncKeyValid) {
      setSyncError('6文字以上の同期キーを入力してください。')
      setSyncMessage(null)
      return
    }
    setSyncLoading(true)
    setSyncError(null)
    setSyncMessage(null)
    try {
      const res = await fetch(`/.netlify/functions/settings?syncKey=${encodeURIComponent(syncKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setSyncMessage('クラウドに保存しました。別端末で同期キーを入力して取得できます。')
    } catch (error) {
      console.error(error)
      setSyncError('クラウド保存に失敗しました。ネットワークを確認してください。')
    } finally {
      setSyncLoading(false)
    }
  }

  const onSyncLoad = async () => {
    if (!syncKeyValid) {
      setSyncError('6文字以上の同期キーを入力してください。')
      setSyncMessage(null)
      return
    }
    setSyncLoading(true)
    setSyncError(null)
    setSyncMessage(null)
    try {
      const res = await fetch(`/.netlify/functions/settings?syncKey=${encodeURIComponent(syncKey)}`)
      if (res.status === 404) throw new Error('not found')
      if (!res.ok) throw new Error(`Load failed: ${res.status}`)
      const payload = await res.json()
      const next = { ...settings, ...(payload?.data as Partial<Settings>) }
      updateSettings(next)
      setDraft(next)
      setSyncMessage('クラウドから取得しました。')
    } catch (error) {
      console.error(error)
      setSyncError('クラウド取得に失敗しました。同期キーを確認してください。')
    } finally {
      setSyncLoading(false)
    }
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
          <p className="lede">APIキーとプロンプトをここで編集できます。変更はローカルに保存されます。別端末へはクラウド同期かエクスポート/インポートをご利用ください。</p>
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
          <button
            type="button"
            className="btn primary"
            onClick={() => void onSyncSave()}
            disabled={syncLoading}
          >
            クラウドに保存
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => void onSyncLoad()}
            disabled={syncLoading}
          >
            クラウドから取得
          </button>
        </div>
        <div className="input">
          <label>同期キー（6文字以上）</label>
          <input
            type="text"
            placeholder="例: my-device-sync"
            value={syncKey}
            onChange={(e) => setSyncKey(e.target.value)}
          />
          <p className="hint">同期キーを知っている人は誰でも設定にアクセスできます。秘密にしてください。</p>
        </div>
        {importError && <p className="error">{importError}</p>}
        {syncError && <p className="error">{syncError}</p>}
        {syncMessage && <p className="success">{syncMessage}</p>}
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
