// Voice provider interface
export interface VoiceProvider {
  speak(text: string): Promise<void>
  stop(): void
  isPlaying: boolean
  audioAnalyser: AnalyserNode | null
}

export interface VoiceConfig {
  provider: 'elevenlabs' | 'vapi' | 'webspeech'
  voiceId?: string
  assistantId?: string
  apiKey?: string
  model?: string
}

export interface TTSHookReturn {
  speak: (text: string) => void
  stop: () => void
  isPlaying: boolean
  audioAnalyser: AnalyserNode | null
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void
}