import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { VirolaRing } from './VirolaRing'

function StudioLighting({ isMobile }: { isMobile: boolean }) {
  const greenRimRef = useRef<THREE.PointLight>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useMemo(() => {
    if (typeof window === 'undefined' || isMobile) return
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [isMobile])

  useFrame((_, delta) => {
    if (isMobile || !greenRimRef.current) return
    const damp = Math.min(0.1, 2.5 * delta)
    const targetIntensity = 0.32 + Math.max(0, -mouseRef.current.x * 0.18)
    greenRimRef.current.intensity += (targetIntensity - greenRimRef.current.intensity) * damp
    greenRimRef.current.position.x = 0.4 + mouseRef.current.x * 0.25
  })

  // Desktop: virola offset to right → lights follow. Mobile: centered.
  const cx = isMobile ? 0 : 1.35

  return (
    <>
      {/* Minimal ambient — black background means we want deep shadows */}
      <ambientLight intensity={isMobile ? 0.10 : 0.12} color="#100c0a" />

      {/* Key light: warm white from top-right — main specular source */}
      <directionalLight position={[cx + 2.5, 4.5, 2.5]} intensity={1.45} color="#faf6ee" />

      {/* Cool rim from back-left — crisp metallic edge */}
      <pointLight position={[cx - 3.0, 1.2, -2.5]} intensity={0.90} color="#dde0e8" distance={10} />

      {/* Warm fill — organic bronze undertone */}
      <pointLight position={[cx - 2.5, -0.5, 2.0]} intensity={0.38} color="#c08850" distance={9} />

      {/* Signature green rim — MATESHOP brand accent on metal */}
      <pointLight
        ref={greenRimRef}
        position={[cx - 1.0, 0.7, 1.6]}
        intensity={0.35}
        color="#758A4F"
        distance={7}
      />

      {/* Underside soft fill */}
      <pointLight position={[cx, -2.2, 1.0]} intensity={0.12} color="#758A4F" distance={5} />

      {/* Top specular ping */}
      <pointLight position={[cx, 5.0, 0.5]} intensity={0.40} color="#f0ece2" />
    </>
  )
}

export function VirolaScene() {
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768 || 'ontouchstart' in window
  }, [])

  return (
    <Canvas
      /*
        Mobile: closer camera + wider FOV so the virola fills the canvas.
        z=3.0, fov=58 → virola at scale 0.82 fills ~65% of view height.
        Desktop: z=5, fov=38 → original cinematic distance.
      */
      camera={{ position: [0, 0, isMobile ? 3.0 : 5], fov: isMobile ? 58 : 38 }}
      dpr={isMobile ? [1, 1.5] : [1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'transparent' }}
    >
      <StudioLighting isMobile={isMobile} />

      <Suspense fallback={null}>
        <VirolaRing reducedMotion={prefersReducedMotion} isMobile={isMobile} />
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  )
}
