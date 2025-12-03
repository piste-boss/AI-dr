import jsPDF from 'jspdf'
import type { AnalysisResult, ModeType, ProfileInput } from '../types'

export function exportAnalysisToPdf(mode: ModeType, analysis: AnalysisResult, profile: ProfileInput) {
  const doc = new jsPDF()
  const lines = [
    `${mode === 'medical' ? 'メディカル' : 'フィットネス'}モード`,
    `年齢: ${profile.age || '未入力'} / 身長: ${profile.height || '未入力'}cm / 体重: ${
      profile.weight || '未入力'
    }kg`,
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
