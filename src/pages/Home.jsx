import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import IntroScene from '../components/IntroScene.jsx'

const links = [
  { to: '/about', label: 'О нас' },
  { to: '/services', label: 'Услуги' },
  { to: '/projects', label: 'Проекты' },
]

export default function Home() {
  const [introDone, setIntroDone] = useState(false)
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Фон: Three.js интро-сцена (fixed, на весь экран, z-0) */}
      <IntroScene onComplete={handleIntroDone} />

      {/* Лёгкий градиент к низу, чтобы текст читался поверх канваса (без перекрытия сцены) */}
      <div
        className="pointer-events-none fixed inset-0 z-[5] bg-gradient-to-b from-transparent via-transparent to-ink/70"
        aria-hidden="true"
      />

      {/* Hero-контент поверх сцены (z-10), без непрозрачного фона */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-end gap-8 px-6 pb-[12vh] text-center">
        <div
          className={`transition-all duration-1000 ease-out ${
            introDone ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          <h1 className="text-4xl font-bold tracking-wide text-nbk-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.45)] sm:text-5xl">
            Центр цифрового развития
          </h1>
          <p className="mt-3 text-lg text-white/80">
            Национальный Банк Казахстана
          </p>
        </div>

        <nav
          className={`flex flex-wrap items-center justify-center gap-4 transition-all delay-300 duration-1000 ease-out ${
            introDone ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full border border-ddc-blue/60 px-5 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:border-nbk-gold hover:text-nbk-gold"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
