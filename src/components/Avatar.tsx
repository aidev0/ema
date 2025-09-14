'use client'

import { useRef, useEffect, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { GESTURES, IDLE_ANIMATIONS, analyzeTextForGestures, easingFunctions, deg2rad } from '@/utils/gestureSystem'

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-600 font-medium">Loading Avatar...</div>
        <div className="text-sm text-gray-500 mt-1">{progress.toFixed(1)}% complete</div>
      </div>
    </Html>
  )
}

interface AvatarModelProps {
  url: string
  isPlaying: boolean
  audioAnalyser?: AnalyserNode | null
  currentText?: string
}

function ResponsiveCamera() {
  const { camera, size } = useThree()

  useEffect(() => {

    // Camera positioned to look at head from front
    camera.position.set(0, 1.5, 3)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50
    }
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix()
    }
  }, [camera, size])

  return null
}

function ResponsiveGroundShadow() {
  const { size } = useThree()
  const aspect = size.width / size.height
  const yPosition = aspect > 1 ? -2.8 : -2.3

  return (
    <ContactShadows 
      position={[0, yPosition, 0]} 
      opacity={0.3} 
      width={8} 
      height={8} 
      blur={2} 
      far={20}
    />
  )
}

function ResponsiveOrbitControls() {
  const { size } = useThree()
  const aspect = size.width / size.height

  const minDistance = aspect > 1 ? 0.8 : 0.6
  const maxDistance = aspect > 1 ? 3 : 2

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI - Math.PI / 8}
      autoRotate={false}
      target={[0, 0.7, 0]}
    />
  )
}

// Preload the model to avoid state updates during render
useGLTF.preload('https://models.readyplayer.me/68c5f4f3c03601654511de22.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=none&lod=1')

