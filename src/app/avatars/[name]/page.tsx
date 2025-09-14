'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import { useEnhancedTTS } from '@/hooks/useEnhancedTTS'
import avatarsData from '@/data/avatars.json'
import { motion } from 'framer-motion'
import {
  FaMicrophone, FaMicrophoneSlash, FaArrowLeft,
  FaRobot
} from 'react-icons/fa'

export default function AvatarInteractionPage() {
  const params = useParams()
  const router = useRouter()
  const avatarName = params.name as string

  // Find the avatar data
  const avatar = avatarsData.avatars.find(
    a => a.name.toLowerCase() === avatarName.toLowerCase()
  )

  // State management
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentAIText, setCurrentAIText] = useState('')

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Enhanced TTS Hook with avatar-specific voice
  const { speak, stop, isPlaying, audioAnalyser, provider } = useEnhancedTTS(avatar?.name)


  const [greeting, setGreeting] = useState('')
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    // Initialize with greeting and speak immediately
    if (avatar && !hasSpokenRef.current) {
      hasSpokenRef.current = true
      const greetingText = avatar.greeting_message || `Hello! I'm ${avatar.name}. How can I assist you today?`
      setCurrentAIText(greetingText)
      setGreeting(greetingText)

      // Speak immediately when avatar loads
      const speakGreeting = async () => {
        try {
          await speak(greetingText)
        } catch (error) {
          console.error('Auto-speak failed:', error)
        }
      }

      speakGreeting()
    }
  }, [avatar])


  // Start recording
  const startRecording = async () => {
    try {
      // Don't stop current speech when starting recording
      // stop() // Remove this line

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudioWithWhisper(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  // Process audio with Whisper
  const processAudioWithWhisper = async (audioBlob: Blob) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        await handleUserMessage(data.transcript)
      } else {
        console.error('Transcription failed:', data.error)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle user message with Vapi streaming
  const handleUserMessage = async (text: string) => {
    if (!text.trim() || !avatar) return

    // Stop current speech only when processing new user input
    stop()
    setIsProcessing(true)

    try {
      // Display user message immediately
      setCurrentAIText("Processing your request...")

      console.log('handleUserMessage: Processing user input:', text)
      console.log('handleUserMessage: Using provider:', provider)

      // Check if we're using Vapi provider for conversation
      if (provider.includes('vapi')) {
        console.log('Using Vapi for conversation processing')
        try {
          // For Vapi, we pass the user input to be processed and responded to
          await speak(text)
          setCurrentAIText("Listening to Vapi response...")
        } catch (vapiError) {
          console.error('Vapi conversation failed:', vapiError)
          await handleFallbackChat(text)
        }
      } else {
        console.log('Using fallback chat for non-Vapi provider:', provider)
        await handleFallbackChat(text)
      }

    } catch (error) {
      console.error('Error processing message:', error)
      const errorResponse = "I apologize, but I'm having trouble responding right now."
      setCurrentAIText(errorResponse)
      speak(errorResponse)
    } finally {
      setIsProcessing(false)
    }
  }

  // Fallback chat function
  const handleFallbackChat = async (text: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          avatarId: avatar!._id,
          model: avatar!.llm_model === 'claude4' ? 'claude4' : 'gpt5'
        })
      })

      const data = await response.json()

      if (data.response) {
        setCurrentAIText(data.response)
        speak(data.response)
      }
    } catch (error) {
      console.error('Error with fallback chat:', error)
      const errorResponse = "I apologize, but I'm having trouble responding right now."
      setCurrentAIText(errorResponse)
      speak(errorResponse)
    }
  }

  if (!avatar) {
    return <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-white">Avatar not found</div>
    </div>
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Avatar Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, 0.2)',
          y: -2
        }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/avatars')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '0.5px'
        }}
      >
        <FaArrowLeft size={16} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
        <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Avatars</span>
      </motion.button>

      {/* Avatar - Full Screen */}
      <div className="h-full w-full">
        <Avatar
          isPlaying={isPlaying}
          audioAnalyser={audioAnalyser}
          currentText={currentAIText}
        />
      </div>


      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4">
          {/* Recording Button */}
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-4 rounded-full transition-all duration-200 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20'
            }`}
          >
            {isRecording ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
          </motion.button>

          {/* Avatar Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20"
          >
            <div className="flex items-center space-x-3">
              <FaRobot className="text-cyan-400" />
              <div>
                <h3 className="text-white font-semibold">{avatar.name}</h3>
                <p className="text-gray-400 text-sm">{isProcessing ? 'Thinking...' : isPlaying ? 'Speaking...' : 'Listening'}</p>
                <p className="text-gray-500 text-xs">Voice: {provider}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}