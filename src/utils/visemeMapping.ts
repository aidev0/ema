// Ready Player Me Viseme Mapping for Realistic Lip Sync
export interface VisemeData {
  viseme: string
  duration: number
  intensity: number
}

// Map phonemes to Ready Player Me viseme morph targets
export const PHONEME_TO_VISEME: { [key: string]: string } = {
  // Vowels
  'AA': 'viseme_aa', 'AE': 'viseme_aa', 'AH': 'viseme_aa', 'AO': 'viseme_O', 
  'AW': 'viseme_aa', 'AY': 'viseme_aa', 'EH': 'viseme_E', 'ER': 'viseme_E', 
  'EY': 'viseme_E', 'IH': 'viseme_I', 'IY': 'viseme_I', 'OW': 'viseme_O', 
  'OY': 'viseme_O', 'UH': 'viseme_O', 'UW': 'viseme_U',

  // Consonants - Bilabials (lips together)
  'B': 'viseme_PP', 'P': 'viseme_PP', 'M': 'viseme_PP',

  // Labiodentals (lip to teeth)
  'F': 'viseme_FF', 'V': 'viseme_FF',

  // Dentals (tongue to teeth)
  'TH': 'viseme_TH', 'DH': 'viseme_TH',

  // Alveolars (tongue to gum ridge)
  'D': 'viseme_DD', 'T': 'viseme_DD', 'N': 'viseme_DD', 'L': 'viseme_DD', 'R': 'viseme_RR',

  // Post-alveolars
  'CH': 'viseme_CH', 'JH': 'viseme_CH', 'SH': 'viseme_CH', 'ZH': 'viseme_CH',

  // Velars
  'G': 'viseme_kk', 'K': 'viseme_kk', 'NG': 'viseme_kk',

  // Sibilants
  'S': 'viseme_SS', 'Z': 'viseme_SS',

  // Approximants
  'W': 'viseme_U', 'Y': 'viseme_I',

  // Silence
  'SIL': 'viseme_sil', '': 'viseme_sil'
}

// Simple text-to-phoneme mapping (basic implementation)
export const textToPhonemes = (text: string): string[] => {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
  const phonemes: string[] = []

  words.forEach((word, wordIndex) => {
    // Add silence between words
    if (wordIndex > 0) phonemes.push('SIL')

    // Simple letter-to-phoneme mapping
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toUpperCase()
      const nextChar = word[i + 1]?.toUpperCase()

      // Handle common digraphs
      if (char === 'T' && nextChar === 'H') {
        phonemes.push('TH')
        i++ // skip next character
      } else if (char === 'C' && nextChar === 'H') {
        phonemes.push('CH')
        i++
      } else if (char === 'S' && nextChar === 'H') {
        phonemes.push('SH')
        i++
      } else if (char === 'N' && nextChar === 'G') {
        phonemes.push('NG')
        i++
      } else {
        // Single character mapping
        switch (char) {
          case 'A': phonemes.push('AE'); break
          case 'E': phonemes.push('EH'); break
          case 'I': phonemes.push('IH'); break
          case 'O': phonemes.push('OW'); break
          case 'U': phonemes.push('UH'); break
          case 'Y': phonemes.push('IY'); break
          case 'B': phonemes.push('B'); break
          case 'C': phonemes.push('K'); break
          case 'D': phonemes.push('D'); break
          case 'F': phonemes.push('F'); break
          case 'G': phonemes.push('G'); break
          case 'H': phonemes.push(''); break // often silent
          case 'J': phonemes.push('JH'); break
          case 'K': phonemes.push('K'); break
          case 'L': phonemes.push('L'); break
          case 'M': phonemes.push('M'); break
          case 'N': phonemes.push('N'); break
          case 'P': phonemes.push('P'); break
          case 'Q': phonemes.push('K'); break
          case 'R': phonemes.push('R'); break
          case 'S': phonemes.push('S'); break
          case 'T': phonemes.push('T'); break
          case 'V': phonemes.push('V'); break
          case 'W': phonemes.push('W'); break
          case 'X': phonemes.push('K'); phonemes.push('S'); break
          case 'Z': phonemes.push('Z'); break
          default: phonemes.push('SIL')
        }
      }
    }
  })

  return phonemes
}

export const textToVisemes = (text: string): VisemeData[] => {
  const phonemes = textToPhonemes(text)
  const visemes: VisemeData[] = []

  phonemes.forEach(phoneme => {
    const viseme = PHONEME_TO_VISEME[phoneme] || 'viseme_sil'
    
    // Determine duration based on phoneme type
    let duration = 150 // default duration in ms
    if (phoneme === 'SIL' || phoneme === '') {
      duration = 100
    } else if (['AA', 'AE', 'AH', 'AO', 'EH', 'IH', 'OW', 'UH'].includes(phoneme)) {
      duration = 200 // vowels last longer
    } else {
      duration = 120 // consonants are shorter
    }

    // Determine intensity
    const intensity = phoneme === 'SIL' ? 0 : 0.8

    visemes.push({ viseme, duration, intensity })
  })

  return visemes
}

// Advanced: Convert audio buffer to phoneme timing
export const analyzeAudioForPhonemes = (audioBuffer: AudioBuffer): VisemeData[] => {
  const sampleRate = audioBuffer.sampleRate
  const channelData = audioBuffer.getChannelData(0)
  const frameSize = Math.floor(sampleRate * 0.025) // 25ms frames
  const hopSize = Math.floor(sampleRate * 0.010) // 10ms hop
  
  const visemes: VisemeData[] = []
  
  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    const frame = channelData.slice(i, i + frameSize)
    
    // Calculate energy
    const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length
    
    // Simple energy-based viseme detection
    if (energy < 0.001) {
      visemes.push({ viseme: 'viseme_sil', duration: 10, intensity: 0 })
    } else if (energy > 0.01) {
      // High energy - likely a vowel or voiced consonant
      visemes.push({ viseme: 'viseme_aa', duration: 10, intensity: Math.min(energy * 50, 1) })
    } else {
      // Medium energy - likely a consonant
      visemes.push({ viseme: 'viseme_DD', duration: 10, intensity: Math.min(energy * 30, 0.8) })
    }
  }
  
  return visemes
}