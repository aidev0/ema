'use client'

import { useState, useEffect } from 'react'

interface DebugPanelProps {
  isPlaying: boolean
  audioAnalyser?: AnalyserNode
}

export default function DebugPanel({ isPlaying, audioAnalyser }: DebugPanelProps) {
  const [showDebug, setShowDebug] = useState(false)
  const [audioData, setAudioData] = useState<number[]>([])
  const [detectedViseme, setDetectedViseme] = useState('viseme_sil')

  useEffect(() => {
    if (!audioAnalyser || !isPlaying) {
      setAudioData([])
      setDetectedViseme('viseme_sil')
      return
    }

    const updateAudioData = () => {
      const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount)
      audioAnalyser.getByteFrequencyData(dataArray)
      
      // Analyze frequency bands
      const lowFreq = dataArray.slice(0, 32).reduce((a, b) => a + b) / 32
      const midFreq = dataArray.slice(32, 96).reduce((a, b) => a + b) / 64
      const highFreq = dataArray.slice(96, 128).reduce((a, b) => a + b) / 32
      
      const totalEnergy = (lowFreq + midFreq + highFreq) / 3
      const normalizedEnergy = Math.min(totalEnergy / 80, 1)
      
      // Determine viseme (same logic as Avatar component)
      let primaryViseme = 'viseme_sil'
      
      if (normalizedEnergy > 0.1) {
        if (lowFreq > midFreq && lowFreq > highFreq) {
          primaryViseme = lowFreq > 60 ? 'viseme_aa' : 'viseme_O'
        } else if (midFreq > lowFreq && midFreq > highFreq) {
          primaryViseme = 'viseme_E'
        } else if (highFreq > lowFreq && highFreq > midFreq) {
          primaryViseme = highFreq > 40 ? 'viseme_SS' : 'viseme_FF'
        } else {
          primaryViseme = 'viseme_DD'
        }
      }
      
      setDetectedViseme(primaryViseme)
      setAudioData([lowFreq, midFreq, highFreq, totalEnergy])
      
      if (isPlaying) {
        requestAnimationFrame(updateAudioData)
      }
    }

    updateAudioData()
  }, [audioAnalyser, isPlaying])

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-20 right-4 bg-white/10 text-white/60 px-3 py-2 rounded-lg text-xs hover:bg-white/20 transition-colors"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 bg-black/80 text-white p-4 rounded-xl backdrop-blur-sm border border-white/20 w-64">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Lip Sync Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-white/60 hover:text-white/90"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Current Viseme */}
        <div>
          <div className="text-white/60 mb-1">Detected Viseme:</div>
          <div className={`font-mono px-2 py-1 rounded text-center ${
            detectedViseme === 'viseme_sil' ? 'bg-gray-500/30' : 'bg-green-500/30'
          }`}>
            {detectedViseme.replace('viseme_', '')}
          </div>
        </div>

        {/* Audio Analysis */}
        <div>
          <div className="text-white/60 mb-1">Audio Analysis:</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Low (0-2kHz):</span>
              <span className="font-mono">{audioData[0]?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Mid (2-6kHz):</span>
              <span className="font-mono">{audioData[1]?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span>High (6-8kHz):</span>
              <span className="font-mono">{audioData[2]?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-white/20 pt-1">
              <span>Total Energy:</span>
              <span className="font-mono">{audioData[3]?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </div>

        {/* Frequency Bars */}
        <div>
          <div className="text-white/60 mb-1">Frequency Visualization:</div>
          <div className="space-y-1">
            {['Low', 'Mid', 'High'].map((band, index) => (
              <div key={band} className="flex items-center space-x-2">
                <div className="w-8 text-xs">{band}:</div>
                <div className="flex-1 bg-white/10 rounded h-2">
                  <div 
                    className={`h-full rounded transition-all duration-100 ${
                      index === 0 ? 'bg-blue-400' :
                      index === 1 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min((audioData[index] || 0) / 100 * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="text-center pt-2 border-t border-white/20">
          <div className={`text-xs font-medium ${
            isPlaying ? 'text-green-400' : 'text-white/60'
          }`}>
            {isPlaying ? '🎤 Analyzing Audio' : '⏸️ Audio Stopped'}
          </div>
        </div>
      </div>
    </div>
  )
}