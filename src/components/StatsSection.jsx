import { useState, useEffect, useRef } from 'react'

// Крупные числа DDC. color — золото/синий поочерёдно.
const stats = [
  { value: 25, suffix: '+', label: 'лет опыта', color: 'text-nbk-gold' },
  { value: 50, suffix: '/24', label: 'систем в эксплуатации / мониторинге', color: 'text-ddc-blue-light' },
  { value: 2020, label: 'запуск портала закупок', color: 'text-nbk-gold' },
  { value: 1477, label: 'единая линия поддержки', color: 'text-ddc-blue-light' },
]

// Счётчик: прокручивается от 0 при попадании в зону видимости (IntersectionObserver)
function StatCounter({ value, suffix = '', duration = 1400 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || started.current) continue
          started.current = true
          const start = performance.now()
          const tick = (now) => {
            const t = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
            setDisplay(Math.round(value * eased))
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

export default function StatsSection() {
  return (
    <section
      id="stats"
      className="relative z-10 scroll-mt-20 border-y border-white/10 bg-ink/85 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className={`text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${s.color}`}
              >
                <StatCounter value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-2 text-xs text-white/50 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
