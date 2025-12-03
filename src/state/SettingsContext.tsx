import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Settings = {
  apiKey: string
  model: string
  medicalPrompt: string
  fitnessPrompt: string
}

type SettingsContextValue = {
  settings: Settings
  updateSettings: (payload: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  apiKey: '',
  model: 'gemini-1.5-flash',
  medicalPrompt:
    'You are a careful medical advisor. Keep safety first, avoid definitive diagnoses, and recommend seeing a clinician for anything uncertain.',
  fitnessPrompt:
    'You are an encouraging fitness coach. Prioritize progressive overload, injury prevention, and realistic weekly plans.',
}

const STORAGE_KEY = 'ai-dr-settings'

const SettingsContext = createContext<SettingsContextValue | null>(null)

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.warn('Failed to load settings from storage', error)
  }
  return defaultSettings
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  const updateSettings = (payload: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...payload }))
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to persist settings', error)
    }
  }, [settings])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings,
    }),
    [settings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return ctx
}
