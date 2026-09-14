import { useState, useEffect } from 'react'
import { VirolaScene } from './VirolaScene'
import { GlassButton } from './GlassButton'

interface HeroProps {
  onCreateMate: () => void
}

export function Hero({ onCreateMate }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const handleCreate = () => {
    setIsTransitioning(true)
    setTimeout(() => onCreateMate(), 900)
  }

  return (
    <section
      className={`hero ${isTransitioning ? 'hero--transitioning' : ''}`}
      aria-label="Creá tu virola personalizada"
    >
      {/*
        ── DOM ORDER IS INTENTIONAL ──
        Desktop: canvas is position:absolute so DOM order doesn't affect layout.
                 Content (z:4) appears on top of canvas (z:2) via z-index.
        Mobile:  Hero is flex-column. Content comes first in DOM → appears at TOP.
                 Canvas comes second in DOM → appears at BOTTOM below the button.
      */}

      {/* 1. Editorial content — title + subtitle + CTA */}
      <div className={`hero-content ${isVisible ? 'hero-content--visible' : ''}`}>
        <div className="hero-text-block">
          <span className="hero-eyebrow animate-in delay-1">
            MATESHOP — Virola Personalizada
          </span>

          <h1 className="hero-title">
            <span className="hero-title-line animate-in delay-2">CREÁ TU</span>
            <span className="hero-title-line animate-in delay-2">VIROLA</span>
            <span className="hero-title-line hero-title-line--accent animate-in delay-3">
              PERSONALIZADA
            </span>
          </h1>

          <p className="hero-subtitle animate-in delay-4">
            Una pieza. Tu identidad.
          </p>

          <div className="hero-cta animate-in delay-5">
            <GlassButton label="CREAR MI VIROLA" onClick={handleCreate} />
          </div>
        </div>
      </div>

      {/* 2. 3D canvas — virola protagonist
            Desktop: absolute, covers full hero, virola offset right.
            Mobile:  flex child, dedicated space below content.
      */}
      <div className="hero-canvas-container" aria-hidden="true">
        <VirolaScene />
      </div>
    </section>
  )
}
