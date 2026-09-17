import { useEffect, useRef } from 'react'

type Kind = 'body' | 'edge' | 'rim' | 'straw' | 'spark'

type Particle = {
  x: number; y: number; vx: number; vy: number; tx: number; ty: number
  seed: number; size: number; kind: Kind; tone: string
}

interface MateMatterCanvasProps { exiting: boolean }

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const ease = (value: number) => 1 - Math.pow(1 - clamp(value), 3)

function randomFactory(seed = 713) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function bodyWidth(progress: number, width: number) {
  return width * (.105 + Math.sin(progress * Math.PI) * .10 + (1 - progress) * .027)
}

function makeParticles(width: number, height: number, count: number): Particle[] {
  const random = randomFactory()
  const particles: Particle[] = []
  const cx = width * .53
  const top = height * .28
  const bottom = height * .78
  const rimY = top + height * .015
  const add = (tx: number, ty: number, kind: Kind, tone: string, size: number) => {
    const spread = kind === 'spark' ? .46 : .30
    particles.push({
      x: cx + (random() - .5) * width * spread,
      y: height * .50 + (random() - .5) * height * spread,
      vx: 0,
      vy: 0,
      tx,
      ty,
      seed: random(),
      size,
      kind,
      tone,
    })
  }

  const bodyCount = Math.round(count * .57)
  const edgeCount = Math.round(count * .20)
  const rimCount = Math.round(count * .15)
  const strawCount = Math.round(count * .06)
  const tones = ['#160f0d', '#52524c', '#758a4f', '#160f0d']

  for (let index = 0; index < bodyCount; index += 1) {
    const progress = random()
    const half = bodyWidth(progress, width)
    const tx = cx + (random() * 2 - 1) * half
    const ty = mix(top, bottom, progress)
    add(tx, ty, 'body', tones[index % tones.length], 1 + random() * 1.2)
  }

  for (let index = 0; index < edgeCount; index += 1) {
    const progress = index / Math.max(1, edgeCount - 1)
    const half = bodyWidth(progress, width)
    const side = index % 2 === 0 ? -1 : 1
    add(cx + side * half, mix(top, bottom, progress), 'edge', '#160f0d', .85 + random() * .65)
  }

  for (let index = 0; index < rimCount; index += 1) {
    const angle = (index / rimCount) * Math.PI * 2
    const tx = cx + Math.cos(angle) * width * .158
    const ty = rimY + Math.sin(angle) * height * .032
    add(tx, ty, 'rim', index % 5 === 0 ? '#758a4f' : '#52524c', .8 + random() * .7)
  }

  for (let index = 0; index < strawCount; index += 1) {
    const progress = index / Math.max(1, strawCount - 1)
    add(mix(cx + width * .055, cx + width * .145, progress), mix(rimY - height * .015, height * .075, progress), 'straw', '#160f0d', .8 + random() * .55)
  }

  while (particles.length < count) {
    const angle = random() * Math.PI * 2
    const distance = width * (.17 + random() * .12)
    add(cx + Math.cos(angle) * distance, height * .49 + Math.sin(angle) * distance, 'spark', '#758a4f', .55 + random() * .8)
  }

  return particles
}

