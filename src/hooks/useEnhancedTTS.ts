'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { VoiceServiceFactory } from '@/services/voice/VoiceServiceFactory'
import { VoiceProvider } from '@/services/voice/types'

interface EnhancedTTSHookReturn {
  speak: (text: string) => void
  stop: () => void
  isPlaying: boolean
  audioAnalyser: AnalyserNode | null
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void
  provider: string
  streamingText: string
  setStreamingTextCallback: (callback: (text: string) => void) => void
}

export function useEnhancedTTS(avatarName?: string): EnhancedTTSHookReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [provider, setProvider] = useState<string>('webspeech')
  const [streamingText, setStreamingText] = useState<string>('')

  const voiceProviderRef = useRef<VoiceProvider | null>(null)
  const currentAvatarRef = useRef<string | undefined>(avatarName)
  const streamingTextCallbackRef = useRef<((text: string) => void) | null>(null)
  const isSpeakingRef = useRef<boolean>(false)
  const lastSpeechTextRef = useRef<string>('')

  // Initialize voice provider when avatar changes
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        // Use ElevenLabs with your voice configuration
        const config = {
          provider: 'elevenlabs',
          voiceId: '4tRn1lSkEn13EVTuqb0g',
          apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
          model: 'eleven_multilingual_v2'
        }

        voiceProviderRef.current = VoiceServiceFactory.createVoiceProvider(config)
        setProvider('elevenlabs')
        console.log('ElevenLabs provider created successfully')

        // Update audio analyser from new provider
        if (voiceProviderRef.current?.audioAnalyser) {
          setAudioAnalyser(voiceProviderRef.current.audioAnalyser)
        }

        // Update current avatar reference
        currentAvatarRef.current = avatarName

      } catch (error) {
        console.error('Provider initialization failed:', error)
        // Fallback to web speech
        try {
          voiceProviderRef.current = VoiceServiceFactory.createVoiceProvider({ provider: 'webspeech' })
          setProvider('webspeech (error fallback)')
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
      }
    }

    initializeProvider()
  }, [avatarName])

  // Load Web Speech voices (for fallback and display)
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)

      const bestVoice = availableVoices.find(voice =>
        voice.name.includes('Neural') ||
        voice.name.includes('Premium') ||
        voice.name.includes('Enhanced') ||
        (voice.lang.startsWith('en') && voice.localService === false)
      ) || availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0]

      setSelectedVoice(bestVoice)
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  // Monitor provider playing state
  useEffect(() => {
    const checkPlayingState = () => {
      if (voiceProviderRef.current) {
        const providerIsPlaying = voiceProviderRef.current.isPlaying
        setIsPlaying(providerIsPlaying)
      }
    }

    const interval = setInterval(checkPlayingState, 50)
    return () => clearInterval(interval)
  }, [])

  const speak = useCallback(async (text: string) => {
    console.log('speak() called with text:', text)
    if (!text.trim()) {
      console.log('speak() - empty text, returning')
      return
    }

    if (voiceProviderRef.current) {
      console.log('speak() - stopping current provider')
      voiceProviderRef.current.stop()
    }

    if (!voiceProviderRef.current) {
      const config = {
        provider: 'elevenlabs',
        voiceId: '4tRn1lSkEn13EVTuqb0g',
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
        model: 'eleven_multilingual_v2'
      }
      voiceProviderRef.current = VoiceServiceFactory.createVoiceProvider(config)
      console.log('ElevenLabs provider created in speak()')
    }

    try {
      console.log('speak() - calling provider.speak()', voiceProviderRef.current.constructor.name)
      await voiceProviderRef.current.speak(text)
      console.log('speak() - provider.speak() completed')
    } catch (error) {
      console.error('speak() - provider.speak() failed:', error)
    }
  }, [])

  const stop = useCallback(() => {
    if (voiceProviderRef.current) {
      voiceProviderRef.current.stop()
      setIsPlaying(false)
    }
  }, [])

  const setStreamingTextCallback = useCallback((callback: (text: string) => void) => {
    streamingTextCallbackRef.current = callback
  }, [])

  // Update streaming text when it changes
  useEffect(() => {
    if (streamingTextCallbackRef.current && streamingText) {
      streamingTextCallbackRef.current(streamingText)
    }
  }, [streamingText])

  return {
    speak,
    stop,
    isPlaying,
    audioAnalyser,
    voices,
    selectedVoice,
    setSelectedVoice,
    provider,
    streamingText,
    setStreamingTextCallback
  }
}