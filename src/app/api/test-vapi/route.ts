import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Vapi integration...')

    // Check environment variables
    const privateKey = process.env.VAPI_PRIVATE_API_KEY
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

    console.log('🧪 Environment check:')
    console.log('🧪 - VAPI_PRIVATE_API_KEY:', !!privateKey)
    console.log('🧪 - NEXT_PUBLIC_VAPI_PUBLIC_KEY:', !!publicKey)

    if (!privateKey) {
      return NextResponse.json({
        success: false,
        error: 'VAPI_PRIVATE_API_KEY not found',
        env: process.env
      })
    }

    // Test Vapi API connection
    const assistantId = 'bf681b7a-4868-404e-9cc0-ec8aebdbda93'
    console.log('🧪 Testing Vapi API with assistant:', assistantId)

    const response = await fetch('https://api.vapi.ai/call/web', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId,
        metadata: {
          userMessage: 'Test message',
          source: 'integration-test'
        }
      })
    })

    console.log('🧪 Vapi API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🧪 Vapi API error:', errorText)

      return NextResponse.json({
        success: false,
        error: `Vapi API error: ${response.status}`,
        details: errorText,
        assistantId,
        privateKeyExists: !!privateKey,
        publicKeyExists: !!publicKey
      })
    }

    const data = await response.json()
    console.log('🧪 Vapi API success:', data)

    return NextResponse.json({
      success: true,
      message: 'Vapi integration working!',
      assistantId,
      privateKeyExists: !!privateKey,
      publicKeyExists: !!publicKey,
      vapiResponse: data
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