function drawContour(context: CanvasRenderingContext2D, width: number, height: number, amount: number, offsetX: number, offsetY: number) {
  if (amount <= .04) return
  const cx = width * .53 + offsetX
  const top = height * .28 + offsetY
  const bottom = height * .78 + offsetY
  context.save()
  context.globalAlpha = amount * .075
  context.fillStyle = '#758a4f'
  context.strokeStyle = '#160f0d'
  context.lineWidth = 1
  context.beginPath()
  for (let index = 0; index <= 34; index += 1) {
    const progress = index / 34
    const x = cx - bodyWidth(progress, width)
    const y = mix(top, bottom, progress)
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  for (let index = 34; index >= 0; index -= 1) {
    const progress = index / 34
    context.lineTo(cx + bodyWidth(progress, width), mix(top, bottom, progress))
  }
  context.closePath()
  context.fill()
  context.globalAlpha = amount * .3
  context.stroke()
  context.restore()
}

export function MateMatterCanvas({ exiting }: MateMatterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const exitRef = useRef(exiting)

  useEffect(() => { exitRef.current = exiting }, [exiting])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const context = canvas.getContext('2d')
    if (!context) {
      container.classList.add('matter-canvas--fallback')
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    const slowDevice = memory <= 4 || navigator.hardwareConcurrency <= 4
    let width = 1
    let height = 1
    let particles: Particle[] = []
    let dpr = 1
    let frameId = 0
    let start = performance.now()
    let last = start
    let exitStart: number | null = null
    let visible = !document.hidden
    const pointer = { x: 0, y: 0, active: false }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      const mobile = width < 768
      dpr = Math.min(window.devicePixelRatio || 1, slowDevice ? 1 : mobile ? 1.25 : 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = slowDevice ? (mobile ? 92 : 150) : (mobile ? 148 : 276)
      particles = makeParticles(width, height, count)
      start = performance.now()
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !finePointer) return
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }
    const leave = () => { pointer.active = false }
    const visibilityChange = () => {
      visible = !document.hidden
      if (visible && !frameId) {
        last = performance.now()
        frameId = requestAnimationFrame(draw)
      }
    }

    const draw = (now: number) => {
      frameId = 0
      if (!visible) return
      const delta = Math.min(32, now - last)
      last = now
      if (exitRef.current && exitStart === null) exitStart = now
      const entry = reducedMotion ? 1 : ease((now - start - 90) / 1280)
      const exit = exitStart === null ? 0 : ease((now - exitStart) / 460)
      context.clearRect(0, 0, width, height)

      const cx = width * .53
      const cy = height * .50
      const idlePhase = reducedMotion ? 0 : now * .00045
      const idleX = Math.sin(idlePhase) * width * .009
      const idleY = Math.cos(idlePhase * .83) * height * .006
      const pointerX = pointer.active && !reducedMotion ? (pointer.x - cx) * .012 : 0
      const pointerY = pointer.active && !reducedMotion ? (pointer.y - cy) * .012 : 0
      const motionX = idleX + pointerX
      const motionY = idleY + pointerY
      const halo = context.createRadialGradient(cx + motionX * 1.8, cy + motionY * 1.8, 0, cx + motionX * 1.8, cy + motionY * 1.8, width * .35)
      halo.addColorStop(0, `rgba(117, 138, 79, ${.16 * entry * (1 - exit)})`)
      halo.addColorStop(1, 'rgba(117, 138, 79, 0)')
      context.fillStyle = halo
      context.fillRect(0, 0, width, height)

      drawContour(context, width, height, entry * (1 - exit), motionX, motionY)
      const rimReveal = clamp((entry - .34) / .4)
      const strawReveal = clamp((entry - .55) / .3)
      const portalX = width * .62
      const portalY = height * .48

      for (const particle of particles) {
        let tx = particle.tx
        let ty = particle.ty
        if (exit === 0) {
          tx += motionX
          ty += motionY
        }
        if (exit > 0) {
          const diagonal = (particle.seed - .5) * width * .22
          tx = mix(tx, portalX + diagonal + (particle.ty - cy) * .19, exit)
          ty = mix(ty, portalY + (particle.seed - .5) * height * .24, exit)
        }
        if (pointer.active && !reducedMotion && exit === 0) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const distance = Math.hypot(dx, dy)
          if (distance < 135) {
            const force = (1 - distance / 135) * .62
            tx += (dx / Math.max(distance, 1)) * force * 14
            ty += (dy / Math.max(distance, 1)) * force * 14
          }
        }
        const wobble = reducedMotion ? 0 : Math.sin(now * .0011 + particle.seed * 16) * .38
        particle.vx = (particle.vx + (tx - particle.x) * .009 + wobble * .007) * .86
        particle.vy = (particle.vy + (ty - particle.y) * .009 + wobble * .005) * .86
        particle.x += particle.vx * (delta / 16)
        particle.y += particle.vy * (delta / 16)

        const reveal = particle.kind === 'rim' ? rimReveal : particle.kind === 'straw' ? strawReveal : entry
        const alpha = reveal * (particle.kind === 'spark' ? .42 : particle.kind === 'body' ? .84 : .92)
        context.globalAlpha = alpha * (1 - exit * .15)
        context.fillStyle = particle.tone
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size * (particle.kind === 'body' ? 1 : .9), 0, Math.PI * 2)
        context.fill()
      }

      if (rimReveal > 0) {
        context.save()
        context.globalAlpha = rimReveal * .78 * (1 - exit)
        context.fillStyle = '#160f0d'
        context.beginPath()
        context.ellipse(cx + motionX, height * .295 + motionY, width * .151, height * .027, 0, 0, Math.PI * 2)
        context.fill()
        context.globalAlpha = rimReveal * .65 * (1 - exit)
        context.strokeStyle = '#52524c'
        context.lineWidth = 1.25
        context.beginPath()
        context.ellipse(cx + motionX, height * .295 + motionY, width * .16, height * .032, 0, 0, Math.PI * 2)
        context.stroke()
        if (!reducedMotion) {
          const glint = now * .0008
          context.globalAlpha = rimReveal * .9 * (1 - exit)
          context.strokeStyle = '#758a4f'
          context.lineWidth = 2
          context.beginPath()
          context.ellipse(cx + motionX, height * .295 + motionY, width * .16, height * .032, 0, glint, glint + .72)
          context.stroke()
        }
        context.restore()
      }
      if (strawReveal > 0) {
        context.save()
        context.globalAlpha = strawReveal * .75 * (1 - exit)
        context.strokeStyle = '#160f0d'
        context.lineWidth = 1.2
        context.beginPath()
        const strawStartX = cx + width * .055 + motionX
        const strawStartY = height * .29 + motionY
        const strawEndX = cx + width * .145 + motionX
        const strawEndY = height * .075 + motionY
        context.moveTo(strawStartX, strawStartY)
        context.lineTo(strawEndX, strawEndY)
        context.stroke()
        if (!reducedMotion) {
          const progress = (Math.sin(now * .0018) + 1) / 2
          context.globalAlpha = strawReveal * .9 * (1 - exit)
          context.fillStyle = '#758a4f'
          context.beginPath()
          context.arc(mix(strawStartX, strawEndX, progress), mix(strawStartY, strawEndY, progress), 1.7, 0, Math.PI * 2)
          context.fill()
        }
        context.restore()
      }
      if (exit > 0) {
        context.save()
        context.globalAlpha = exit * .58
        context.strokeStyle = '#160f0d'
        context.lineWidth = 1
        context.beginPath()
        context.moveTo(portalX - width * .12, portalY + height * .16)
        context.lineTo(portalX - width * .06, portalY - height * .16)
        context.lineTo(portalX + width * .12, portalY - height * .16)
        context.lineTo(portalX + width * .06, portalY + height * .16)
        context.closePath()
        context.stroke()
        context.restore()
      }
      context.globalAlpha = 1
      if (!reducedMotion || exit < 1) frameId = requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(container)
    canvas.addEventListener('pointermove', move, { passive: true })
    canvas.addEventListener('pointerleave', leave, { passive: true })
    canvas.addEventListener('pointerup', leave, { passive: true })
    document.addEventListener('visibilitychange', visibilityChange)
    resize()
    frameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('pointerup', leave)
      document.removeEventListener('visibilitychange', visibilityChange)
    }
  }, [])

  return <div className="matter-canvas" ref={containerRef} aria-hidden="true"><canvas ref={canvasRef} /><div className="matter-fallback"><i /><b /><span /></div></div>
}
