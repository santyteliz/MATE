import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LaserHeadProps {
  targetPosition: [number, number, number] | null
  active: boolean
}

export function LaserHead({ targetPosition, active }: LaserHeadProps) {
  const headGroupRef = useRef<THREE.Group>(null)
  const coreBeamRef = useRef<THREE.Mesh>(null)
  const glowBeamRef = useRef<THREE.Mesh>(null)
  const sparkParticlesRef = useRef<THREE.Points>(null)
  const cutLightRef = useRef<THREE.PointLight>(null)

  // Position of laser galvo head nozzle in world coordinates
  const nozzlePos = useMemo(() => new THREE.Vector3(2.1, 1.45, 1.15), [])

  // Realistic micro-sparks physics
  const sparkCount = 32
  const sparkData = useMemo(() => {
    const positions = new Float32Array(sparkCount * 3)
    const velocities: THREE.Vector3[] = []
    const lifetimes = new Float32Array(sparkCount)

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.45) * 0.9,
          Math.random() * 0.7 + 0.3,
          (Math.random() - 0.5) * 0.9
        )
      )
      lifetimes[i] = Math.random()
    }

    return { positions, velocities, lifetimes }
  }, [])

  useFrame((state, delta) => {
    if (!targetPosition) return

    const targetVec = new THREE.Vector3(...targetPosition)

    // 1. Subtle galvo mirror aiming motion
    if (headGroupRef.current) {
      const targetHeadX = 2.05 + (targetPosition[0] - 1.40) * 0.25
      const targetHeadY = 1.40 + (targetPosition[1] - -0.12) * 0.15
      headGroupRef.current.position.x += (targetHeadX - headGroupRef.current.position.x) * 0.15
      headGroupRef.current.position.y += (targetHeadY - headGroupRef.current.position.y) * 0.15
      nozzlePos.copy(headGroupRef.current.position).add(new THREE.Vector3(0, -0.25, 0))
    }

    // 2. Collimated ultra-fine industrial laser beam with core & outer halo
    if (coreBeamRef.current && glowBeamRef.current) {
      if (active) {
        coreBeamRef.current.visible = true
        glowBeamRef.current.visible = true

        const beamDir = new THREE.Vector3().subVectors(targetVec, nozzlePos)
        const distance = beamDir.length()
        const midpoint = new THREE.Vector3().addVectors(nozzlePos, targetVec).multiplyScalar(0.5)
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          beamDir.clone().normalize()
        )

        // Core white-hot razor line
        coreBeamRef.current.position.copy(midpoint)
        coreBeamRef.current.scale.set(1, distance, 1)
        coreBeamRef.current.quaternion.copy(quat)

        // Outer atmospheric ionization glow (#758A4F tint)
        glowBeamRef.current.position.copy(midpoint)
        glowBeamRef.current.scale.set(1, distance, 1)
        glowBeamRef.current.quaternion.copy(quat)

        const flicker = 0.88 + Math.sin(state.clock.elapsedTime * 90) * 0.12
        const glowMat = glowBeamRef.current.material as THREE.MeshBasicMaterial
        glowMat.opacity = 0.45 * flicker
      } else {
        coreBeamRef.current.visible = false
        glowBeamRef.current.visible = false
      }
    }

    // 3. Thermal Plasma Cut Contact Point Light
    if (cutLightRef.current) {
      if (active) {
        cutLightRef.current.position.copy(targetVec)
        const intensityFlicker = 3.2 + Math.random() * 1.2
        cutLightRef.current.intensity = intensityFlicker
      } else {
        cutLightRef.current.intensity = 0
      }
    }

    // 4. Micro Sparks Physics
    if (sparkParticlesRef.current && active) {
      const geo = sparkParticlesRef.current.geometry
      const posAttr = geo.attributes.position as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array

      for (let i = 0; i < sparkCount; i++) {
        sparkData.lifetimes[i] += delta * 3.8
        if (sparkData.lifetimes[i] > 1.0) {
          sparkData.lifetimes[i] = 0
          arr[i * 3] = targetVec.x
          arr[i * 3 + 1] = targetVec.y
          arr[i * 3 + 2] = targetVec.z
          sparkData.velocities[i].set(
            (Math.random() - 0.45) * 0.9,
            Math.random() * 0.9 + 0.35,
            (Math.random() - 0.5) * 0.9
          )
        } else {
          arr[i * 3] += sparkData.velocities[i].x * delta
          arr[i * 3 + 1] += sparkData.velocities[i].y * delta - 1.6 * delta * delta
          arr[i * 3 + 2] += sparkData.velocities[i].z * delta
        }
      }
      posAttr.needsUpdate = true
      sparkParticlesRef.current.visible = true
    } else if (sparkParticlesRef.current) {
      sparkParticlesRef.current.visible = false
    }
  })

  return (
    <>
      {/* ── Industrial Galvo Laser Head ── */}
      <group ref={headGroupRef} position={[2.1, 1.45, 1.15]} rotation={[0.22, -0.32, 0]}>
        {/* Upper housing: CNC machined matte black anodized aluminum */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.28, 0.5, 0.28]} />
          <meshStandardMaterial color="#181614" roughness={0.4} metalness={0.85} />
        </mesh>

        {/* F-Theta focus collar */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.08, 32]} />
          <meshStandardMaterial color="#2d2822" roughness={0.25} metalness={0.95} />
        </mesh>

        {/* Precision laser cone nozzle */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.11, 0.038, 0.22, 32]} />
          <meshStandardMaterial color="#c89645" roughness={0.2} metalness={0.96} />
        </mesh>

        {/* Protective quartz lens element */}
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.032, 0.025, 0.04, 24]} />
          <meshBasicMaterial color="#e8ffba" />
        </mesh>
      </group>

      {/* ── Core Razor Laser Beam (Incandescent White) ── */}
      <mesh ref={coreBeamRef} visible={false}>
        <cylinderGeometry args={[0.002, 0.003, 1, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Outer Ionization Halo (Fine Green-Gold) ── */}
      <mesh ref={glowBeamRef} visible={false}>
        <cylinderGeometry args={[0.008, 0.015, 1, 12]} />
        <meshBasicMaterial
          color="#a8d655"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ── Plasma Cut Sparkle Light on Metal Surface ── */}
      <pointLight
        ref={cutLightRef}
        color="#fff9d0"
        intensity={0}
        distance={2.8}
        decay={2}
      />

      {/* ── Micro Sparks System ── */}
      <points ref={sparkParticlesRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#fff8b5"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  )
}
