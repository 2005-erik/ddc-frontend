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
const GLYPH_POOL = 70
const GLYPH_TYPES = ['tenge', 'lock', 'node', 'chip']
const TRAIL_COLOR = '#9DB8E0' // холодный серебристо-голубой хвост (под цвет глифов)
const TRAIL_MAX = 1200

// =====================
// ПАЛИТРА ПО СЕКЦИЯМ (Шаг 3 — цвет частиц карты плавно меняется при скролле)
// Благородные тона в теме сайта. Цвета-объекты создаём один раз.
// =====================
const SECTION_COLORS = {
  hero:     new THREE.Color('#FFD700'), // тёплое золото
  news:     new THREE.Color('#FFD700'), // тёплое золото
  about:    new THREE.Color('#E8C547'), // янтарь/шампань
  stats:    new THREE.Color('#3B6FD4'), // глубокий синий НБК
  services: new THREE.Color('#5B8FD9'), // холодный стальной синий
  projects: new THREE.Color('#2EB8A8'), // бирюзовый/teal
  mission:  new THREE.Color('#FFCB30'), // насыщенное яркое золото
  consult:  new THREE.Color('#C9B98A'), // приглушённый золотисто-серый
  contacts: new THREE.Color('#C9B98A'), // приглушённый золотисто-серый
}

