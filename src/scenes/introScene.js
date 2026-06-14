import * as THREE from 'three'

import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// =====================
// КОНСТАНТЫ
// =====================
const particleCount = 4000
const GOLD = new THREE.Color('#FFD700')

const worldWidth = 30
const bgCount = 600
const COIN_POOL = 70
const TRAIL_MAX = 1200

// =====================
// ХЕЛПЕРЫ (чистые функции)
// =====================
function pointInPolygon(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export default class IntroScene {
  constructor(container) {
    this.container = container

    // состояние сцены
    this.svgScale = 1
    this.svgCenter = { x: 500, y: 274 }
    this.mapBBox = null
    this.mapReady = false

    // timeline / фазы
    // 0: свечение искры  1: взрыв-облако  2: сборка карты  3: тенге  4: финал (тексты + дождь)
    this.phase = 0
    this.phaseStart = performance.now()
    this.currentTarget = null
    this.lerpSpeed = 0.04
    this.PHASE_DURATION = { 0: 2200, 1: 1600, 2: 3000, 3: 1800, 4: 99999 }

    // монеты / хвост
    this.coins = []
    this.coinTexture = null
    this.tengeSprite = null
    this.lastCoinSpawn = 0

    // служебное
    this.rafId = null
    this.disposed = false

    // =====================
    // SCENE / CAMERA / RENDERER
    // =====================
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#000000')

    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    )
    this.camera.position.z = 25

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.container.appendChild(this.renderer.domElement)

    // =====================
    // BLOOM
    // =====================
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9, 0.6, 0.2
    )
    this.composer.addPass(this.bloomPass)

    // =====================
    // ФОНОВАЯ СЕТЬ ТОЧЕК (дрейф + мерцание)
    // =====================
    this.bgPositions = new Float32Array(bgCount * 3)
    this.bgPhase = new Float32Array(bgCount)
    for (let i = 0; i < bgCount; i++) {
      this.bgPositions[i * 3]     = (Math.random() - 0.5) * 90
      this.bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 60
      this.bgPositions[i * 3 + 2] = -20 - Math.random() * 30
      this.bgPhase[i] = Math.random() * Math.PI * 2
    }
    this.bgGeo = new THREE.BufferGeometry()
    this.bgGeo.setAttribute('position', new THREE.BufferAttribute(this.bgPositions, 3))
    this.bgMat = new THREE.PointsMaterial({
      color: 0x8899bb, size: 0.12, transparent: true, opacity: 0.5, depthWrite: false
    })
    this.bgPoints = new THREE.Points(this.bgGeo, this.bgMat)
    this.scene.add(this.bgPoints)

    // =====================
    // БУФЕРЫ ОСНОВНЫХ ЧАСТИЦ
    // =====================
    this.positions      = new Float32Array(particleCount * 3)
    this.targetOrigin   = new Float32Array(particleCount * 3) // искра в центре
    this.targetExplode  = new Float32Array(particleCount * 3) // облако-взрыв
    this.targetMap      = new Float32Array(particleCount * 3) // карта

    for (let i = 0; i < particleCount; i++) {
      this.positions[i * 3]     = (Math.random() - 0.5) * 0.05
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 0.05
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05

      // origin — крошечное плотное ядро (медленное свечение)
      const a1 = Math.random() * Math.PI * 2
      const r1 = Math.pow(Math.random(), 0.8) * 0.5
      this.targetOrigin[i * 3]     = Math.cos(a1) * r1
      this.targetOrigin[i * 3 + 1] = Math.sin(a1) * r1
      this.targetOrigin[i * 3 + 2] = (Math.random() - 0.5) * 0.3

      // explode — широкое сферическое облако (взрыв)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r2 = 14 + Math.random() * 6
      this.targetExplode[i * 3]     = r2 * Math.sin(phi) * Math.cos(theta)
      this.targetExplode[i * 3 + 1] = r2 * Math.sin(phi) * Math.sin(theta) * 0.6
      this.targetExplode[i * 3 + 2] = r2 * Math.cos(phi) * 0.4
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

    this.material = new THREE.PointsMaterial({
      color: GOLD, size: 0.02, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })

    this.particles = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.particles)

    // изначальная цель — ядро (как в исходнике до загрузки SVG)
    this.currentTarget = this.targetOrigin

    // =====================
    // КОМЕТНЫЙ ХВОСТ МОНЕТ (затухающие точки)
    // =====================
    this.trailPos = new Float32Array(TRAIL_MAX * 3)
    this.trailAlpha = new Float32Array(TRAIL_MAX)
    this.trailHead = 0

    this.trailGeo = new THREE.BufferGeometry()
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3))
    this.trailGeo.setAttribute('alpha', new THREE.BufferAttribute(this.trailAlpha, 1))

    this.trailMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color('#FFD24A') } },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * alpha + 0.5;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
          vec2 d = gl_PointCoord - vec2(0.5);
          if (dot(d, d) > 0.25) discard;
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `
    })
    this.trailPoints = new THREE.Points(this.trailGeo, this.trailMat)
    this.trailPoints.position.z = -3
    this.scene.add(this.trailPoints)

    // bound-обработчики
    this._onResize = this.onResize.bind(this)
    this._animate = this.animate.bind(this)

    window.addEventListener('resize', this._onResize)
  }

  // =====================
  // БОЛЬШОЙ ТЕНГЕ
  // =====================
  makeTengeSprite() {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 170px Georgia, serif'

    ctx.fillStyle = 'rgba(20, 14, 0, 0.55)'
    ctx.fillText('₸', 128, 138)
    ctx.lineWidth = 6
    ctx.strokeStyle = '#FFCF40'
    ctx.lineJoin = 'round'
    ctx.strokeText('₸', 128, 138)

    const tex = new THREE.CanvasTexture(c)
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true,
      blending: THREE.NormalBlending, depthWrite: false, depthTest: false
    })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(4.5, 4.5, 1)
    sprite.position.set(0, 25, 3)
    sprite.material.opacity = 0
    this.scene.add(sprite)
    return sprite
  }

  // =====================
  // КРУГЛЫЕ МОНЕТЫ ₸
  // =====================
  makeCoinTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const grad = ctx.createRadialGradient(54, 54, 10, 64, 64, 60)
    grad.addColorStop(0, '#FFE98A')
    grad.addColorStop(0.7, '#E8B43A')
    grad.addColorStop(1, '#9C6F1A')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill()
    ctx.lineWidth = 5; ctx.strokeStyle = '#FFF2B0'
    ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#5A3D08'
    ctx.font = 'bold 72px Georgia, serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('₸', 64, 70)
    return new THREE.CanvasTexture(c)
  }

  initCoins() {
    this.coinTexture = this.makeCoinTexture()
    for (let i = 0; i < COIN_POOL; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.coinTexture, transparent: true,
        blending: THREE.NormalBlending, depthWrite: false, opacity: 0.95
      })
      const s = new THREE.Sprite(mat)
      s.scale.set(0.7, 0.7, 1)
      s.position.z = -3
      s.visible = false
      s.userData = { active: false }
      this.scene.add(s)
      this.coins.push(s)
    }
  }

  spawnCoin() {
    const free = this.coins.find((c) => !c.userData.active)
    if (!free) return

    // по всей ширине — глубина (z=-3) спрячет монеты за картой
    const x = (Math.random() - 0.5) * 80

    free.position.set(x, 20 + Math.random() * 4, -3)
    free.userData.active = true
    free.userData.vy = 0.04 + Math.random() * 0.02     // равномерно, без ускорения
    free.userData.spin = (Math.random() - 0.5) * 0.015
    free.material.opacity = 0.95
    free.visible = true
  }

  updateCoins() {
    for (const c of this.coins) {
      if (!c.userData.active) continue
      c.position.y -= c.userData.vy          // прямое падение
      c.material.rotation += c.userData.spin
      this.spawnTrail(c.position.x, c.position.y) // кометный след
      if (c.position.y < -28) { c.userData.active = false; c.visible = false }
    }
  }

  spawnTrail(x, y) {
    this.trailPos[this.trailHead * 3]     = x
    this.trailPos[this.trailHead * 3 + 1] = y
    this.trailPos[this.trailHead * 3 + 2] = 0
    this.trailAlpha[this.trailHead] = 1.0
    this.trailHead = (this.trailHead + 1) % TRAIL_MAX
  }

  updateTrail() {
    for (let i = 0; i < TRAIL_MAX; i++) {
      if (this.trailAlpha[i] > 0) this.trailAlpha[i] -= 0.02
    }
    this.trailGeo.attributes.position.needsUpdate = true
    this.trailGeo.attributes.alpha.needsUpdate = true
  }

  svgToWorld(x, y) {
    return {
      x: (x - this.svgCenter.x) * this.svgScale,
      y: -(y - this.svgCenter.y) * this.svgScale
    }
  }

  // =====================
  // ЗАГРУЗКА SVG
  // =====================
  loadSVG() {
    const loader = new SVGLoader()

    loader.load('/kz.svg', (data) => {
      if (this.disposed) return

      const shapes = []
      data.paths.forEach((path) => {
        SVGLoader.createShapes(path).forEach((s) => shapes.push(s))
      })
      if (!shapes.length) { console.error('SVG shapes not found'); return }

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      const polygons = shapes.map((shape) => {
        const pts = shape.getPoints(80)
        pts.forEach((p) => {
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
          minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
        })
        return pts
      })

      this.svgCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
      this.svgScale = worldWidth / (maxX - minX)

      const filled = []
      const maxAttempts = particleCount * 80
      let attempts = 0
      while (filled.length < particleCount && attempts < maxAttempts) {
        attempts++
        const x = minX + Math.random() * (maxX - minX)
        const y = minY + Math.random() * (maxY - minY)
        for (let s = 0; s < polygons.length; s++) {
          if (pointInPolygon(x, y, polygons[s])) { filled.push({ x, y }); break }
        }
      }

      for (let i = 0; i < particleCount; i++) {
        const p = filled[Math.floor(Math.random() * filled.length)] || { x: this.svgCenter.x, y: this.svgCenter.y }
        const w = this.svgToWorld(p.x, p.y)
        this.targetMap[i * 3]     = w.x
        this.targetMap[i * 3 + 1] = w.y
        this.targetMap[i * 3 + 2] = 0
      }

      const c1 = this.svgToWorld(minX, minY)
      const c2 = this.svgToWorld(maxX, maxY)
      this.mapBBox = { minX: Math.min(c1.x, c2.x), maxX: Math.max(c1.x, c2.x) }

      this.tengeSprite = this.makeTengeSprite()
      this.initCoins()
      this.mapReady = true

      this.startTimeline()
    })
  }

  // =====================
  // TIMELINE / ФАЗЫ
  // =====================
  startTimeline() {
    this.phase = 0
    this.phaseStart = performance.now()
    this.currentTarget = this.targetOrigin
  }

  nextPhase() {
    this.phase++
    this.phaseStart = performance.now()
    if (this.phase === 1) { this.currentTarget = this.targetExplode; this.lerpSpeed = 0.06 }
    if (this.phase === 2) { this.currentTarget = this.targetMap;     this.lerpSpeed = 0.035 }
    if (this.phase === 4) { this.showTexts() }
  }

  showTexts() {
    const overlay = document.getElementById('intro-texts')
    if (overlay) overlay.classList.add('visible')
  }

  // =====================
  // ANIMATION LOOP
  // =====================
  animate() {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this._animate)
    const now = performance.now()
    const pos = this.geometry.attributes.position.array

    // фон
    this.bgMat.opacity = 0.4 + Math.sin(now * 0.0008) * 0.12
    this.bgPoints.rotation.z = Math.sin(now * 0.00005) * 0.05
    const bgArr = this.bgGeo.attributes.position.array
    for (let i = 0; i < bgCount; i++) {
      bgArr[i * 3 + 1] += Math.sin(now * 0.0003 + this.bgPhase[i]) * 0.002
    }
    this.bgGeo.attributes.position.needsUpdate = true

    // яркость/размер частиц по фазам
    if (this.phase === 0) {
      const t = Math.min((now - this.phaseStart) / this.PHASE_DURATION[0], 1)
      this.material.opacity += (Math.min(t * 1.1, 0.95) - this.material.opacity) * 0.04
      this.material.size    += (0.04 - this.material.size) * 0.04
    } else if (this.phase === 1) {
      this.material.size += (0.03 - this.material.size) * 0.05
      this.material.opacity += (0.85 - this.material.opacity) * 0.05
    } else {
      this.material.opacity += (0.9 - this.material.opacity) * 0.04
      this.material.size    += (0.045 - this.material.size) * 0.04
    }

    if (now - this.phaseStart > this.PHASE_DURATION[this.phase] && this.phase < 4) this.nextPhase()

    // лерп частиц (фаза 0 — медленное свечение)
    if (this.currentTarget) {
      const speed = (this.phase === 0) ? 0.015 : this.lerpSpeed
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        pos[i3]     += (this.currentTarget[i3]     - pos[i3])     * speed
        pos[i3 + 1] += (this.currentTarget[i3 + 1] - pos[i3 + 1]) * speed
        pos[i3 + 2] += (this.currentTarget[i3 + 2] - pos[i3 + 2]) * speed
      }
      this.geometry.attributes.position.needsUpdate = true
    }

    // большой тенге
    if (this.tengeSprite) {
      if (this.phase === 3) {
        const t = Math.min((now - this.phaseStart) / this.PHASE_DURATION[3], 1)
        const ease = t * t
        this.tengeSprite.material.opacity += (1 - this.tengeSprite.material.opacity) * 0.08
        this.tengeSprite.position.y = 25 - ease * 25
        this.tengeSprite.scale.setScalar(4.5 - ease * 1.2)
      } else if (this.phase > 3) {
        this.tengeSprite.position.y = Math.sin(now * 0.001) * 0.4
      }
    }

    // дождь монет — ТОЛЬКО в финале
    if (this.mapReady && this.phase >= 4) {
      if (now - this.lastCoinSpawn > 220) { this.spawnCoin(); this.lastCoinSpawn = now }
      this.updateCoins()
      this.updateTrail()
    }

    this.particles.rotation.y = (this.phase >= 2) ? Math.sin(now * 0.0002) * 0.1 : 0

    this.composer.render()
  }

  // =====================
  // RESIZE
  // =====================
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.composer.setSize(window.innerWidth, window.innerHeight)
  }

  // =====================
  // ЗАПУСК
  // =====================
  start() {
    this.phaseStart = performance.now()
    this.loadSVG()
    this.animate()
  }

  // =====================
  // ПОЛНАЯ ОЧИСТКА
  // =====================
  dispose() {
    this.disposed = true

    // отмена цикла анимации
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // снятие слушателей
    window.removeEventListener('resize', this._onResize)

    // монеты: материалы + общая текстура
    for (const c of this.coins) {
      if (c.material) c.material.dispose()
      this.scene.remove(c)
    }
    this.coins = []
    if (this.coinTexture) { this.coinTexture.dispose(); this.coinTexture = null }

    // большой тенге: текстура + материал
    if (this.tengeSprite) {
      if (this.tengeSprite.material.map) this.tengeSprite.material.map.dispose()
      this.tengeSprite.material.dispose()
      this.scene.remove(this.tengeSprite)
      this.tengeSprite = null
    }

    // геометрии
    this.geometry.dispose()
    this.bgGeo.dispose()
    this.trailGeo.dispose()

    // материалы
    this.material.dispose()
    this.bgMat.dispose()
    this.trailMat.dispose()

    // postprocessing
    if (this.bloomPass && this.bloomPass.dispose) this.bloomPass.dispose()
    if (this.composer && this.composer.dispose) this.composer.dispose()

    // renderer + canvas
    this.renderer.dispose()
    const canvas = this.renderer.domElement
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas)

    // очистка ссылок сцены
    if (this.scene) this.scene.clear()
  }
}
