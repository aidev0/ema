'use client'

import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'

export default function LandingPage() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/avatars/GoogleLab')
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black cursor-pointer" onClick={handleClick}>
      <Avatar
        isPlaying={false}
        audioAnalyser={null}
        currentText=""
      />
    </div>
  )
}