// База bloom = 0.9 (см. конструктор UnrealBloomPass). Чуть ярче на mission,
// спокойнее на consult/contacts; остальные секции — база.
const BLOOM_BASE = 0.9
const SECTION_BLOOM = {
  mission:  1.3,
  consult:  0.6,
  contacts: 0.6,
}

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
  constructor(container, options = {}) {
    this.container = container

    // колбэк, вызывается при входе в новую фазу (передаётся номер фазы)
    this.onPhaseComplete = options.onPhaseComplete || null

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

    // падающие глифы / хвост
    this.glyphs = []
    this.glyphTextures = []
    this.tengeSprite = null
    this.lastGlyphSpawn = 0

    // служебное
    this.rafId = null
    this.disposed = false

    // прогресс скролла страницы (0 = верх, 1 = низ) и активная секция —
    // инфраструктура для будущих scroll-анимаций (пока без визуальных эффектов)
    this.scrollProgress = 0
    this.activeSection = null

    // Шаг 3: цель плавной интерполяции цвета частиц и силы bloom (см. animate).
    // Стартуем с золота — совпадает с исходным цветом частиц, интро не меняется.
    this.targetColor = GOLD.clone()
    this.targetBloom = BLOOM_BASE

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
      color: 0x8899bb, size: 0.14, transparent: true, opacity: 0.5, depthWrite: false
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

    this.mapMaterial = new THREE.PointsMaterial({
      color: GOLD, size: 0.02, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })

    this.mapParticles = new THREE.Points(this.geometry, this.mapMaterial)
    this.scene.add(this.mapParticles)

    // изначальная цель — ядро (как в исходнике до загрузки SVG)
    this.currentTarget = this.targetOrigin

    // Шаг 4: целевые позиции форм по секциям (грид / решётка / граф / стрела).
    // targetMap заполнится при загрузке SVG, ссылка стабильна.
    this.buildSectionShapes()
    this.sectionTargets = {
      hero: this.targetMap,
      news: this.targetMap,
      about: this.targetMap,
      stats: this.targetGrid,
      services: this.targetLattice,
      projects: this.targetGraph,
      mission: this.targetArrow,
      consult: this.targetMap,
      contacts: this.targetMap,
    }
    // имена форм — только для отладочного лога
    this._shapeName = new Map([
      [this.targetMap, 'map'],
      [this.targetGrid, 'grid'],
      [this.targetLattice, 'lattice'],
      [this.targetGraph, 'graph'],
      [this.targetArrow, 'arrow'],
    ])

    // =====================
    // КОМЕТНЫЙ ХВОСТ ГЛИФОВ (затухающие точки)
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
      uniforms: { uColor: { value: new THREE.Color(TRAIL_COLOR) } },
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
  // ГЛИФЫ (серебристо-голубые, 4 типа)
  // =====================
  makeGlyphTexture(type) {
    // Высокое разрешение (512) + рисование в координатах 256 (scale 2×) → резкие края.
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const ctx = c.getContext('2d')
    ctx.scale(2, 2)

    // Рецепт чёткости как у центрального тенге: тёмное «тело» почти не светится
    // в bloom и не расплывается в кляксу, а ЧЁТКИЙ серебристо-голубой контур
    // задаёт ясную форму. Цвет — серебристо-голубой, как и раньше.
    const fill = 'rgba(18, 28, 52, 0.55)' // тёмное тело (низкая яркость → меньше bloom)
    const stroke = '#C3D6F2'              // светлый серебристо-голубой контур
    const dark = '#0C1526'                // тёмные «вырезы»
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    if (type === 'tenge') {
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 10
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 185px Georgia, serif'
      ctx.fillText('₸', 128, 134)
      ctx.strokeText('₸', 128, 134)
    } else if (type === 'lock') {
      // дужка замка
      ctx.strokeStyle = stroke
      ctx.lineWidth = 16
      ctx.beginPath(); ctx.arc(128, 104, 34, Math.PI, Math.PI * 2); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(94, 104); ctx.lineTo(94, 122)
      ctx.moveTo(162, 104); ctx.lineTo(162, 122)
      ctx.stroke()
      // тело замка
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 8
      ctx.beginPath(); ctx.roundRect(70, 118, 116, 84, 16); ctx.fill(); ctx.stroke()
      // замочная скважина
      ctx.fillStyle = dark
      ctx.beginPath(); ctx.arc(128, 150, 12, 0, Math.PI * 2); ctx.fill()
      ctx.fillRect(123, 152, 10, 30)
    } else if (type === 'node') {
      // граф: центральный узел + 4 спутника с линиями
      const cx = 128, cy = 128, R = 76
      const sats = []
      for (let k = 0; k < 4; k++) {
        const a = -Math.PI / 2 + k * (Math.PI / 2) + 0.5
        sats.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R })
      }
      ctx.strokeStyle = stroke
      ctx.lineWidth = 7
      sats.forEach((s) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(s.x, s.y); ctx.stroke() })
      ctx.fillStyle = fill
      sats.forEach((s) => {
        ctx.beginPath(); ctx.arc(s.x, s.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      })
      ctx.lineWidth = 6
      ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    } else if (type === 'chip') {
      // микрочип (IC): КВАДРАТНЫЙ корпус с ножками по всем сторонам + ядро.
      // Углы почти прямые (радиус 4), чтобы не читался как кружка.
      const pins = [100, 128, 156]
      ctx.strokeStyle = stroke
      ctx.lineCap = 'round'
      ctx.lineWidth = 10
      pins.forEach((p) => {
        ctx.beginPath(); ctx.moveTo(p, 84); ctx.lineTo(p, 58); ctx.stroke()   // верх
        ctx.beginPath(); ctx.moveTo(p, 172); ctx.lineTo(p, 198); ctx.stroke() // низ
        ctx.beginPath(); ctx.moveTo(84, p); ctx.lineTo(58, p); ctx.stroke()   // лево
        ctx.beginPath(); ctx.moveTo(172, p); ctx.lineTo(198, p); ctx.stroke() // право
      })
      // корпус — квадрат со слегка скруглёнными углами
      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 9
      ctx.beginPath(); ctx.roundRect(84, 84, 88, 88, 4); ctx.fill(); ctx.stroke()
      // внутреннее ядро (квадрат)
      ctx.lineWidth = 6
      ctx.beginPath(); ctx.roundRect(110, 110, 36, 36, 3); ctx.stroke()
      // точка-ключ (pin 1) в углу — характерный признак микросхемы
      ctx.fillStyle = stroke
      ctx.beginPath(); ctx.arc(99, 99, 5, 0, Math.PI * 2); ctx.fill()
    }

    return new THREE.CanvasTexture(c)
  }

  // =====================
  // ФОРМЫ ЧАСТИЦ ПО СЕКЦИЯМ (Шаг 4) — математические наборы целевых позиций.
  // Масштаб согласован с картой (ширина ~worldWidth=30 → x≈±15, y≈±8), z около 0.
  // Те же particleCount частиц переиспользуются — просто новые цели для lerp.
  // =====================
  buildSectionShapes() {
    const N = particleCount
    this.targetGrid = new Float32Array(N * 3)
    this.targetLattice = new Float32Array(N * 3)
    this.targetGraph = new Float32Array(N * 3)
    this.targetArrow = new Float32Array(N * 3)

    // ── stats: крупная сетка-мешь (точки вдоль линий грида) ──
    {
      const cols = 8, rows = 5, W = 26, H = 15
      const x0 = -W / 2, y0 = -H / 2
      for (let i = 0; i < N; i++) {
        let x, y
        if (i % 2 === 0) {
          // вертикальные линии: фикс. колонка, произвольный y
          const c = (Math.random() * (cols + 1)) | 0
          x = x0 + (c / cols) * W
          y = y0 + Math.random() * H
        } else {
          // горизонтальные линии: фикс. ряд, произвольный x
          const r = (Math.random() * (rows + 1)) | 0
          y = y0 + (r / rows) * H
          x = x0 + Math.random() * W
        }
        this.targetGrid[i * 3] = x
        this.targetGrid[i * 3 + 1] = y
        this.targetGrid[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      }
    }

    // ── services: равномерная матрица side×side ──
    {
      const side = Math.floor(Math.sqrt(N)) // ≈63
      const W = 24, H = 16
      for (let i = 0; i < N; i++) {
        const gx = i % side
        const gy = Math.min((i / side) | 0, side - 1)
        this.targetLattice[i * 3] = -W / 2 + (gx / (side - 1)) * W
        this.targetLattice[i * 3 + 1] = -H / 2 + (gy / (side - 1)) * H
        this.targetLattice[i * 3 + 2] = 0
      }
    }

    // ── projects: граф — кластеры-узлы, соединённые рёбрами ──
    {
      const nodes = [
        { x: -10, y: 5 }, { x: 9, y: 6 }, { x: 0, y: 0 },
        { x: -8, y: -6 }, { x: 10, y: -4 },
      ]
      const edges = [[0, 2], [1, 2], [3, 2], [4, 2], [0, 3], [1, 4]]
      for (let i = 0; i < N; i++) {
        let x, y
        if (i % 3 === 0) {
          // точка на ребре
          const e = edges[(Math.random() * edges.length) | 0]
          const a = nodes[e[0]], b = nodes[e[1]], t = Math.random()
          x = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 0.4
          y = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 0.4
        } else {
          // точка в кластере вокруг узла
          const nd = nodes[(Math.random() * nodes.length) | 0]
          const ang = Math.random() * Math.PI * 2
          const r = Math.pow(Math.random(), 0.6) * 2.0
          x = nd.x + Math.cos(ang) * r
          y = nd.y + Math.sin(ang) * r
        }
        this.targetGraph[i * 3] = x
        this.targetGraph[i * 3 + 1] = y
        this.targetGraph[i * 3 + 2] = (Math.random() - 0.5) * 0.6
      }
    }

    // ── mission: восходящая стрела (вектор роста) ──
    {
      const topY = 8, botY = -8, headY = 3, headW = 5.5
      for (let i = 0; i < N; i++) {
        let x, y
        const r = Math.random()
        if (r < 0.55) {
          // шахта (вертикаль)
          x = (Math.random() - 0.5) * 0.7
          y = botY + Math.random() * (topY - botY)
        } else if (r < 0.775) {
          // левое перо наконечника: вершина (0,topY) → (-headW, headY)
          const t = Math.random()
          x = -headW * t + (Math.random() - 0.5) * 0.5
          y = topY + (headY - topY) * t
        } else {
          // правое перо: вершина (0,topY) → (headW, headY)
          const t = Math.random()
          x = headW * t + (Math.random() - 0.5) * 0.5
          y = topY + (headY - topY) * t
        }
        this.targetArrow[i * 3] = x
        this.targetArrow[i * 3 + 1] = y
        this.targetArrow[i * 3 + 2] = (Math.random() - 0.5) * 0.5
      }
    }
  }

  initGlyphs() {
    // 4 текстуры создаём один раз
    this.glyphTextures = GLYPH_TYPES.map((t) => this.makeGlyphTexture(t))

    for (let i = 0; i < GLYPH_POOL; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.glyphTextures[0], transparent: true,
        blending: THREE.NormalBlending, depthWrite: false, opacity: 0.95
      })
      const s = new THREE.Sprite(mat)
      s.scale.set(1.65, 1.65, 1) // средний размер: символ ясно читается, но не громоздкий
      s.position.z = -3
      s.visible = false
      s.userData = { active: false }
      this.scene.add(s)
      this.glyphs.push(s)
    }
  }

  spawnGlyph() {
    const free = this.glyphs.find((g) => !g.userData.active)
    if (!free) return

    // случайный глиф из четырёх для каждого нового объекта
    const tex = this.glyphTextures[(Math.random() * this.glyphTextures.length) | 0]
    free.material.map = tex
    free.material.needsUpdate = true

    // по всей ширине — глубина (z=-3) спрячет глифы за картой
    const x = (Math.random() - 0.5) * 80

    free.position.set(x, 20 + Math.random() * 4, -3)
    free.userData.active = true
    free.userData.vy = 0.04 + Math.random() * 0.02     // равномерно, без ускорения
    free.userData.spin = (Math.random() - 0.5) * 0.015
    free.material.opacity = 0.95
    free.visible = true
  }

  updateGlyphs() {
    for (const g of this.glyphs) {
      if (!g.userData.active) continue
      g.position.y -= g.userData.vy          // прямое падение
      g.material.rotation += g.userData.spin
      this.spawnTrail(g.position.x, g.position.y) // кометный след
      if (g.position.y < -28) { g.userData.active = false; g.visible = false }
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
      this.initGlyphs()
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

    // уведомить подписчика о смене фазы (в т.ч. о финальной фазе 4 — за тексты отвечает React)
    if (this.onPhaseComplete) this.onPhaseComplete(this.phase)
  }

  // =====================
  // ANIMATION LOOP
  // =====================
  animate() {
    if (this.disposed) return
    this.rafId = requestAnimationFrame(this._animate)
    const now = performance.now()
    const pos = this.geometry.attributes.position.array

    // фон (чуть плотнее — живой цветной фон должен читаться во всех секциях)
    this.bgMat.opacity = 0.5 + Math.sin(now * 0.0008) * 0.12
    this.bgPoints.rotation.z = Math.sin(now * 0.00005) * 0.05
    const bgArr = this.bgGeo.attributes.position.array
    for (let i = 0; i < bgCount; i++) {
      bgArr[i * 3 + 1] += Math.sin(now * 0.0003 + this.bgPhase[i]) * 0.002
    }
    this.bgGeo.attributes.position.needsUpdate = true

    // яркость/размер частиц по фазам
    if (this.phase === 0) {
      const t = Math.min((now - this.phaseStart) / this.PHASE_DURATION[0], 1)
      this.mapMaterial.opacity += (Math.min(t * 1.1, 0.95) - this.mapMaterial.opacity) * 0.04
      this.mapMaterial.size    += (0.04 - this.mapMaterial.size) * 0.04
    } else if (this.phase === 1) {
      this.mapMaterial.size += (0.03 - this.mapMaterial.size) * 0.05
      this.mapMaterial.opacity += (0.85 - this.mapMaterial.opacity) * 0.05
    } else {
      this.mapMaterial.opacity += (0.95 - this.mapMaterial.opacity) * 0.04
      this.mapMaterial.size    += (0.052 - this.mapMaterial.size) * 0.04
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

    // дождь глифов — ТОЛЬКО в финале
    if (this.mapReady && this.phase >= 4) {
      if (now - this.lastGlyphSpawn > 220) { this.spawnGlyph(); this.lastGlyphSpawn = now }
      this.updateGlyphs()
      this.updateTrail()
    }

    this.mapParticles.rotation.y = (this.phase >= 2) ? Math.sin(now * 0.0002) * 0.1 : 0

    // камера реагирует на скролл ТОЛЬКО после завершения интро (финальная фаза)
    if (this.phase >= 4) {
      const t = this.scrollProgress                 // 0 (верх) … 1 (низ)
      const targetZ = 25 - t * 9                     // наезд: Z 25 → 16 (эффект погружения)
      const targetY = -t * 2                         // камера лениво опускается: 0 → -2
      // мягкий lerp — движение сглажено, даже если скроллят рывками
      this.camera.position.z += (targetZ - this.camera.position.z) * 0.05
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05
    }

    // Шаг 3: интерполяция цвета ИМЕННО частиц-карты Казахстана (mapParticles /
    // mapMaterial — облако точек по targetMap) к цвету активной секции.
    // Коэффициент 0.05 → переход плавный, но успевает смениться при обычном скролле.
    // До скролла цель — золото (= исходный цвет), интро/камера не затрагиваются.
    this.mapMaterial.color.lerp(this.targetColor, 0.05)
    this.bloomPass.strength += (this.targetBloom - this.bloomPass.strength) * 0.05

    this.composer.render()
  }

  // =====================
  // SCROLL-АНИМАЦИИ (камера + тема секции)
  // =====================
  // t — прогресс скролла страницы, 0 (верх) … 1 (низ)
  setScrollProgress(t) {
    this.scrollProgress = t
  }

  // id активной секции (news/about/stats/services/projects/mission/consult/contacts)
  // → выставляем цель для плавной смены цвета частиц и силы bloom (лерп в animate).
  setActiveSection(id) {
    this.activeSection = id
    const color = SECTION_COLORS[id]
    if (color) this.targetColor.copy(color)
    this.targetBloom = SECTION_BLOOM[id] ?? BLOOM_BASE

    // Шаг 4: после интро (фаза 4) частицы карты перетекают в форму секции.
    // До конца интро форму НЕ трогаем — ею управляет таймлайн (ядро→взрыв→карта).
    let shape = '—'
    if (this.phase >= 4 && this.sectionTargets && this.sectionTargets[id]) {
      this.currentTarget = this.sectionTargets[id]
      this.lerpSpeed = 0.03 // мягкое перетекание формы
      shape = this._shapeName.get(this.currentTarget) || '?'
    }

    // ВРЕМЕННО (отладка Шагов 3–4): секция, целевой цвет и форма частиц-карты.
    console.log(
      '[scene] section →', id,
      '| shape:', shape,
      '| target #' + this.targetColor.getHexString(),
      '| applies to:', this.mapParticles?.type, '/', this.mapMaterial?.type,
    )
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
    this.onPhaseComplete = null

    // отмена цикла анимации
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // снятие слушателей
    window.removeEventListener('resize', this._onResize)

    // глифы: материалы + общие текстуры
    for (const g of this.glyphs) {
      if (g.material) g.material.dispose()
      this.scene.remove(g)
    }
    this.glyphs = []
    for (const tex of this.glyphTextures) tex.dispose()
    this.glyphTextures = []

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
    this.mapMaterial.dispose()
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
