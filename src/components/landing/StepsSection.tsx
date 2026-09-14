import { useEffect, useRef } from 'react'

const STEPS = [
  {
    number: '01',
    title: 'ELEGÍ',
    description: 'Elegí cómo querés que se vea.',
  },
  {
    number: '02',
    title: 'PERSONALIZÁ',
    description: 'Dale tu nombre, frase o historia.',
  },
  {
    number: '03',
    title: 'HACÉLO TUYO',
    description: 'Convertí la idea en algo real.',
  },
]

export function StepsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    )

    const items = sectionRef.current?.querySelectorAll('.step-item')
    items?.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="steps-section" id="como-funciona" ref={sectionRef}>
      {/* Green transition line */}
      <div className="section-divider" aria-hidden="true" />

      <div className="steps-header">
        <p className="steps-eyebrow">Todo empieza con una idea.</p>
      </div>
      <div className="steps-grid">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="step-item"
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <span className="step-number">{step.number}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
