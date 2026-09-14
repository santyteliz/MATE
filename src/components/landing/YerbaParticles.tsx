import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Particle {
  orbitRadius: number
  orbitSpeed: number
  orbitPhase: number
  orbitTiltX: number
  height: number
  heightBob: number
  bobSpeed: number
  bobPhase: number
  scaleX: number
  scaleY: number
  rotSpeed: number
  rotPhase: number
  color: string
  opacity: number
  blur: boolean // foreground vs background depth
}

interface YerbaParticlesProps {
  count?: number
}

// Organic yerba leaf fragment colors — muted greens and browns
const YERBA_COLORS = [
  '#4a5a2e',
  '#5a6a38',
  '#3d4a24',
  '#62723e',
  '#4e5c30',
  '#758A4F',
  '#394529',
]

export function YerbaParticles({ count = 22 }: YerbaParticlesProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const isForeground = i < count * 0.45
      const isMidground = i < count * 0.75

      // Orbit radius: around the virola (radius 1.2 + tube 0.25 → outer ~1.45)
      const orbitRadius = isForeground
        ? 1.55 + Math.random() * 0.45   // close orbit
        : isMidground
        ? 1.85 + Math.random() * 0.55   // medium orbit
        : 2.1 + Math.random() * 0.7     // far orbit / background

      // Foreground particles: larger, more opaque
      const baseSize = isForeground
        ? 0.022 + Math.random() * 0.018
        : isMidground
        ? 0.014 + Math.random() * 0.012
        : 0.008 + Math.random() * 0.010

      const elongation = 1.8 + Math.random() * 2.4 // leaf-like aspect ratio

      return {
        orbitRadius,
        orbitSpeed: (isForeground ? 0.06 : 0.04) + Math.random() * 0.08,
        orbitPhase: (i / count) * Math.PI * 2 + Math.random() * 1.0,
        orbitTiltX: (Math.random() - 0.5) * 0.45, // tilt orbit plane like virola
        height: (Math.random() - 0.5) * 1.4,
        heightBob: 0.06 + Math.random() * 0.12,
        bobSpeed: 0.15 + Math.random() * 0.25,
        bobPhase: Math.random() * Math.PI * 2,
        scaleX: baseSize,
        scaleY: baseSize * elongation,
        rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.35),
        rotPhase: Math.random() * Math.PI * 2,
        color: YERBA_COLORS[Math.floor(Math.random() * YERBA_COLORS.length)],
        opacity: isForeground
          ? 0.42 + Math.random() * 0.28
          : isMidground
          ? 0.20 + Math.random() * 0.15
          : 0.08 + Math.random() * 0.10,
        blur: !isForeground,
      }
    })
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const p = particles[i]

      // Elliptical orbit — flattened on Z to match the virola's slight tilt
      const angle = p.orbitPhase + t * p.orbitSpeed
      mesh.position.x = Math.cos(angle) * p.orbitRadius
      mesh.position.z = Math.sin(angle) * p.orbitRadius * 0.28 // depth compression
      mesh.position.y = p.height + Math.sin(t * p.bobSpeed + p.bobPhase) * p.heightBob

      // Tumbling: Z rotation is primary (like a leaf falling/drifting)
      mesh.rotation.z = p.rotPhase + t * p.rotSpeed
      // X tilt oscillates slowly for organic feel
      mesh.rotation.x = Math.sin(t * 0.18 + p.bobPhase) * 0.6 + p.orbitTiltX
      // Y rotation: very slow tumble
      mesh.rotation.y = t * p.rotSpeed * 0.3
    })
  })

  return (
    <>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
          scale={[p.scaleX, p.scaleY, p.scaleX * 0.4]}
        >
          {/* Leaf-like elongated fragment */}
          <boxGeometry args={[1, 1, 0.6]} />
          <meshStandardMaterial
            color={p.color}
            roughness={0.88}
            metalness={0.02}
            transparent
            opacity={p.opacity}
          />
        </mesh>
      ))}
    </>
  )
}
