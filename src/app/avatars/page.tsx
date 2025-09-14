'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import avatarsData from '@/data/avatars.json'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, ContactShadows, Clone, Html } from '@react-three/drei'
import * as THREE from 'three'

// Same model URL for all avatars
const AVATAR_MODEL_URL = 'https://models.readyplayer.me/68c5f4f3c03601654511de22.glb?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=none&lod=1'

// Preload the model
useGLTF.preload(AVATAR_MODEL_URL)

function AvatarModel({
  position,
  onClick,
  modelIndex,
  avatarData
}: {
  position: [number, number, number]
  onClick: () => void
  modelIndex: number
  avatarData: { name: string; [key: string]: any }
}) {
  const meshRef = useRef<THREE.Group>(null)
  const gltf = useGLTF(AVATAR_MODEL_URL)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Each avatar has slightly different idle animation
      const speed = 0.3 + (modelIndex * 0.1)
      const amplitude = 0.03 + (modelIndex * 0.01)

      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * speed) * 0.05
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed + position[0]) * amplitude

      if (hovered) {
        meshRef.current.rotation.y += 0.01
      }
    }
  })

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
      scale={hovered ? 1.1 : 1}
    >
      <Clone object={gltf.scene} scale={2} position={[0, -2, 0]} />

      {/* Floating company color orb above avatar */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial
          color={avatarData.company_color}
          transparent
          opacity={hovered ? 0.8 : 0.4}
        />
      </mesh>

      {/* Ground ring in company color when hovered */}
      {hovered && (
        <mesh position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.2, 32]} />
          <meshBasicMaterial
            color={avatarData.company_color}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Avatar name label */}
      <Html position={[0, -2.5, 0]} center>
        <div
          style={{
            color: '#f8fafc',
            fontSize: '18px',
            fontWeight: '300',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.9)',
            letterSpacing: '0.5px',
            opacity: hovered ? 1 : 0.85,
            transform: hovered ? 'translateY(-2px)' : 'translateY(0px)',
            transition: 'all 0.3s ease',
            userSelect: 'none'
          }}
        >
          {avatarData.name}
        </div>
      </Html>
    </group>
  )
}

export default function AvatarsPage() {
  const router = useRouter()

  const handleAvatarClick = (avatar: { name: string }) => {
    router.push(`/avatars/${avatar.name}`)
  }

  return (
    <div className="h-screen bg-black overflow-hidden cursor-pointer">
      <Canvas
        camera={{ position: [0, 2, 15], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={0.4} color="#4338ca" />
        <directionalLight position={[0, 8, -8]} intensity={0.3} color="#8b5cf6" />
        <spotLight position={[0, 15, 0]} intensity={0.5} color="#fbbf24" />

        <Environment preset="sunset" background={false} />

        {/* Enhanced ground shadows */}
        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.4}
          width={25}
          height={25}
          blur={1}
          far={25}
        />

        {/* All 6 avatars with same model */}
        {avatarsData.avatars.map((avatar, index) => (
          <AvatarModel
            key={avatar._id}
            position={[(index - 2.5) * 3, 0, Math.sin(index * 0.5) * 0.5]}
            onClick={() => handleAvatarClick(avatar)}
            modelIndex={index}
            avatarData={avatar}
          />
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={25}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI - Math.PI / 6}
          target={[0, 0, 0]}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}