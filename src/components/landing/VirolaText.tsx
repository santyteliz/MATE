import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type * as THREE from 'three'

interface VirolaTextProps {
  text: string
}

export function VirolaText({ text }: VirolaTextProps) {
  const textRef = useRef<THREE.Mesh>(null)
  const opacityRef = useRef(0)
  const prevTextLength = useRef(0)
  const revealProgress = useRef(0)

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768 || 'ontouchstart' in window
  }, [])

  useFrame((_, delta) => {
    if (!textRef.current) return

    // Cinematic reveal when text changes
    if (text.length !== prevTextLength.current) {
      revealProgress.current = 0
      prevTextLength.current = text.length
    }

    if (revealProgress.current < 1) {
      revealProgress.current = Math.min(1, revealProgress.current + delta * 2.2)
      const eased = 1 - Math.pow(1 - revealProgress.current, 4)
      opacityRef.current = eased
    }

    const material = (textRef.current as any).material
    if (material) {
      material.opacity = opacityRef.current
    }
  })

  if (!text) return null

  // Dynamic font size scaled with the virola
  const fontSize = text.length > 12 ? 0.082 : text.length > 8 ? 0.10 : text.length > 5 ? 0.12 : 0.14

  // Position matching virola's center, scale and initial tilt
  const posX = isMobile ? 0 : 1.42
  const posY = isMobile ? -0.42 : -0.12
  const scale = isMobile ? 0.58 : 0.70
  const posZ = (1.45 * scale) + 0.03

  return (
    <Text
      ref={textRef}
      position={[posX, posY, posZ]}
      rotation={[0.24, -0.16, 0.08]}
      fontSize={fontSize}
      maxWidth={1.65}
      textAlign="center"
      font="https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4C_k3HqUt.woff2"
      letterSpacing={0.14}
      color="#F1F8F2"
      anchorX="center"
      anchorY="middle"
      material-transparent={true}
      material-opacity={0}
      material-depthWrite={false}
    >
      {text.toUpperCase()}
    </Text>
  )
}
