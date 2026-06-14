import './style.css'
import * as THREE from 'three'

import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// =====================
// SCENE / CAMERA / RENDERER
// =====================
const scene = new THREE.Scene()
scene.background = new THREE.Color('#000000')

const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
)
camera.position.z = 25

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// =====================
// BLOOM
// =====================
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.9, 0.6, 0.2
)
composer.addPass(bloomPass)

// =====================
// КОНСТАНТЫ
// =====================
const particleCount = 4000
const GOLD = new THREE.Color('#FFD700')

const worldWidth = 30
let svgScale = 1
let svgCenter = { x: 500, y: 274 }
let mapBBox = null
let mapReady = false

// =====================
// ФОНОВАЯ СЕТЬ ТОЧЕК (дрейф + мерцание)
// =====================
const bgCount = 600
const bgPositions = new Float32Array(bgCount * 3)
const bgPhase = new Float32Array(bgCount)
for (let i = 0; i < bgCount; i++) {
  bgPositions[i * 3]     = (Math.random() - 0.5) * 90
  bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 60
  bgPositions[i * 3 + 2] = -20 - Math.random() * 30
  bgPhase[i] = Math.random() * Math.PI * 2
}
const bgGeo = new THREE.BufferGeometry()
bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3))
const bgMat = new THREE.PointsMaterial({
  color: 0x8899bb, size: 0.12, transparent: true, opacity: 0.5, depthWrite: false
})
const bgPoints = new THREE.Points(bgGeo, bgMat)
scene.add(bgPoints)

// =====================
// БУФЕРЫ ОСНОВНЫХ ЧАСТИЦ
// =====================
const positions      = new Float32Array(particleCount * 3)
const targetOrigin   = new Float32Array(particleCount * 3) // искра в центре
const targetExplode  = new Float32Array(particleCount * 3) // облако-взрыв
const targetMap      = new Float32Array(particleCount * 3) // карта

for (let i = 0; i < particleCount; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * 0.05
  positions[i * 3 + 1] = (Math.random() - 0.5) * 0.05
  positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05

  // origin — крошечное плотное ядро (медленное свечение)
  const a1 = Math.random() * Math.PI * 2
  const r1 = Math.pow(Math.random(), 0.8) * 0.5
  targetOrigin[i * 3]     = Math.cos(a1) * r1
  targetOrigin[i * 3 + 1] = Math.sin(a1) * r1
  targetOrigin[i * 3 + 2] = (Math.random() - 0.5) * 0.3

  // explode — широкое сферическое облако (взрыв)
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const r2 = 14 + Math.random() * 6
  targetExplode[i * 3]     = r2 * Math.sin(phi) * Math.cos(theta)
  targetExplode[i * 3 + 1] = r2 * Math.sin(phi) * Math.sin(theta) * 0.6
  targetExplode[i * 3 + 2] = r2 * Math.cos(phi) * 0.4
}

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const material = new THREE.PointsMaterial({
  color: GOLD, size: 0.02, transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
})

const particles = new THREE.Points(geometry, material)
scene.add(particles)

// =====================
// БОЛЬШОЙ ТЕНГЕ
// =====================
let tengeSprite = null
function makeTengeSprite() {
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
  scene.add(sprite)
  return sprite
}

// =====================
// КРУГЛЫЕ МОНЕТЫ ₸
// =====================
let coinTexture = null
function makeCoinTexture() {
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

const coins = []
const COIN_POOL = 70
function initCoins() {
  coinTexture = makeCoinTexture()
  for (let i = 0; i < COIN_POOL; i++) {
    const mat = new THREE.SpriteMaterial({
      map: coinTexture, transparent: true,
      blending: THREE.NormalBlending, depthWrite: false, opacity: 0.95
    })
    const s = new THREE.Sprite(mat)
    s.scale.set(0.7, 0.7, 1)
    s.position.z = -3
    s.visible = false
    s.userData = { active: false }
    scene.add(s)
    coins.push(s)
  }
}

let lastCoinSpawn = 0
function spawnCoin() {
  const free = coins.find((c) => !c.userData.active)
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

function updateCoins() {
  for (const c of coins) {
    if (!c.userData.active) continue
    c.position.y -= c.userData.vy          // прямое падение
    c.material.rotation += c.userData.spin
    spawnTrail(c.position.x, c.position.y) // кометный след
    if (c.position.y < -28) { c.userData.active = false; c.visible = false }
  }
}

// =====================
// КОМЕТНЫЙ ХВОСТ МОНЕТ (затухающие точки)
// =====================
const TRAIL_MAX = 1200
const trailPos = new Float32Array(TRAIL_MAX * 3)
const trailAlpha = new Float32Array(TRAIL_MAX)
let trailHead = 0

const trailGeo = new THREE.BufferGeometry()
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAlpha, 1))

