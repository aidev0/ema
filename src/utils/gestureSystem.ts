// Gesture and Animation System for Ready Player Me Avatar
export interface GestureKeyframe {
  bone: string
  rotation?: [number, number, number]
  position?: [number, number, number]
  duration: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

export interface Gesture {
  name: string
  keyframes: GestureKeyframe[]
  priority: number
  loop?: boolean
}

// Simplified gestures using common RPM bone names
export const GESTURES: { [key: string]: Gesture } = {
  // Simple head nod
  nodding: {
    name: 'nodding',
    priority: 2,
    keyframes: [
      { bone: 'Head', rotation: [10, 0, 0], duration: 400, easing: 'ease-out' },
      { bone: 'Head', rotation: [-5, 0, 0], duration: 300, easing: 'ease-in-out' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 500, easing: 'ease-in' }
    ]
  },

  // Head shake
  shaking: {
    name: 'shaking',
    priority: 3,
    keyframes: [
      { bone: 'Head', rotation: [0, 15, 0], duration: 300, easing: 'ease-out' },
      { bone: 'Head', rotation: [0, -15, 0], duration: 300, easing: 'ease-in-out' },
      { bone: 'Head', rotation: [0, 10, 0], duration: 250, easing: 'ease-in-out' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 400, easing: 'ease-in' }
    ]
  },

  // Simple pointing with head turn
  pointing: {
    name: 'pointing',
    priority: 3,
    keyframes: [
      { bone: 'Head', rotation: [0, 20, 0], duration: 500, easing: 'ease-out' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 800, easing: 'ease-in' }
    ]
  },

  // Thinking with head tilt
  thinking: {
    name: 'thinking',
    priority: 1,
    keyframes: [
      { bone: 'Head', rotation: [5, -10, 5], duration: 600, easing: 'ease-out' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 1000, easing: 'ease-in' }
    ]
  },

  // Welcoming with slight bow
  welcoming: {
    name: 'welcoming',
    priority: 2,
    keyframes: [
      { bone: 'Head', rotation: [15, 0, 0], duration: 600, easing: 'ease-out' },
      { bone: 'Spine', rotation: [10, 0, 0], duration: 600, easing: 'ease-out' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 800, easing: 'ease-in' },
      { bone: 'Spine', rotation: [0, 0, 0], duration: 800, easing: 'ease-in' }
    ]
  },

  // Emphasis with slight lean forward
  emphasizing: {
    name: 'emphasizing',
    priority: 4,
    keyframes: [
      { bone: 'Spine', rotation: [15, 0, 0], duration: 300, easing: 'ease-out' },
      { bone: 'Head', rotation: [5, 0, 0], duration: 300, easing: 'ease-out' },
      { bone: 'Spine', rotation: [0, 0, 0], duration: 600, easing: 'ease-in' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 600, easing: 'ease-in' }
    ]
  }
}

// Idle animations for when not speaking
export const IDLE_ANIMATIONS: Gesture[] = [
  {
    name: 'breath',
    priority: 0,
    loop: true,
    keyframes: [
      { bone: 'Spine', position: [0, 0.02, 0], duration: 3000, easing: 'ease-in-out' },
      { bone: 'Spine', position: [0, -0.01, 0], duration: 3000, easing: 'ease-in-out' },
      { bone: 'Spine', position: [0, 0, 0], duration: 2000, easing: 'ease-in-out' }
    ]
  },
  {
    name: 'subtle_sway',
    priority: 0,
    loop: true,
    keyframes: [
      { bone: 'Hips', rotation: [0, 2, 0], duration: 4000, easing: 'ease-in-out' },
      { bone: 'Hips', rotation: [0, -1, 0], duration: 4000, easing: 'ease-in-out' },
      { bone: 'Hips', rotation: [0, 0, 0], duration: 3000, easing: 'ease-in-out' }
    ]
  },
  {
    name: 'head_movement',
    priority: 0,
    loop: true,
    keyframes: [
      { bone: 'Head', rotation: [0, 5, 0], duration: 5000, easing: 'ease-in-out' },
      { bone: 'Head', rotation: [2, -3, 1], duration: 4000, easing: 'ease-in-out' },
      { bone: 'Head', rotation: [0, 0, 0], duration: 4000, easing: 'ease-in-out' }
    ]
  }
]

// Analyze text to determine appropriate gestures
export const analyzeTextForGestures = (text: string): string[] => {
  const words = text.toLowerCase()
  const gestures: string[] = []

  // Greeting words - map to nodding
  if (/hello|hi|welcome|greetings|good\s+(morning|afternoon|evening)/.test(words)) {
    gestures.push('nodding')
  }

  // Pointing/directional words
  if (/this|that|here|there|over\s+there|look|see|point/.test(words)) {
    gestures.push('pointing')
  }

  // Disagreement/negative words - map to shaking
  if (/no|not|never|disagree|wrong|incorrect|false/.test(words)) {
    gestures.push('shaking')
  }

  // Agreement/positive words - map to nodding
  if (/yes|agree|correct|right|absolutely|definitely|exactly/.test(words)) {
    gestures.push('nodding')
  }

  // Default to subtle nodding for any speech
  if (gestures.length === 0 && text.trim().length > 0) {
    gestures.push('nodding')
  }

  return gestures
}

// Convert degrees to radians
export const deg2rad = (degrees: number): number => degrees * (Math.PI / 180)

// Easing functions
export const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}