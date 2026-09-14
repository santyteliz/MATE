import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface VirolaRingProps {
  reducedMotion: boolean
  isMobile: boolean
}

export function VirolaRing({ reducedMotion, isMobile }: VirolaRingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const { viewport } = useThree()

  // Inclinación inicial física elegante: ~14 grados para apreciar espesor, curvatura y cara frontal
  const initialTiltX = 0.26
  const initialTiltY = -0.16
  const initialTiltZ = 0.06

  // Intro cinematográfica: demora inicial de 0.35s + duración de 1.3s para entrada con fade y profundidad
  const introDelay = 0.35
  const introDuration = 1.3
  const elapsedRef = useRef(0)
  const isIntroComplete = useRef(false)

  // Rotación e interacción
  const targetRotation = useRef({ x: initialTiltX, y: initialTiltY })
  const currentRotation = useRef({ x: initialTiltX, y: initialTiltY })
  const mouseRef = useRef({ x: 0, y: 0 })

  // Interacción táctil suave exclusiva para mobile
  const touchRotationRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const lastTouchRef = useRef({ x: 0, y: 0 })
  const parallaxOffsetRef = useRef({ x: 0, y: 0 })

  // Seguimiento suave del mouse (desktop)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // Gesto táctil sutil en mobile: no bloquea el scroll vertical (touch-action: pan-y)
  useEffect(() => {
    if (!isMobile) return

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        lastTouchRef.current.x = touch.clientX
        lastTouchRef.current.y = touch.clientY
        isTouchingRef.current = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch && isTouchingRef.current) {
        const deltaX = (touch.clientX - lastTouchRef.current.x) / window.innerWidth
        const deltaY = (touch.clientY - lastTouchRef.current.y) / window.innerHeight

        // Respuesta táctil horizontal y pequeña inclinación vertical
        touchRotationRef.current.y += deltaX * 1.6
        touchRotationRef.current.x = Math.max(-0.18, Math.min(0.18, touchRotationRef.current.x + deltaY * 0.45))

        // Parallax sutilísimo (micro-profundidad de unos pocos píxeles, nunca se desplaza de su centro)
        parallaxOffsetRef.current.x = Math.max(-0.03, Math.min(0.03, parallaxOffsetRef.current.x + deltaX * 0.08))

        lastTouchRef.current.x = touch.clientX
        lastTouchRef.current.y = touch.clientY
      }
    }

    const onTouchEnd = () => {
      isTouchingRef.current = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [isMobile])

  // - Desktop: conserva escala 0.78 y posición [1.35, -0.05, 0] intacta.
  // - Mobile: escala dinámica calculada para que ocupe ~38%-42% del ancho visual, centrado debajo del botón.
  const mobileScale = Math.min(0.55, Math.max(0.38, (viewport.width * 0.40) / 2.9))
  const targetScale = isMobile ? mobileScale : 0.78
  const basePosition: [number, number, number] = isMobile ? [0, 0.04, 0] : [1.35, -0.05, 0]

  useFrame((state, delta) => {
    if (!meshRef.current) return

    elapsedRef.current += delta

    // 1. Entrada cinematográfica: demora inicial + animación de escala, profundidad (Z) y fade de opacidad
    if (!isIntroComplete.current) {
      if (elapsedRef.current < introDelay) {
        // Antes de la intro: invisible y ligeramente alejada
        meshRef.current.scale.setScalar(0)
        meshRef.current.position.set(basePosition[0], basePosition[1], basePosition[2] - 0.45)
        if (materialRef.current) materialRef.current.opacity = 0
        return
      }

      const introProgress = Math.min(1, (elapsedRef.current - introDelay) / introDuration)
      // Easing cúbico fluido
      const eased = 1 - Math.pow(1 - introProgress, 3)

      // Comienza al 70% del tamaño y llega suavemente al 100%
      const currentScale = targetScale * (0.70 + eased * 0.30)
      meshRef.current.scale.setScalar(currentScale)

      // Viene desde z = -0.45 hacia su posición final con sensación de profundidad
      const currentZ = basePosition[2] - 0.45 * (1 - eased)
      meshRef.current.position.set(basePosition[0], basePosition[1], currentZ)

      // Fade sutil de opacidad en el material metálico
      if (materialRef.current) {
        materialRef.current.opacity = eased
      }

      if (introProgress >= 1) {
        isIntroComplete.current = true
        if (materialRef.current) {
          materialRef.current.opacity = 1
          materialRef.current.transparent = false
        }
      }
    } else {
      // Posición final centrada + micro-parallax casi imperceptible en mobile
      meshRef.current.scale.setScalar(targetScale)
      meshRef.current.position.set(
        basePosition[0] + parallaxOffsetRef.current.x,
        basePosition[1],
        basePosition[2]
      )
    }

    if (reducedMotion) {
      meshRef.current.rotation.x = initialTiltX
      meshRef.current.rotation.y = initialTiltY + delta * 0.05
      meshRef.current.rotation.z = initialTiltZ
      return
    }

    // 2. Interacción táctil en mobile: si no se toca, el gesto decae suavemente y vuelve a la rotación natural
    if (isMobile) {
      if (!isTouchingRef.current) {
        const decay = Math.min(0.08, 2.8 * delta)
        touchRotationRef.current.y *= (1 - decay)
        touchRotationRef.current.x *= (1 - decay)
        parallaxOffsetRef.current.x *= (1 - decay)
      }
    } else {
      // Desktop: seguimiento sutil del mouse
      targetRotation.current.y = initialTiltY + mouseRef.current.x * 0.40
      targetRotation.current.x = initialTiltX + mouseRef.current.y * 0.18

      const dampFactor = Math.min(0.12, 2.6 * delta)
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * dampFactor
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * dampFactor
    }

    // 3. Rotación 3D lenta, continua, fluida y elegante
    const autoRotate = state.clock.elapsedTime * 0.048

    if (isMobile) {
      meshRef.current.rotation.x = initialTiltX + touchRotationRef.current.x
      meshRef.current.rotation.y = initialTiltY + autoRotate + touchRotationRef.current.y
      meshRef.current.rotation.z = initialTiltZ
    } else {
      meshRef.current.rotation.x = currentRotation.current.x
      meshRef.current.rotation.y = currentRotation.current.y + autoRotate
      meshRef.current.rotation.z = initialTiltZ
    }
  })

  // Geometría original precisa de virola
  const radialSegs = isMobile ? 36 : 64
  const tubularSegs = isMobile ? 72 : 128

  return (
    <mesh ref={meshRef} scale={0} position={basePosition}>
      {/* Geometría original: corona metálica amplia con espesor y curvatura */}
      <torusGeometry args={[1.2, 0.25, radialSegs, tubularSegs]} />
      {/* Acabado metálico original de alta calidad: alpaca / plata satinada pulida pura */}
      <meshStandardMaterial
        ref={materialRef}
        color="#d8d4cb"
        metalness={1.0}
        roughness={0.18}
        envMapIntensity={1.5}
        transparent={true}
        opacity={0}
      />
    </mesh>
  )
}
