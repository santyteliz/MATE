import { useEffect, useRef, useState } from 'react'

const WORDS = [
  { text: 'FAMILIA', x: 8, y: 18, size: 0.78, delay: 0, opacity: 0.16, blur: false },
  { text: 'MOMENTOS', x: 84, y: 14, size: 0.72, delay: 2, opacity: 0.20, blur: false, green: true },
  { text: 'IDENTIDAD', x: 5, y: 76, size: 0.75, delay: 1, opacity: 0.18, blur: false },
  { text: 'RECUERDOS', x: 88, y: 72, size: 0.65, delay: 3, opacity: 0.12, blur: true },
  { text: 'NOMBRE', x: 86, y: 44, size: 0.70, delay: 1.5, opacity: 0.18, blur: false, green: true },
  { text: 'HISTORIA', x: 6, y: 48, size: 0.82, delay: 2.5, opacity: 0.10, blur: true },
]

export function FloatingWords() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let rafId: number
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handleMouse = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 14
      targetY = (e.clientY / window.innerHeight - 0.5) * 14
    }

    const animate = () => {
      currentX += (targetX - currentX) * 0.015
      currentY += (targetY - currentY) * 0.015
      setMouseOffset({ x: currentX, y: currentY })
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouse, { passive: true })
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="floating-words" ref={containerRef} aria-hidden="true">
      {WORDS.map((word) => (
        <span
          key={word.text}
          className={`floating-word ${word.green ? 'floating-word--green' : ''} ${word.blur ? 'floating-word--blur' : ''}`}
          style={{
            left: `${word.x}%`,
            top: `${word.y}%`,
            fontSize: `${word.size}rem`,
            opacity: word.opacity,
            animationDelay: `${word.delay}s`,
            transform: `translate(${mouseOffset.x * word.size}px, ${mouseOffset.y * word.size}px)`,
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  )
}
