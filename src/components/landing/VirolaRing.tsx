import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface VirolaRingProps {
  reducedMotion: boolean
  isMobile: boolean
}

export function VirolaRing({ reducedMotion, isMobile }: VirolaRingProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Inclinación inicial física elegante: ~14 grados para apreciar espesor, volumen y cara frontal
  const initialTiltX = 0.26
  const initialTiltY = -0.16
  const initialTiltZ = 0.06

  const targetRotation = useRef({ x: initialTiltX, y: initialTiltY })
  const currentRotation = useRef({ x: initialTiltX, y: initialTiltY })
  const introProgress = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })

  // Seguimiento suave del mouse
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // Soporte táctil para mobile (drag suave)
  useEffect(() => {
    let lastTouchX = 0
    let lastTouchY = 0

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        lastTouchX = touch.clientX
        lastTouchY = touch.clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        const deltaX = (touch.clientX - lastTouchX) / window.innerWidth
        const deltaY = (touch.clientY - lastTouchY) / window.innerHeight
        mouseRef.current.x = Math.max(-1, Math.min(1, mouseRef.current.x + deltaX * 2.0))
        mouseRef.current.y = Math.max(-1, Math.min(1, mouseRef.current.y + deltaY * 2.0))
        lastTouchX = touch.clientX
        lastTouchY = touch.clientY
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // Desktop: offset right so text occupies left. Mobile: centered, large.
  const targetScale = isMobile ? 0.82 : 0.78
  const position: [number, number, number] = isMobile ? [0, 0, 0] : [1.35, -0.05, 0]

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // 1. Animación de entrada suave
    if (introProgress.current < 1) {
      introProgress.current = Math.min(1, introProgress.current + delta * 0.75)
      const eased = 1 - Math.pow(1 - introProgress.current, 4)
      meshRef.current.scale.setScalar(eased * targetScale)
    } else {
      meshRef.current.scale.setScalar(targetScale)
    }

    if (reducedMotion) {
      meshRef.current.rotation.x = initialTiltX
      meshRef.current.rotation.y = initialTiltY + delta * 0.06
      meshRef.current.rotation.z = initialTiltZ
      return
    }

    // 2. Respuesta suave al cursor con rango acotado
    targetRotation.current.y = initialTiltY + mouseRef.current.x * 0.40
    targetRotation.current.x = initialTiltX + mouseRef.current.y * 0.18

    // Damping físico
    const dampFactor = Math.min(0.12, 2.6 * delta)
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * dampFactor
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * dampFactor

    // Rotación 3D lenta y continua ambiental ("vida")
    const autoRotate = state.clock.elapsedTime * 0.05

    meshRef.current.rotation.x = currentRotation.current.x
    meshRef.current.rotation.y = currentRotation.current.y + autoRotate
    meshRef.current.rotation.z = initialTiltZ
  })

  // Geometría original precisa de virola
  const radialSegs = isMobile ? 36 : 64
  const tubularSegs = isMobile ? 72 : 128

  return (
    <mesh ref={meshRef} scale={0} position={position}>
      {/* Geometría original: corona metálica amplia con espesor y curvatura */}
      <torusGeometry args={[1.2, 0.25, radialSegs, tubularSegs]} />
      {/* Acabado metálico original de alta calidad: alpaca / plata satinada pulida pura */}
      <meshStandardMaterial
        color="#d8d4cb"
        metalness={1.0}
        roughness={0.18}
        envMapIntensity={1.5}
      />
    </mesh>
  )
}
