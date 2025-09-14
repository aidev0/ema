'use client'

import { VoiceProvider } from './types'

export class ElevenLabsVoiceProvider implements VoiceProvider {
  private _isPlaying: boolean = false
  private _audioAnalyser: AnalyserNode | null = null
  private audioContext: AudioContext | null = null
  private currentAudio: HTMLAudioElement | null = null
  private currentSource: AudioBufferSourceNode | null = null

  constructor(
    private voiceId: string = 'EXAVITQu4vr4xnSDxMaL', // Default Bella voice
    private apiKey?: string,
    private model: string = 'eleven_monolingual_v1'
  ) {
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

      // Ensure audio context starts in the right state
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      this._audioAnalyser = analyser

      console.log('ElevenLabs: AudioContext initialized, state:', this.audioContext.state)
    } catch (error) {
      console.error('ElevenLabs: Failed to init AudioContext:', error)
    }
  }

  async speak(text: string): Promise<void> {
    if (!text.trim()) return

    this.stop()
    this._isPlaying = true

    // Get API key
    const key = this.apiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    if (!key) {
      throw new Error('ElevenLabs API key not found')
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': key
        },
        body: JSON.stringify({
          text,
          model_id: this.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    // Initialize audio context if needed
    if (!this.audioContext) {
      await this.initAudioContext()
    }

    // Get audio and use MediaElementSource for HTML Audio with analyser
    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl)

      // Connect HTML Audio to analyser using MediaElementSource
      if (this.audioContext && this._audioAnalyser) {
        try {
          const source = this.audioContext.createMediaElementSource(this.currentAudio)
          source.connect(this._audioAnalyser)
          source.connect(this.audioContext.destination)
          console.log('ElevenLabs: Connected HTML Audio to analyser')
        } catch (error) {
          console.error('ElevenLabs: Failed to connect audio to analyser:', error)
        }
      }

      this.currentAudio.onplay = () => {
        this._isPlaying = true
        console.log('ElevenLabs: Audio started playing with analyser:', !!this._audioAnalyser)
      }

      this.currentAudio.onended = () => {
        this._isPlaying = false
        this.currentAudio = null
        URL.revokeObjectURL(audioUrl)
        resolve(undefined)
      }

      this.currentAudio.onerror = () => {
        this._isPlaying = false
        this.currentAudio = null
        URL.revokeObjectURL(audioUrl)
        reject(new Error('Audio playback failed'))
      }

      this.currentAudio.play().catch(reject)
    })
  }

  private async playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('ElevenLabs: Playing audio buffer directly')
        const source = this.audioContext!.createBufferSource()
        source.buffer = audioBuffer
        this.currentSource = source

        // Connect to analyser for lip sync
        if (this._audioAnalyser) {
          source.connect(this._audioAnalyser)
        }
        source.connect(this.audioContext!.destination)

        this._isPlaying = true

        source.onended = () => {
          console.log('ElevenLabs: Audio buffer playback ended')
          this._isPlaying = false
          this.currentSource = null
          resolve()
        }

        // Start playing immediately
        source.start(0)
        console.log('ElevenLabs: Audio buffer started playing')

      } catch (error) {
        console.error('ElevenLabs: Audio buffer playback failed:', error)
        this._isPlaying = false
        reject(error)
      }
    })
  }

  private async playAudioFromUrl(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl)

      this.currentAudio.onplay = () => {
        console.log('ElevenLabs: Audio started playing')
        this._isPlaying = true
      }

      this.currentAudio.onended = () => {
        console.log('ElevenLabs: Audio ended')
        this._isPlaying = false
        this.currentAudio = null
        resolve()
      }

      this.currentAudio.onerror = (error) => {
        console.error('ElevenLabs: Audio error:', error)
        this._isPlaying = false
        this.currentAudio = null
        reject(error)
      }

      // Play immediately - user gesture should be captured
      console.log('ElevenLabs: Starting immediate playback')
      this.currentAudio.play().then(() => {
        console.log('ElevenLabs: Play started successfully')
      }).catch((error) => {
        console.error('ElevenLabs: Play failed:', error)
        reject(error)
      })
    })
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (error) {
        // Source might already be stopped
      }
      this.currentSource = null
    }
    this._isPlaying = false
  }
}