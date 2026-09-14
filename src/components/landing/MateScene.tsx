import { useEffect, useRef, useState } from 'react'

export function MateScene() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const currentRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })

  // Staggered entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 250)
    return () => clearTimeout(timer)
  }, [])

  // Parallax mouse tracking with smooth damping (minimal movement for background stability)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let rafId: number

    const handleMouse = (e: MouseEvent) => {
      targetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      targetRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.018
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.018
      setMouseOffset({ x: currentRef.current.x, y: currentRef.current.y })
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouse, { passive: true })
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Micro parallax factors: background photo moves very slightly (4-6px), particles and smoke float gently
  const bgX = mouseOffset.x * 6
  const bgY = mouseOffset.y * 4
  const smokeX = mouseOffset.x * 12
  const smokeY = mouseOffset.y * 8

  return (
    <div className={`mate-scene ${isVisible ? 'mate-scene--visible' : ''}`} aria-hidden="true">
      {/* ── Cinematic Macro Background Photography ── */}
      <div
        className="mate-photo-bg"
        style={{
          transform: `translate(${bgX}px, ${bgY}px) scale(1.04)`,
        }}
      >
        <img
          src="/mate-hero-bg.png"
          alt=""
          className="mate-photo-img"
          loading="eager"
        />
        {/* Organic Vignette & Contrast Gradients for Content Legibility */}
        <div className="mate-photo-vignette" />
        <div className="mate-photo-overlay-left" />
        <div className="mate-photo-overlay-center" />
      </div>

      {/* ── Volumetric Atmospheric Smoke / Mist overlay ── */}
      <div
        className="mate-vapor"
        style={{ transform: `translate(${smokeX}px, ${smokeY}px)` }}
      />

      {/* ── Suspended Yerba micro-particles ── */}
      <div className="yerba-fragments">
        <span className="yerba-frag" style={{ left: '16%', top: '64%', animationDelay: '0s' }} />
        <span className="yerba-frag" style={{ left: '22%', top: '38%', animationDelay: '3s' }} />
        <span className="yerba-frag yerba-frag--large" style={{ left: '74%', top: '68%', animationDelay: '1.5s' }} />
        <span className="yerba-frag" style={{ left: '82%', top: '30%', animationDelay: '4s' }} />
        <span className="yerba-frag" style={{ left: '44%', top: '74%', animationDelay: '2s' }} />
        <span className="yerba-frag yerba-frag--large" style={{ left: '62%', top: '78%', animationDelay: '5s' }} />
      </div>
    </div>
  )
}
