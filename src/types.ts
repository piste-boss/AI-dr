export type ModeType = 'medical' | 'fitness'

export type ProfileInput = {
  age: string
  height: string
  weight: string
}

export type AnalysisResult = {
  summary: string
  dietAdvice: string
  vitaminsAndMinerals: string
  exercisePlan: string
  rawText: string
}
