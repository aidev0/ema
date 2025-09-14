import { NextRequest, NextResponse } from 'next/server'

interface VapiCallRequest {
  phoneNumber: string
  message: string
  avatarName: string
}

interface VapiAssistantRequest {
  message: string
  avatarName: string
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json()

    if (!process.env.VAPI_API_KEY) {
      return NextResponse.json(
        { error: 'Vapi API key not configured' },
        { status: 500 }
      )
    }

    const vapiHeaders = {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    }

    if (action === 'call') {
      // Make a phone call
      const { phoneNumber, message, avatarName }: VapiCallRequest = data

      const callPayload = {
        phoneNumberId: phoneNumber,
        assistantId: 'your-assistant-id', // This would be configured per avatar
        metadata: {
          avatar: avatarName,
          message: message
        }
      }

      const response = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: vapiHeaders,
        body: JSON.stringify(callPayload)
      })

      const result = await response.json()
      
      return NextResponse.json({
        success: true,
        callId: result.id,
        status: result.status
      })

    } else if (action === 'assistant') {
      // Create assistant response
      const { message, avatarName }: VapiAssistantRequest = data

      // For demo purposes, simulate Vapi assistant response
      const assistantResponse = {
        message: `Hello! This is ${avatarName} speaking through Vapi. I received your message: "${message}". How can I assist you further?`,
        audioUrl: null, // In production, this would be the generated audio URL
        transcript: message
      }

      return NextResponse.json({
        success: true,
        response: assistantResponse
      })

    } else if (action === 'schedule') {
      // Schedule appointment with Jake
      const appointmentData = {
        contact: 'Jake',
        requestedBy: 'Avatar Demo User',
        message: data.message,
        timestamp: new Date().toISOString()
      }

      // In production, this would integrate with a calendar system
      console.log('Appointment request:', appointmentData)

      return NextResponse.json({
        success: true,
        appointment: {
          id: `apt_${Date.now()}`,
          status: 'scheduled',
          contact: 'Jake',
          scheduledTime: 'Tomorrow at 2:00 PM',
          message: 'Appointment scheduled successfully! Jake will be contacted.'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Vapi API error:', error)
    return NextResponse.json(
      { 
        error: 'Vapi integration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}