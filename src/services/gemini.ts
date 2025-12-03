import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AnalysisResult, ModeType, ProfileInput } from '../types'
import type { Settings } from '../state/SettingsContext.tsx'

type Params = {
  mode: ModeType
  pdfText: string
  profile: ProfileInput
  settings: Settings
}

function buildPrompt(mode: ModeType, pdfText: string, profile: ProfileInput, settings: Settings) {
  const profileLine = `年齢: ${profile.age || '不明'}, 身長: ${
    profile.height || '不明'
  }cm, 体重: ${profile.weight || '不明'}kg`
  const basePrompt = mode === 'medical' ? settings.medicalPrompt : settings.fitnessPrompt

  return `
${basePrompt}

モード: ${mode}
利用者データ: ${profileLine}

以下のPDF本文を踏まえ、JSONで回答してください。
キー: summary, dietAdvice, vitaminsAndMinerals, exercisePlan
各キーは200文字以内。医療判断が必要な場合は「受診推奨」を添えてください。

PDF本文:
"""${pdfText.slice(0, 12000)}"""
`
}

function safeParseResult(text: string): AnalysisResult {
  const fallback: AnalysisResult = {
    summary: '解析結果を取得できませんでした。',
    dietAdvice: '食事アドバイスは空です。',
    vitaminsAndMinerals: '補足情報は空です。',
    exercisePlan: '運動プランは空です。',
    rawText: text,
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { ...fallback, rawText: text }
    }
    const parsed = JSON.parse(jsonMatch[0]) as Partial<AnalysisResult>
    return {
      summary: parsed.summary || fallback.summary,
      dietAdvice: parsed.dietAdvice || fallback.dietAdvice,
      vitaminsAndMinerals: parsed.vitaminsAndMinerals || fallback.vitaminsAndMinerals,
      exercisePlan: parsed.exercisePlan || fallback.exercisePlan,
      rawText: text,
    }
  } catch (error) {
    console.warn('Failed to parse model output', error)
    return { ...fallback, rawText: text }
  }
}

function sampleResult(mode: ModeType, pdfText: string): AnalysisResult {
  const trimmed = pdfText.slice(0, 220).replace(/\s+/g, ' ')
  return {
    summary: `サンプル出力です。PDFの冒頭: ${trimmed || '本文が空です'}`,
    dietAdvice:
      mode === 'medical'
        ? '1日3食のバランスと十分な水分を確保してください。'
        : 'タンパク質1.6g/kgを目安に、運動後30分以内の補食を検討。',
    vitaminsAndMinerals:
      mode === 'medical'
        ? '鉄・ビタミンB群を含む食品を意識し、不調が続く場合は受診を推奨します。'
        : '緑黄色野菜と乳製品でビタミンDとカルシウムを補給。日光浴も適度に。',
    exercisePlan:
      mode === 'medical'
        ? '無理のない有酸素を週3回20分、痛みがある場合は中止し医師に相談。'
        : '週3回の全身レジスタンストレーニングと週2回の有酸素を30分。',
    rawText: 'APIキー未設定のためサンプル出力を表示しています。',
  }
}

export async function analyzePdfWithGemini(params: Params): Promise<AnalysisResult> {
  const { mode, pdfText, profile, settings } = params

  if (!settings.apiKey) {
    return sampleResult(mode, pdfText)
  }

  const prompt = buildPrompt(mode, pdfText, profile, settings)
  const genAI = new GoogleGenerativeAI(settings.apiKey)
  const model = genAI.getGenerativeModel({ model: settings.model || 'gemini-1.5-flash' })

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return safeParseResult(text)
  } catch (error) {
    console.error(error)
    return {
      summary: 'Geminiの呼び出しに失敗しました。',
      dietAdvice: '食事アドバイスを再度お試しください。',
      vitaminsAndMinerals: 'ビタミン・ミネラル指導を再度お試しください。',
      exercisePlan: '運動プランを再度お試しください。',
      rawText: 'API呼び出しに失敗しました。',
    }
  }
}
