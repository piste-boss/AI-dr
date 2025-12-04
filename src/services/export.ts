import jsPDF from 'jspdf'
import fontUrl from '../assets/NotoSansJP-Regular.ttf?url'
import type { AnalysisResult, ModeType, ProfileInput } from '../types'

const FONT_NAME = 'NotoSansJP'
const FONT_FILE = 'NotoSansJP-Regular.ttf'
const FALLBACK_FONT_PATH = '/fonts/NotoSansJP-Regular.ttf'

let fontReady = false
let fontDataPromise: Promise<string> | null = null

async function loadFontData() {
  if (fontDataPromise) return fontDataPromise

  fontDataPromise = fetch(fontUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load font: ${res.status}`)
      return res.arrayBuffer()
    })
    .catch((error) => {
      console.warn('Inline font fetch failed, fallback to public font', error)
      return fetch(FALLBACK_FONT_PATH).then((res) => {
        if (!res.ok) throw new Error(`Fallback font fetch failed: ${res.status}`)
        return res.arrayBuffer()
      })
    })
    .then(arrayBufferToBase64)

  return fontDataPromise
}

async function ensureJapaneseFont(doc: jsPDF) {
  if (fontReady) return
  const base64 = await loadFontData()
  doc.addFileToVFS(FONT_FILE, base64)
  doc.addFont(FONT_FILE, FONT_NAME, 'normal', 'Identity-H')
  fontReady = true
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function exportAnalysisToPdf(mode: ModeType, analysis: AnalysisResult, _profile: ProfileInput) {
  const doc = new jsPDF()
  try {
    await ensureJapaneseFont(doc)
    doc.setFont(FONT_NAME, 'normal')
  } catch (error) {
    console.warn('Failed to load JP font, falling back to default', error)
  }

  const lines = [
    `${mode === 'medical' ? 'メディカル' : 'フィットネス'}モード`,
    '',
    '要約',
    analysis.summary,
    '',
    '食事アドバイス',
    analysis.dietAdvice,
    '',
    'ビタミン・ミネラル',
    analysis.vitaminsAndMinerals,
    '',
    '運動プラン',
    analysis.exercisePlan,
  ]

  const margin = 14
  let cursor = margin
  doc.setFontSize(14)
  doc.text(lines[0], margin, cursor)
  cursor += 8
  doc.setFontSize(10)
  doc.text(lines[1], margin, cursor)
  doc.setFontSize(12)

  lines.slice(2).forEach((line) => {
    const wrapped = doc.splitTextToSize(line || '', 180)
    wrapped.forEach((row: string) => {
      if (cursor > 280) {
        doc.addPage()
        cursor = margin
      }
      doc.text(row, margin, cursor)
      cursor += 7
    })
  })

  const filename = `${mode}-analysis.pdf`
  doc.save(filename)
}
