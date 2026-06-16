import { useEffect, useRef } from 'react'
import IntroSceneEngine from '../scenes/introScene.js'

/**
 * React-обёртка над Three.js-движком IntroScene.
 *
 * @param {() => void} [props.onComplete] - вызывается при входе сцены в финальную фазу (4).
 * @param {string} [props.className]
 */
// Секции страницы (сверху вниз) — для определения активной секции
const SECTION_IDS = [
  'hero',
  'news',
  'about',
  'stats',
  'services',
  'projects',
  'mission',
  'consult',
  'contacts',
]

export default function IntroScene({ onComplete, className }) {
  const containerRef = useRef(null)
  // держим актуальный колбэк в ref, чтобы не пересоздавать сцену при смене onComplete
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let engine = null
    try {
      engine = new IntroSceneEngine(container, {
        onPhaseComplete: (phase) => {
          if (phase === 4 && onCompleteRef.current) onCompleteRef.current()
        },
      })
      engine.start()
    } catch (err) {
      // напр. WebGL недоступен — не роняем дерево React, показываем контент без фона
      console.error('IntroScene: не удалось запустить сцену', err)
      if (onCompleteRef.current) onCompleteRef.current()
    }

    // ── Скролл → сцена: прогресс + активная секция (rAF-троттлинг) ──
    let rafId = null
    const computeProgress = () => {
      const max = document.body.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      return Math.min(1, Math.max(0, p))
    }
    // Активная секция = та, что пересекает вертикальную середину экрана.
    // Надёжнее, чем intersectionRatio: высокие секции тоже определяются верно.
    const computeActiveSection = () => {
      const mid = window.innerHeight / 2
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= mid && r.bottom >= mid) return id
      }
      return null
    }
    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (!engine) return
        engine.setScrollProgress(computeProgress())
        const sec = computeActiveSection()
        if (sec && sec !== engine.activeSection) engine.setActiveSection(sec)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // инициализация на текущей позиции

    // cleanup: полная очистка ресурсов (и при unmount, и при двойном маунте Strict Mode)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (engine) engine.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    />
  )
}
