import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { VirolaRing } from './VirolaRing'
import { useIsMobile } from './useIsMobile'

function StudioLighting({ isMobile }: { isMobile: boolean }) {
  const greenRimRef = useRef<THREE.PointLight>(null)
  const specularSweepRef = useRef<THREE.PointLight>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || isMobile) return
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [isMobile])

  useFrame((state, delta) => {
    const cx = isMobile ? 0 : 1.35
    const sweepTime = state.clock.elapsedTime * 0.32

    // 1. Reflejo de estudio físico: una fuente de luz suave recorre lentamente el metal
    // resaltando la curvatura 3D, espesor y brillo satinado de la alpaca
    if (specularSweepRef.current) {
      specularSweepRef.current.position.x = cx + Math.cos(sweepTime) * 2.6
      specularSweepRef.current.position.y = 2.8 + Math.sin(sweepTime * 0.75) * 0.7
      specularSweepRef.current.position.z = 2.2 + Math.sin(sweepTime) * 0.5
      specularSweepRef.current.intensity = 0.48 + Math.sin(sweepTime * 1.4) * 0.10
    }

    // 2. Reflejo de borde verde sutil (identidad MATESHOP) recorre la parte opuesta
    if (greenRimRef.current) {
      const greenPhase = sweepTime + Math.PI * 0.85
      const baseIntensity = 0.32 + Math.sin(greenPhase * 1.2) * 0.08
      const mouseBias = !isMobile ? Math.max(0, -mouseRef.current.x * 0.15) : 0
      const damp = Math.min(0.1, 2.5 * delta)

      greenRimRef.current.intensity += (baseIntensity + mouseBias - greenRimRef.current.intensity) * damp
      greenRimRef.current.position.x = cx + Math.cos(greenPhase) * 2.0 + (!isMobile ? mouseRef.current.x * 0.25 : 0)
      greenRimRef.current.position.y = 0.8 + Math.sin(greenPhase * 0.6) * 0.4
    }
  })

  // Desktop: virola offset to right (1.35) → lights follow. Mobile: centered (0).
  const cx = isMobile ? 0 : 1.35

  return (
    <>
      {/* Minimal ambient — black background means we want deep contrast */}
      <ambientLight intensity={isMobile ? 0.16 : 0.12} color="#100c0a" />

      {/* Key light: warm white from top-right — main specular source */}
      <directionalLight position={[cx + 2.5, 4.5, 2.5]} intensity={1.40} color="#faf6ee" />

      {/* Cool rim from back-left — crisp metallic edge */}
      <pointLight position={[cx - 3.0, 1.2, -2.5]} intensity={0.88} color="#dde0e8" distance={10} />

      {/* Warm fill — organic bronze undertone */}
      <pointLight position={[cx - 2.5, -0.5, 2.0]} intensity={0.36} color="#c08850" distance={9} />

      {/* Physical Studio Specular Sweep: luz suave móvil que recorre la curvatura */}
      <pointLight
        ref={specularSweepRef}
        position={[cx + 1.5, 3.0, 2.0]}
        intensity={0.48}
        color="#f8f6f0"
        distance={8}
      />

      {/* Signature green rim — MATESHOP brand accent on metal */}
      <pointLight
        ref={greenRimRef}
        position={[cx - 1.0, 0.7, 1.6]}
        intensity={0.34}
        color="#758A4F"
        distance={7}
      />

      {/* Underside soft fill */}
      <pointLight position={[cx, -2.2, 1.0]} intensity={0.14} color="#758A4F" distance={5} />

      {/* Top specular ping */}
      <pointLight position={[cx, 5.0, 0.5]} intensity={0.38} color="#f0ece2" />
    </>
  )
}

export function VirolaScene() {
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // Reactive detection: updates instantly on mobile devices, devtools responsive mode, or window resize
  const isMobile = useIsMobile(768)

  return (
    <Canvas
      key={isMobile ? 'mobile' : 'desktop'}
      /*
        - Mobile: camera at distance 4.2 with fov 42 — perfectly proportions the virola,
                  keeping it prominent (~38%-42% screen width) and never clipped.
        - Desktop: distance 5.0 with fov 38 — exact original luxury studio shot.
      */
      camera={{ position: [0, 0, isMobile ? 4.2 : 5], fov: isMobile ? 42 : 38 }}
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
