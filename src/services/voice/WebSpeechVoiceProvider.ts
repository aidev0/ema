'use client'

import { VoiceProvider } from './types'

export class WebSpeechVoiceProvider implements VoiceProvider {
  private _isPlaying: boolean = false
  private _audioAnalyser: AnalyserNode | null = null
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private lastSpeechTime: number = 0

  constructor(private selectedVoice?: SpeechSynthesisVoice) {
    // Don't initialize AudioContext immediately - wait for user interaction
  }

  get isPlaying() {
    return this._isPlaying
  }

  get audioAnalyser() {
    return this._audioAnalyser
  }

  private async initAudioContext() {
    try {
      this.audioContext = new AudioContext()

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      this._audioAnalyser = analyser
    } catch (error) {
      // Silent fail
    }
  }

  async speak(text: string): Promise<void> {
    console.log('WebSpeech speak() called with:', text)
    if (!text.trim()) return

    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported')
    }

    try {
      this.stop()

      // Initialize audio context if not already done (after user interaction)
      if (!this.audioContext) {
        console.log('WebSpeech: Initializing audio context')
        await this.initAudioContext()
      }

      // Ensure audio context is running
      if (this.audioContext?.state === 'suspended') {
        console.log('WebSpeech: Resuming audio context')
        await this.audioContext.resume()
      }

      const utterance = new SpeechSynthesisUtterance(text)
      this.currentUtterance = utterance

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      this._isPlaying = true

      // Start lip sync simulation
      this.startLipSyncSimulation(text)

      return new Promise((resolve, reject) => {
        let isResolved = false

        const cleanup = () => {
          this._isPlaying = false
          this.stopLipSyncSimulation()
          this.currentUtterance = null
        }

        const safeResolve = () => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            resolve()
          }
        }

        const safeReject = (error: Error) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            reject(error)
          }
        }

        utterance.onstart = () => {
          this._isPlaying = true
        }

        utterance.onend = () => {
          safeResolve()
        }

        utterance.onerror = (event) => {
          // Don't reject on interrupted - it's normal when stopping/replacing speech
          if (event.error === 'interrupted') {
            safeResolve() // Treat interruption as successful completion
          } else {
            safeReject(new Error(event.error))
          }
        }

        speechSynthesis.speak(utterance)
      })

    } catch (error) {
      this._isPlaying = false
      this.stopLipSyncSimulation()
      throw error
    }
  }

  private startLipSyncSimulation(text: string) {
    if (!this.audioContext || !this._audioAnalyser) return

    // Stop any existing lip sync first
    this.stopLipSyncSimulation()

    try {
      this.oscillator = this.audioContext.createOscillator()
      this.gainNode = this.audioContext.createGain()

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this._audioAnalyser)
      // Connect to destination as well so we can hear it (very quietly for debugging)
      this.gainNode.connect(this.audioContext.destination)

      this.oscillator.type = 'sine'
      this.oscillator.frequency.setValueAtTime(120, this.audioContext.currentTime)
      this.gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime)

      this.oscillator.start()

      // Simulate speech pattern
      const words = text.split(' ')
      let currentTime = this.audioContext.currentTime

      words.forEach((word, index) => {
        if (!this.oscillator || !this.gainNode) return // Check if still valid

        const wordDuration = Math.max(0.3, word.length * 0.1)
        const pauseDuration = 0.15

        const baseFreq = 100 + Math.random() * 80
        const amplitude = 0.03 + Math.random() * 0.04

        try {
          this.oscillator.frequency.exponentialRampToValueAtTime(baseFreq, currentTime + 0.01)
          this.gainNode.gain.exponentialRampToValueAtTime(amplitude, currentTime + 0.01)

          currentTime += wordDuration + pauseDuration
          this.gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime - pauseDuration + 0.01)
        } catch (e) {
          // Silent fail
        }
      })

    } catch (error) {
      // Silent fail
    }
  }

  private stopLipSyncSimulation() {
    if (this.oscillator) {
      try {
        this.oscillator.stop()
      } catch (e) {
        // Oscillator might already be stopped
      }
      this.oscillator.disconnect()
      this.oscillator = null
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
  }

  stop(): void {
    speechSynthesis.cancel()
    this._isPlaying = false
    this.stopLipSyncSimulation()
    this.currentUtterance = null
  }
}