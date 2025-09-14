import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing ElevenLabs integration...')

    // Check environment variables
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY

    console.log('🧪 Environment check:')
    console.log('🧪 - ELEVENLABS_API_KEY:', !!apiKey)

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ELEVENLABS_API_KEY not found',
        env: process.env
      })
    }

    // Test ElevenLabs API connection
    const voiceId = '4tRn1lSkEn13EVTuqb0g'
    console.log('🧪 Testing ElevenLabs API with voice:', voiceId)

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: 'Hello! This is a test of the ElevenLabs voice synthesis.',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    })

    console.log('🧪 ElevenLabs API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🧪 ElevenLabs API error:', errorText)

      return NextResponse.json({
        success: false,
        error: `ElevenLabs API error: ${response.status}`,
        details: errorText,
        voiceId,
        apiKeyExists: !!apiKey
      })
    }

    const audioBlob = await response.blob()
    console.log('🧪 ElevenLabs API success - audio blob size:', audioBlob.size)

    return NextResponse.json({
      success: true,
      message: 'ElevenLabs integration working!',
      voiceId,
      apiKeyExists: !!apiKey,
      audioBlobSize: audioBlob.size
    })

  } catch (error) {
    console.error('🧪 Test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}