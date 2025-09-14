# 🎮 Enterprise AI Avatar Demo

## Enterprise MCP Hackathon 2024

A gaming-style enterprise AI companion application featuring personalized 3D avatars with advanced AI capabilities, voice interaction, and MCP integrations.

![Demo](https://img.shields.io/badge/Demo-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black)

## 🚀 Features

- **🎮 Gaming Experience**: Immersive gaming-style interface for enterprise operations
- **👥 AI Companions**: Personalized 3D avatar AI companions for each sponsor company
- **🔐 Enterprise Security**: Single Sign-On with WorkOS integration
- **🎙️ Voice Interaction**: Real-time voice recording with OpenAI Whisper transcription
- **🗣️ Text-to-Speech**: High-quality voice synthesis with lip-sync animation
- **🤖 Advanced AI**: Integration with Claude Sonnet 4 and GPT-5 models
- **📞 Voice Calls**: Vapi integration for real-time voice streaming and phone calls
- **🔧 1000+ MCPs**: Model Context Protocol server integrations
- **📊 Real-time Data**: Convex real-time database synchronization
- **🎯 Interactive Gestures**: Dynamic avatar animations and gestures

## 🏢 Sponsor Avatars

Each avatar represents a hackathon sponsor with unique personalities and capabilities:

| Avatar | Company | Specialization | Features |
|--------|---------|---------------|----------|
| **GoogleLab** | Google Labs | AI Research & Cloud | Vertex AI, Gemini, TensorFlow |
| **Convex** | Convex | Real-time Backend | Reactive DB, Serverless |
| **WorkOS** | WorkOS | Enterprise Auth | SSO, SAML, OAuth |
| **Smithery** | Smithery | MCP Deployment | Server Management |
| **Vapi** | Vapi | Voice AI | Phone Calls, Voice Synthesis |
| **LiquidMetal** | LiquidMetal | Edge Computing | WebAssembly, Adaptive Infrastructure |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.3, React 18, TypeScript
- **3D Graphics**: Three.js, React Three Fiber, Ready Player Me
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **AI Integration**: 
  - OpenAI GPT-5 & Whisper
  - Anthropic Claude Sonnet 4
  - Vapi Voice AI
  - ElevenLabs TTS
- **Authentication**: WorkOS SSO
- **Real-time**: Convex Database
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for required services

### 1. Clone & Install

```bash
git clone <your-repo>
cd readyplayer-avatar
npm install
```

### 2. Environment Setup

Copy `.env.local` and fill in your API keys:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# WorkOS Authentication
WORKOS_API_KEY=your_workos_api_key_here
WORKOS_CLIENT_ID=your_workos_client_id_here

# Vapi Voice AI
VAPI_API_KEY=your_vapi_api_key_here
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here

# ElevenLabs TTS
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

## 🎮 How to Use

### 1. Landing Page
- **Gaming-style pitch** with animated avatars
- **Cycling avatar showcase** with zoom effects
- **WorkOS authentication** prompt after 20 seconds

### 2. Avatar Selection
- Choose from 6 sponsor company avatars
- Each avatar has unique personality and capabilities
- Enterprise-grade features displayed

### 3. Avatar Interaction
- **Text Chat**: Type messages for AI responses
- **Voice Recording**: Click microphone to record audio
- **Video Camera**: Enable video feed overlay
- **Special Actions**: 
  - Vapi: Schedule appointments, make calls
  - WorkOS: SSO setup assistance
  - Convex: Database design help

## 🏗️ Architecture

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── chat/          # LLM Integration
│   │   │   ├── whisper/       # Voice Transcription
│   │   │   └── vapi/          # Voice AI Integration
│   │   ├── avatars/           # Avatar Pages
│   │   └── page.tsx           # Landing Page
│   ├── components/            # React Components
│   │   ├── Avatar.tsx         # 3D Avatar Component
│   │   └── UI Components
│   ├── data/                  # Configuration
│   │   └── avatars.json       # Avatar Definitions
│   ├── hooks/                 # Custom Hooks
│   └── utils/                 # Utilities
```

## 🔧 API Endpoints

- `POST /api/chat` - LLM conversation with avatars
- `POST /api/whisper` - Audio transcription
- `POST /api/vapi` - Voice AI operations

## 🎯 Demo Features

### Voice Interaction
```typescript
// Record audio and transcribe
const processAudioWithWhisper = async (audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.wav')
  
  const response = await fetch('/api/whisper', {
    method: 'POST',
    body: formData
  })
  
  const data = await response.json()
  return data.transcript
}
```

### AI Chat Integration
```typescript
// Send message to avatar AI
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: conversationHistory,
    avatarId: avatar._id,
    model: 'claude4' // or 'gpt5'
  })
})
```

## 🎨 Customization

### Adding New Avatars
1. Update `src/data/avatars.json`
2. Add avatar-specific logic in API routes
3. Configure personality and tools

### Avatar Configuration
```json
{
  "_id": "new-avatar-001",
  "name": "YourCompany",
  "avatar_model": "ready-player-me-url",
  "personality": "Professional and helpful...",
  "system": "You are an AI assistant for...",
  "tools": ["tool1", "tool2"],
  "mcps": ["mcp1", "mcp2"],
  "voice_agent": "vapi",
  "llm_model": "claude4"
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Environment Variables
Set all API keys in your deployment platform's environment variables.

## 📱 Mobile Support

The app is responsive and works on mobile devices with touch-friendly interfaces.

## 🔒 Security

- All API keys stored in environment variables
- WorkOS enterprise authentication
- Secure API endpoints with validation
- No client-side key exposure

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

**Enterprise MCP Hackathon 2024**
- **Demo Video**: [Link to demo video]
- **Live Demo**: [Deployment URL]
- **Judging Criteria**: 
  - ✅ Impact Potential (25%)
  - ✅ Technical Implementation (50%)
  - ✅ Creativity (15%)
  - ✅ Presentation (10%)

## 📞 Support

For questions or support, please open an issue or contact the development team.

---

**Built with ❤️ for Enterprise MCP Hackathon 2024**

*Showcasing the future of enterprise AI interactions through immersive avatar experiences*
