import * as THREE from 'three'

// Procedural Laser Engraving Texture Manager
// Generates transparent alpha overlays and bump/displacement maps for authentic laser cut metal
export class VirolaEngravingTextureManager {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  public texture: THREE.CanvasTexture
  public bumpTexture: THREE.CanvasTexture

  private width = 2048
  private height = 512

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    const context = this.canvas.getContext('2d')
    if (!context) throw new Error('Could not get 2D context for engraving canvas')
    this.ctx = context

    // Color texture with transparent background so the base metal PBR remains 100% reflective
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.wrapS = THREE.RepeatWrapping
    this.texture.wrapT = THREE.ClampToEdgeWrapping
    this.texture.colorSpace = THREE.SRGBColorSpace

    // Bump texture
    const bumpCanvas = document.createElement('canvas')
    bumpCanvas.width = this.width
    bumpCanvas.height = this.height
    this.bumpTexture = new THREE.CanvasTexture(bumpCanvas)
    this.bumpTexture.wrapS = THREE.RepeatWrapping
    this.bumpTexture.wrapT = THREE.ClampToEdgeWrapping
  }

  public update(text: string, progress: number): void {
    const { ctx, width, height } = this

    // CLEAR TO COMPLETELY TRANSPARENT so the metal underneath reflects environmental studio light
    ctx.clearRect(0, 0, width, height)

    // Artisanal filigree lines at the top and bottom of the engraving band
    ctx.strokeStyle = 'rgba(28, 20, 15, 0.70)'
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.moveTo(0, 80)
    ctx.lineTo(width, 80)
    ctx.moveTo(0, height - 80)
    ctx.lineTo(width, height - 80)
    ctx.stroke()

    // Fine secondary highlight line
    ctx.strokeStyle = 'rgba(255, 255, 250, 0.40)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, 83)
    ctx.lineTo(width, 83)
    ctx.moveTo(0, height - 83)
    ctx.lineTo(width, height - 83)
    ctx.stroke()

    const displayText = (text.trim() || 'PAPÁ').toUpperCase()

    // Dynamic typography sizing
    let fontSize = 150
    if (displayText.length > 14) fontSize = 80
    else if (displayText.length > 9) fontSize = 105
    else if (displayText.length > 6) fontSize = 130

    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const centerX = width * 0.5
    const centerY = height * 0.5
    const textMetrics = ctx.measureText(displayText)
    const textWidth = textMetrics.width

    // Bounding box of the engraved area
    const startX = centerX - textWidth / 2 - 40
    const totalSpan = textWidth + 80
    const currentEngraveX = startX + totalSpan * Math.min(1, Math.max(0, progress))

    // Draw side ornament motifs
    this.drawOrnament(ctx, centerX - textWidth / 2 - 80, centerY, -1)
    this.drawOrnament(ctx, centerX + textWidth / 2 + 80, centerY, 1)

    // Clip engraving area based on laser progress
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, currentEngraveX, height)
    ctx.clip()

    // 1. Deep oxidized laser cut groove (dark burnt metal in the trench)
    ctx.fillStyle = '#140e0a'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 1.5
    ctx.shadowOffsetY = 2.5
    ctx.fillText(displayText, centerX, centerY)

    // 2. Micro-highlight on the carved lip
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.fillText(displayText, centerX - 1.2, centerY - 1.2)

    // 3. Main dark oxidized incision
    ctx.fillStyle = '#1c1510'
    ctx.fillText(displayText, centerX, centerY)

    // 4. Hot laser thermal glow at the cutting point
    if (progress > 0 && progress < 1) {
      const grad = ctx.createRadialGradient(
        currentEngraveX,
        centerY,
        2,
        currentEngraveX,
        centerY,
        40
      )
      grad.addColorStop(0, 'rgba(255, 255, 220, 0.95)')
      grad.addColorStop(0.3, 'rgba(168, 214, 85, 0.70)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(currentEngraveX - 45, centerY - 70, 90, 140)
    }

    ctx.restore()

    this.texture.needsUpdate = true
  }

  private drawOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.strokeStyle = 'rgba(25, 18, 14, 0.75)'
    ctx.fillStyle = 'rgba(25, 18, 14, 0.75)'
    ctx.lineWidth = 3

    // Leaf motif
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(dir * 16, -14, dir * 34, 0)
    ctx.quadraticCurveTo(dir * 16, 14, 0, 0)
    ctx.stroke()

    // Decorative dots
    ctx.beginPath()
    ctx.arc(dir * 44, 0, 3.5, 0, Math.PI * 2)
    ctx.arc(dir * 56, 0, 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  public dispose() {
    this.texture.dispose()
    this.bumpTexture.dispose()
  }
}
