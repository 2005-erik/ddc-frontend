import { useState, useEffect } from 'react'

// Эффект пишущей машинки: фразы печатаются по буквам, держатся, плавно
// стираются, после паузы печатается следующая — по кругу. В конце мигающий «|».
//
// Один аккуратный таймер-цикл (без побочных эффектов внутри setState), поэтому
// нет дёрганья/дублей таймеров (в т.ч. при двойном маунте StrictMode).
//
// @param {string[]} phrases — фразы для циклической печати
// @param {number} [typeMs]  — задержка между буквами при печати
// @param {number} [eraseMs] — задержка между буквами при стирании
// @param {number} [holdMs]  — пауза на полной фразе перед стиранием
// @param {number} [gapMs]   — пауза перед печатью следующей фразы
export default function Typewriter({
  phrases,
  typeMs = 70,
  eraseMs = 35,
  holdMs = 3500,
  gapMs = 700,
  className = '',
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!phrases || phrases.length === 0) return

    let timer
    let cancelled = false
    let phraseIdx = 0
    let len = 0
    let phase = 'typing' // typing → holding → erasing → gap → typing…

    const tick = () => {
      if (cancelled) return
      const full = phrases[phraseIdx % phrases.length]

      if (phase === 'typing') {
        len += 1
        setText(full.slice(0, len))
        if (len >= full.length) {
          phase = 'holding'
          timer = setTimeout(tick, holdMs)
        } else {
          timer = setTimeout(tick, typeMs)
        }
      } else if (phase === 'holding') {
        phase = 'erasing'
        timer = setTimeout(tick, eraseMs)
      } else if (phase === 'erasing') {
        len -= 1
        setText(full.slice(0, Math.max(0, len)))
        if (len <= 0) {
          phase = 'gap'
          timer = setTimeout(tick, gapMs)
        } else {
          timer = setTimeout(tick, eraseMs)
        }
      } else {
        // gap → переходим к следующей фразе
        phraseIdx = (phraseIdx + 1) % phrases.length
        len = 0
        phase = 'typing'
        timer = setTimeout(tick, typeMs)
      }
    }

    timer = setTimeout(tick, typeMs)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phrases, typeMs, eraseMs, holdMs, gapMs])

  return (
    <span className={className} aria-live="polite">
      {text}
      <span className="ml-0.5 animate-pulse" aria-hidden="true">|</span>
    </span>
  )
}
