import { type DragEvent, useState } from 'react'
import type { AnalysisResult, ModeType, ProfileInput } from '../types'
import { exportAnalysisToPdf } from '../services/export'
import { analyzePdfWithGemini } from '../services/gemini'
import { extractTextFromPdf } from '../services/pdf'
import { useSettings } from '../state/SettingsContext.tsx'

const modeCopy: Record<ModeType, { title: string; accent: string }> = {
  medical: {
    title: 'メディカルモード',
    accent: '#60a5fa',
  },
  fitness: {
    title: 'フィットネスモード',
    accent: '#f97316',
  },
}

type RunStatus = 'idle' | 'extracting' | 'analyzing'

type Props = {
  mode: ModeType
}

export default function ModePage({ mode }: Props) {
  const { settings } = useSettings()
  const [file, setFile] = useState<File | null>(null)
  const [pdfText, setPdfText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [status, setStatus] = useState<RunStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [profile] = useState<ProfileInput>({
    age: '',
    height: '',
    weight: '',
  })

  const info = modeCopy[mode]

  const isBusy = status !== 'idle'

  const handleFile = (nextFile: File) => {
    if (!nextFile.type.includes('pdf')) {
      setError('PDFファイルを選択してください。')
      return
    }
    setFile(nextFile)
    setError(null)
    setAnalysis(null)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) handleFile(dropped)
  }

  const onAnalyze = async () => {
    if (!file) {
      setError('PDFファイルをアップロードしてください。')
      return
    }
    setError(null)
    try {
      setStatus('extracting')
      const extractedText = await extractTextFromPdf(file)
      setPdfText(extractedText)

      setStatus('analyzing')
      const result = await analyzePdfWithGemini({
        mode,
        pdfText: extractedText,
        profile,
        settings,
      })
      setAnalysis(result)
    } catch (err) {
      console.error(err)
      setError('解析中に問題が発生しました。もう一度お試しください。')
    } finally {
      setStatus('idle')
    }
  }

  const handleDownload = () => {
    if (analysis) {
      exportAnalysisToPdf(mode, analysis, profile)
    }
  }

  const showDoctorIcon = mode === 'medical'
  const showFitnessIcon = mode === 'fitness'

  return (
    <section className="mode-page">
      <header className="mode-header" style={{ borderColor: info.accent }}>
        <div>
          <h1>{info.title}</h1>
        </div>
        {showDoctorIcon && (
          <span className="pill pictogram" aria-label="病院アイコン" style={{ backgroundColor: info.accent }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6.5 4h11c.83 0 1.5.67 1.5 1.5v13c0 .28-.22.5-.5.5H5c-.28 0-.5-.22-.5-.5v-13C4.5 4.67 5.17 4 6.5 4Z"
                fill="#ffffff"
                stroke="none"
                opacity="0.12"
              />
              <rect x="6" y="4" width="12" height="15" rx="1" ry="1" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M10 10h4m-2-2v4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 16h2m4 0h2" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
        )}
        {showFitnessIcon && (
          <span className="pill pictogram" aria-label="フィットネスアイコン" style={{ backgroundColor: info.accent }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="10" width="3" height="4" rx="0.8" fill="#ffffff" />
              <rect x="17" y="10" width="3" height="4" rx="0.8" fill="#ffffff" />
              <rect x="7" y="11" width="10" height="2" rx="0.8" fill="#ffffff" />
              <path d="M9 9.2h6v5.6H9z" stroke="#ffffff" strokeWidth="1.6" />
              <path d="M12 7v3" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.5 16.5 8 18" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M14.5 16.5 16 18" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </header>

      <div className="grid two-columns">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">ステップ1</p>
              <h3>PDFアップロード</h3>
            </div>
            {file && <button className="btn link" onClick={() => setFile(null)}>クリア</button>}
          </div>
          <div
            className={`dropzone ${dragActive ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="application/pdf"
              id="pdf-input"
              onChange={(e) => {
                const uploaded = e.target.files?.[0]
                if (uploaded) handleFile(uploaded)
              }}
            />
            <p className="dropzone-text">
              ここにPDFをドロップ、または <label htmlFor="pdf-input">ファイルを選択</label>
            </p>
            <p className="dropzone-hint">医療レポート、検査結果、食事ログなど</p>
            {file && <div className="file-name">選択中: {file.name}</div>}
          </div>

          <div className="actions">
            <button className="btn primary" disabled={isBusy} onClick={onAnalyze}>
              {status === 'extracting' && 'PDF解析中...'}
              {status === 'analyzing' && 'AI診断中...'}
              {status === 'idle' && 'AI診断'}
            </button>
            {analysis && (
              <button className="btn secondary" onClick={handleDownload}>
                PDFで出力
              </button>
            )}
          </div>
          {error && <p className="error">{error}</p>}
          {!settings.apiKey && (
            <p className="warning">
              APIキー未設定です。管理画面でキーとモデルを登録するとGeminiを呼び出せます。
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">ステップ2</p>
              <h3>結果と提案</h3>
            </div>
            {analysis && (
              <span className="pill subtle">生成済み</span>
            )}
          </div>
          {analysis ? (
            <div className="analysis">
              <section>
                <h4>要約</h4>
                <p>{analysis.summary}</p>
              </section>
              <section>
                <h4>食事アドバイス</h4>
                <p>{analysis.dietAdvice}</p>
              </section>
              <section>
                <h4>ビタミン・ミネラル</h4>
                <p>{analysis.vitaminsAndMinerals}</p>
              </section>
              <section>
                <h4>運動プラン</h4>
                <p>{analysis.exercisePlan}</p>
              </section>
            </div>
          ) : (
            <div className="placeholder">
              <p>AI診断結果が表示されます。</p>
              {pdfText && (
                <details>
                  <summary>抽出されたPDFテキストを見る</summary>
                  <pre className="pdf-preview">{pdfText.slice(0, 1800) || 'テキストなし'}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

    </section>
  )
}