const trailMat = new THREE.ShaderMaterial({
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
const trailPoints = new THREE.Points(trailGeo, trailMat)
trailPoints.position.z = -3
scene.add(trailPoints)

function spawnTrail(x, y) {
  trailPos[trailHead * 3]     = x
  trailPos[trailHead * 3 + 1] = y
  trailPos[trailHead * 3 + 2] = 0
  trailAlpha[trailHead] = 1.0
  trailHead = (trailHead + 1) % TRAIL_MAX
}

function updateTrail() {
  for (let i = 0; i < TRAIL_MAX; i++) {
    if (trailAlpha[i] > 0) trailAlpha[i] -= 0.02
  }
  trailGeo.attributes.position.needsUpdate = true
  trailGeo.attributes.alpha.needsUpdate = true
}

// =====================
// ХЕЛПЕРЫ
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

function svgToWorld(x, y) {
  return { x: (x - svgCenter.x) * svgScale, y: -(y - svgCenter.y) * svgScale }
}

// =====================
// ЗАГРУЗКА SVG
// =====================
const loader = new SVGLoader()

loader.load('/kz.svg', (data) => {
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

  svgCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  svgScale = worldWidth / (maxX - minX)

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
    const p = filled[Math.floor(Math.random() * filled.length)] || { x: svgCenter.x, y: svgCenter.y }
    const w = svgToWorld(p.x, p.y)
    targetMap[i * 3]     = w.x
    targetMap[i * 3 + 1] = w.y
    targetMap[i * 3 + 2] = 0
  }

  const c1 = svgToWorld(minX, minY)
  const c2 = svgToWorld(maxX, maxY)
  mapBBox = { minX: Math.min(c1.x, c2.x), maxX: Math.max(c1.x, c2.x) }

  tengeSprite = makeTengeSprite()
  initCoins()
  mapReady = true

  startTimeline()
})

// =====================
// TIMELINE / ФАЗЫ
// =====================
// 0: свечение искры  1: взрыв-облако  2: сборка карты  3: тенге  4: финал (тексты + дождь)
let phase = 0
let phaseStart = performance.now()
let currentTarget = targetOrigin
let lerpSpeed = 0.04

const PHASE_DURATION = { 0: 2200, 1: 1600, 2: 3000, 3: 1800, 4: 99999 }

function startTimeline() {
  phase = 0
  phaseStart = performance.now()
  currentTarget = targetOrigin
}

function nextPhase() {
  phase++
  phaseStart = performance.now()
  if (phase === 1) { currentTarget = targetExplode; lerpSpeed = 0.06 }
  if (phase === 2) { currentTarget = targetMap;     lerpSpeed = 0.035 }
  if (phase === 4) { showTexts() }
}

function showTexts() {
  const overlay = document.getElementById('intro-texts')
  if (overlay) overlay.classList.add('visible')
}

// =====================
// ANIMATION LOOP
// =====================
function animate() {
  requestAnimationFrame(animate)
  const now = performance.now()
  const pos = geometry.attributes.position.array

  // фон
  bgMat.opacity = 0.4 + Math.sin(now * 0.0008) * 0.12
  bgPoints.rotation.z = Math.sin(now * 0.00005) * 0.05
  const bgArr = bgGeo.attributes.position.array
  for (let i = 0; i < bgCount; i++) {
    bgArr[i * 3 + 1] += Math.sin(now * 0.0003 + bgPhase[i]) * 0.002
  }
  bgGeo.attributes.position.needsUpdate = true

  // яркость/размер частиц по фазам
  if (phase === 0) {
    const t = Math.min((now - phaseStart) / PHASE_DURATION[0], 1)
    material.opacity += (Math.min(t * 1.1, 0.95) - material.opacity) * 0.04
    material.size    += (0.04 - material.size) * 0.04
  } else if (phase === 1) {
    material.size += (0.03 - material.size) * 0.05
    material.opacity += (0.85 - material.opacity) * 0.05
  } else {
    material.opacity += (0.9 - material.opacity) * 0.04
    material.size    += (0.045 - material.size) * 0.04
  }

  if (now - phaseStart > PHASE_DURATION[phase] && phase < 4) nextPhase()

  // лерп частиц (фаза 0 — медленное свечение)
  if (currentTarget) {
    const speed = (phase === 0) ? 0.015 : lerpSpeed
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      pos[i3]     += (currentTarget[i3]     - pos[i3])     * speed
      pos[i3 + 1] += (currentTarget[i3 + 1] - pos[i3 + 1]) * speed
      pos[i3 + 2] += (currentTarget[i3 + 2] - pos[i3 + 2]) * speed
    }
    geometry.attributes.position.needsUpdate = true
  }

  // большой тенге
  if (tengeSprite) {
    if (phase === 3) {
      const t = Math.min((now - phaseStart) / PHASE_DURATION[3], 1)
      const ease = t * t
      tengeSprite.material.opacity += (1 - tengeSprite.material.opacity) * 0.08
      tengeSprite.position.y = 25 - ease * 25
      tengeSprite.scale.setScalar(4.5 - ease * 1.2)
    } else if (phase > 3) {
      tengeSprite.position.y = Math.sin(now * 0.001) * 0.4
    }
  }

  // дождь монет — ТОЛЬКО в финале
  if (mapReady && phase >= 4) {
    if (now - lastCoinSpawn > 220) { spawnCoin(); lastCoinSpawn = now }
    updateCoins()
    updateTrail()
  }

  particles.rotation.y = (phase >= 2) ? Math.sin(now * 0.0002) * 0.1 : 0

  composer.render()
}

animate()

// =====================
// RESIZE
// =====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})