function AvatarModel({ url, isPlaying, audioAnalyser, currentText }: AvatarModelProps) {
  const meshRef = useRef<THREE.Group>(null)
  const morphTargetsRef = useRef<THREE.SkinnedMesh[]>([])
  const bonesRef = useRef<{ [key: string]: THREE.Bone }>({})
  const gltf = useGLTF(url)

  // Gesture system state
  const [currentGesture, setCurrentGesture] = useState<string | null>(null)
  const [gestureStartTime, setGestureStartTime] = useState<number>(0)
  const [idleAnimations] = useState(() => [...IDLE_ANIMATIONS])
  const [currentIdleIndex, setCurrentIdleIndex] = useState(0)
  const [idleStartTime, setIdleStartTime] = useState<number>(0)


  useEffect(() => {
    if (gltf?.scene) {
      const meshes: THREE.SkinnedMesh[] = []
      const bones: { [key: string]: THREE.Bone } = {}
      
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
          meshes.push(child)
          
          // Get bones from the skinned mesh skeleton
          if (child.skeleton) {
            child.skeleton.bones.forEach(bone => {
              bones[bone.name] = bone
              // Map common bone name variations
              if (bone.name.includes('Arm')) bones['RightArm'] = bone
              if (bone.name.includes('arm')) bones['LeftArm'] = bone
              if (bone.name.includes('Hand')) bones['RightHand'] = bone
              if (bone.name.includes('hand')) bones['LeftHand'] = bone
              if (bone.name.includes('Spine')) bones['Spine'] = bone
              if (bone.name.includes('Head')) bones['Head'] = bone
              if (bone.name.includes('Hips')) bones['Hips'] = bone
            })
          }
        }
        if (child instanceof THREE.Bone) {
          bones[child.name] = child
        }
      })
      
      
      morphTargetsRef.current = meshes
      bonesRef.current = bones
      
      // Improve materials
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [gltf])

  // Trigger gestures based on text content
  useEffect(() => {
    if (isPlaying && currentText) {
      const detectedGestures = analyzeTextForGestures(currentText)
      if (detectedGestures.length > 0) {
        // Pick highest priority gesture
        const selectedGesture = detectedGestures.reduce((prev, current) => 
          GESTURES[current].priority > GESTURES[prev].priority ? current : prev
        )
        setCurrentGesture(selectedGesture)
        setGestureStartTime(Date.now())
      }
    } else {
      setCurrentGesture(null)
    }
  }, [isPlaying, currentText])

  useFrame(() => {
    const currentTime = Date.now()

    if (meshRef.current) {
      // Apply gestures when speaking
      if (isPlaying && currentGesture && bonesRef.current) {
        const gesture = GESTURES[currentGesture]
        const elapsedTime = currentTime - gestureStartTime
        
        gesture.keyframes.forEach((keyframe, index) => {
          const bone = bonesRef.current[keyframe.bone]
          if (!bone) return
          
          const keyframeStart = gesture.keyframes.slice(0, index).reduce((sum, kf) => sum + kf.duration, 0)
          const keyframeEnd = keyframeStart + keyframe.duration
          
          if (elapsedTime >= keyframeStart && elapsedTime <= keyframeEnd) {
            const progress = (elapsedTime - keyframeStart) / keyframe.duration
            const easedProgress = easingFunctions[keyframe.easing || 'linear'](progress)
            
            if (keyframe.rotation) {
              const targetRotation = new THREE.Euler(
                deg2rad(keyframe.rotation[0]),
                deg2rad(keyframe.rotation[1]),
                deg2rad(keyframe.rotation[2])
              )
              bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, targetRotation.x, easedProgress)
              bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, targetRotation.y, easedProgress)
              bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, targetRotation.z, easedProgress)
            }
            
            if (keyframe.position) {
              bone.position.x = THREE.MathUtils.lerp(bone.position.x, keyframe.position[0], easedProgress)
              bone.position.y = THREE.MathUtils.lerp(bone.position.y, keyframe.position[1], easedProgress)
              bone.position.z = THREE.MathUtils.lerp(bone.position.z, keyframe.position[2], easedProgress)
            }
          }
        })
      } 
      // Apply idle animations when not speaking
      else if (!isPlaying) {
        const idleAnimation = idleAnimations[currentIdleIndex]
        const elapsedTime = currentTime - idleStartTime
        
        // Check if we need to start a new idle animation cycle
        const totalIdleDuration = idleAnimation.keyframes.reduce((sum, kf) => sum + kf.duration, 0)
        if (elapsedTime > totalIdleDuration) {
          setCurrentIdleIndex((prev) => (prev + 1) % idleAnimations.length)
          setIdleStartTime(currentTime)
        }
        
        idleAnimation.keyframes.forEach((keyframe, index) => {
          const bone = bonesRef.current[keyframe.bone]
          if (!bone) return
          
          const keyframeStart = idleAnimation.keyframes.slice(0, index).reduce((sum, kf) => sum + kf.duration, 0)
          const keyframeEnd = keyframeStart + keyframe.duration
          
          if (elapsedTime >= keyframeStart && elapsedTime <= keyframeEnd) {
            const progress = (elapsedTime - keyframeStart) / keyframe.duration
            const easedProgress = easingFunctions[keyframe.easing || 'ease-in-out'](progress)
            
            if (keyframe.rotation) {
              const targetRotation = new THREE.Euler(
                deg2rad(keyframe.rotation[0]),
                deg2rad(keyframe.rotation[1]),
                deg2rad(keyframe.rotation[2])
              )
              bone.rotation.x = THREE.MathUtils.lerp(0, targetRotation.x, easedProgress)
              bone.rotation.y = THREE.MathUtils.lerp(0, targetRotation.y, easedProgress)
              bone.rotation.z = THREE.MathUtils.lerp(0, targetRotation.z, easedProgress)
            }
            
            if (keyframe.position) {
              bone.position.x = THREE.MathUtils.lerp(0, keyframe.position[0], easedProgress)
              bone.position.y = THREE.MathUtils.lerp(0, keyframe.position[1], easedProgress)
              bone.position.z = THREE.MathUtils.lerp(0, keyframe.position[2], easedProgress)
            }
          }
        })
      }
    }

    // Lip sync animation
    if (!isPlaying || !audioAnalyser || morphTargetsRef.current.length === 0) {
      // Reset mouth to neutral when not speaking
      morphTargetsRef.current.forEach((mesh) => {
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          const allMorphs = Object.keys(mesh.morphTargetDictionary)
          const mouthMorphs = allMorphs.filter(name =>
            name.toLowerCase().includes('mouth') ||
            name.toLowerCase().includes('jaw') ||
            name.toLowerCase().includes('viseme') ||
            name.toLowerCase().includes('aa') ||
            name.toLowerCase().includes('open')
          )

          mouthMorphs.forEach(morphName => {
            const morphIndex = mesh.morphTargetDictionary![morphName]
            if (morphIndex !== undefined && mesh.morphTargetInfluences) {
              // More aggressive reset to close mouth completely
              mesh.morphTargetInfluences[morphIndex] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[morphIndex] || 0,
                0,
                0.25 // Faster reset
              )
            }
          })
        }
      })
      return
    }

    console.log('Lip sync active - isPlaying:', isPlaying, 'analyser:', !!audioAnalyser, 'meshes:', morphTargetsRef.current.length)

    const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount)
    audioAnalyser.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedValue = Math.min(average / 120, 0.3) // Much more conservative values

    morphTargetsRef.current.forEach((mesh) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return

      // Find mouth-related morph targets but be more selective
      const allMorphs = Object.keys(mesh.morphTargetDictionary)
      const mouthMorphs = allMorphs.filter(name =>
        name.toLowerCase().includes('visemeaa') ||
        name.toLowerCase().includes('jawopen') ||
        name.toLowerCase().includes('mouthopen')
      )

      mouthMorphs.forEach(morphName => {
        const morphIndex = mesh.morphTargetDictionary![morphName]
        if (morphIndex !== undefined && mesh.morphTargetInfluences) {
          const currentValue = mesh.morphTargetInfluences[morphIndex] || 0
          const targetValue = normalizedValue * 0.4 // Much smaller multiplier
          mesh.morphTargetInfluences[morphIndex] = THREE.MathUtils.lerp(currentValue, targetValue, 0.15)
        }
      })
    })
  })

  // Standard Ready Player Me positioning for head/shoulders view
  const scale = 1.5
  const yPosition = -1.5 // Standard position

  if (!gltf?.scene) return null

  return (
    <group ref={meshRef}>
      <primitive object={gltf.scene} scale={scale} position={[0, yPosition, 0]} />
    </group>
  )
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    if (!text) {
      setDisplayText('')
      return
    }

    setDisplayText('')
    let i = 0
    const timer = setInterval(() => {
      setDisplayText((prev) => text.slice(0, i + 1))
      i++
      if (i >= text.length) {
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return displayText
}

interface AvatarProps {
  isPlaying: boolean
  audioAnalyser?: AnalyserNode | null
  currentText?: string
  avatarUrl?: string
}

export default function Avatar({ isPlaying, audioAnalyser, currentText, avatarUrl }: AvatarProps) {
  // Temporarily disable typewriter to test lip sync
  // const typewriterText = useTypewriter(currentText || '', 75)

  return (
    <div className="w-full h-full overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 0.7, 1.6], fov: 52 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Suspense fallback={<Loader />}>
          {/* Enhanced Lighting Setup */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <directionalLight position={[-3, 2, -5]} intensity={0.3} color="#4338ca" />
          <spotLight position={[0, 10, 0]} intensity={0.2} color="#fbbf24" />

          {/* Environment for realistic reflections */}
          <Environment preset="city" background={false} />

          {/* Avatar Model */}
          <AvatarModel
            url={avatarUrl || "https://models.readyplayer.me/68c5f4f3c03601654511de22.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=none&lod=1"}
            isPlaying={isPlaying}
            audioAnalyser={audioAnalyser}
            currentText={currentText}
          />

          {/* Responsive Ground shadow */}
          <ResponsiveGroundShadow />

          {/* Responsive Controls */}
          <ResponsiveOrbitControls />
        </Suspense>
      </Canvas>

      {/* Show white text only */}
      {currentText && (
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '90%',
            color: '#ffffff',
            fontSize: '32px',
            fontWeight: '400',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
            textAlign: 'center',
            lineHeight: '1.5',
            zIndex: 10,
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
          }}
        >
          {currentText}
        </div>
      )}
    </div>
  )
}