'use client'

import { VoiceProvider, VoiceConfig } from './types'
import { ElevenLabsVoiceProvider } from './ElevenLabsVoiceProvider'
import { WebSpeechVoiceProvider } from './WebSpeechVoiceProvider'

export class VoiceServiceFactory {
  private static providers: Map<string, VoiceProvider> = new Map()

  static createVoiceProvider(config: VoiceConfig): VoiceProvider {
    const key = `${config.provider}-${config.voiceId || config.assistantId || 'default'}`

    // Return cached provider if exists
    if (this.providers.has(key)) {
      return this.providers.get(key)!
    }

    let provider: VoiceProvider

    switch (config.provider) {
      case 'elevenlabs':
        provider = new ElevenLabsVoiceProvider(
          config.voiceId,
          config.apiKey,
          config.model
        )
        break

      case 'webspeech':
      default:
        provider = new WebSpeechVoiceProvider()
        break
    }

    // Cache the provider
    this.providers.set(key, provider)
    return provider
  }

  static getProviderForAvatar(avatarName: string): VoiceProvider {
    const config = this.getVoiceConfigForAvatar(avatarName)
    return this.createVoiceProvider(config)
  }

  static getVoiceConfigForAvatar(avatarName: string): VoiceConfig {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

    const config = {
      provider: 'elevenlabs' as const,
      voiceId: '4tRn1lSkEn13EVTuqb0g',
      apiKey: apiKey,
      model: 'eleven_multilingual_v2'
    }

    return config
  }

  static async createProviderWithFallback(config: VoiceConfig): Promise<VoiceProvider> {
    try {
      const provider = this.createVoiceProvider(config)
      await this.testProvider(provider)
      return provider
    } catch (error) {
      return this.createVoiceProvider({ provider: 'webspeech' })
    }
  }

  private static async testProvider(provider: VoiceProvider): Promise<void> {
    if (provider.constructor.name === 'ElevenLabsVoiceProvider') {
      const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
      if (!apiKey) {
        throw new Error('ElevenLabs API key not available')
      }
    }
  }
}