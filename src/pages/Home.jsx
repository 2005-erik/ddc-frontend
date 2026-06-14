import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import IntroScene from '../components/IntroScene.jsx'
import NewsCarousel from '../components/NewsCarousel.jsx'
import { fetchNews } from '../api/news.js'

const links = [
  { to: '/about', label: 'О нас' },
  { to: '/services', label: 'Услуги' },
  { to: '/projects', label: 'Проекты' },
]

export default function Home() {
  const [introDone, setIntroDone] = useState(false)
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

  // индикатор скролла: прячем, как только пользователь начал скроллить
  const newsRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToNews = () =>
    newsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  useEffect(() => {
    let active = true
    fetchNews()
      .then((data) => {
        if (active) setNews(data)
      })
      .catch((err) => console.error('Не удалось загрузить новости', err))
      .finally(() => {
        if (active) setNewsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="relative min-h-screen">
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

        {/* Индикатор скролла: пульсирующий шеврон, скрывается при скролле */}
        <button
          type="button"
          onClick={scrollToNews}
          aria-label="Прокрутить к новостям"
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 text-nbk-gold/60 transition-opacity duration-700 hover:text-nbk-gold ${
            introDone && !scrolled ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <svg
            className="h-7 w-7 animate-bounce"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </main>

      {/* Новости — затемнённая подложка отделяет секцию от анимации-частиц сверху */}
      <section ref={newsRef} className="relative z-10 bg-black/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Новости</h2>
              <p className="mt-1 text-sm text-white/50">
                Цифровое развитие финансового сектора Казахстана
              </p>
            </div>
            <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
          </div>

          {newsLoading ? (
            <p className="py-16 text-center text-white/50">Загрузка новостей…</p>
          ) : (
            <NewsCarousel items={news} />
          )}
        </div>
      </section>
    </div>
  )
}
