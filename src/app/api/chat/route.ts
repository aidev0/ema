import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import avatarsData from '@/data/avatars.json'

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  avatarId: string
  model?: 'gpt5' | 'claude4'
}

export async function POST(request: NextRequest) {
  try {
    const { messages, avatarId, model = 'claude4' }: ChatRequest = await request.json()

    // Find avatar configuration
    const avatar = avatarsData.avatars.find(a => a._id === avatarId || a.name.toLowerCase() === avatarId.toLowerCase())
    
    if (!avatar) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      )
    }

    // Prepare system message with avatar personality and context
    const systemMessage = {
      role: 'system' as const,
      content: `${avatar.system}

Personality: ${avatar.personality}

Available Tools: ${avatar.tools.join(', ')}
Available MCPs: ${avatar.mcps.join(', ')}
Voice Agent: ${avatar.voice_agent}

You are representing ${avatar.name} in an enterprise demo environment. Stay in character and be helpful while showcasing the capabilities of ${avatar.name}.

${avatar.name === 'Vapi' ? 'You can schedule appointments and make phone calls. When users ask about appointments, offer to schedule with Jake or make calls on their behalf.' : ''}
${avatar.name === 'WorkOS' ? 'Focus on enterprise authentication, SSO, and security. Help users understand how to implement secure authentication systems.' : ''}
${avatar.name === 'Convex' ? 'Emphasize real-time data synchronization and reactive systems. Show enthusiasm for developer experience.' : ''}
`
    }

    let response: string

    if (model === 'claude4') {
      // Use Claude
      const claudeMessages = [systemMessage, ...messages].map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Claude doesn't support system role in the same way
        content: msg.role === 'system' ? `SYSTEM: ${msg.content}` : msg.content
      }))

      const claudeResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: claudeMessages.slice(1) as Array<{ role: 'user' | 'assistant'; content: string }>,
        system: systemMessage.content
      })

      response = claudeResponse.content[0]?.type === 'text' 
        ? claudeResponse.content[0].text 
        : 'I apologize, but I had trouble generating a response.'

    } else {
      // Use OpenAI GPT-5 (when available, using GPT-4 for now)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview', // Will update to gpt-5 when available
        messages: [systemMessage, ...messages],
        max_tokens: 1000,
        temperature: 0.7,
      })

      response = completion.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response.'
    }

    // Special handling for specific avatars
    if (avatar.name === 'Vapi' && messages[messages.length - 1]?.content.toLowerCase().includes('appointment')) {
      response += "\n\nWould you like me to initiate a voice call to confirm this appointment? I can use my Vapi voice capabilities to make the call now."
    }

    return NextResponse.json({
      response,
      avatar: avatar.name,
      model: model,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}