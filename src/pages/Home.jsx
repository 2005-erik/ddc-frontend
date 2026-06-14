import { useState, useCallback, useEffect, useRef } from 'react'
import IntroScene from '../components/IntroScene.jsx'
import NewsCarousel from '../components/NewsCarousel.jsx'
import ServicesSection from '../components/ServicesSection.jsx'
import StatsSection from '../components/StatsSection.jsx'
import AboutSection from '../components/AboutSection.jsx'
import MissionSection from '../components/MissionSection.jsx'
import ConsultSection from '../components/ConsultSection.jsx'
import { fetchNews } from '../api/news.js'

// Кнопки в Hero: плавный скролл к секциям (без перехода на новый URL)
const heroLinks = [
  { id: 'about', label: 'О нас' },
  { id: 'services', label: 'Услуги' },
  { id: 'projects', label: 'Проекты' },
]

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false)
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

  // индикатор скролла: прячем, как только пользователь начал скроллить
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

      {/* ===== HERO (прозрачный, частицы видны) ===== */}
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
          {heroLinks.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => scrollToId(l.id)}
              className="rounded-full border border-ddc-blue/60 px-5 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:border-nbk-gold hover:text-nbk-gold"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Индикатор скролла: пульсирующий шеврон, скрывается при скролле */}
        <button
          type="button"
          onClick={() => scrollToId('about')}
          aria-label="Прокрутить вниз"
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

      {/* ===== НОВОСТИ (первой после Hero) ===== */}
      <section
        id="news"
        className="relative z-10 scroll-mt-20 bg-black/80 backdrop-blur-sm"
      >
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

      {/* ===== О НАС ===== */}
      <AboutSection />

      {/* ===== СТАТИСТИКА ===== */}
      <StatsSection />

      {/* ===== УСЛУГИ ===== */}
      <ServicesSection />

      {/* ===== ПРОЕКТЫ ===== */}
      <section
        id="projects"
        className="relative z-10 scroll-mt-20 bg-black/80 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Проекты</h2>
              <p className="mt-1 text-sm text-white/50">
                Ключевые инициативы цифрового развития
              </p>
            </div>
            <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
          </div>
          <p className="max-w-3xl leading-relaxed text-white/70">
            Флагманский проект Центра — единый портал закупок Национального Банка,
            переведший закупочные процедуры регулятора в прозрачную цифровую среду.
            Параллельно развиваются системы обработки данных, информационной
            безопасности и сервисы пользовательской поддержки.
          </p>
        </div>
      </section>

      {/* ===== МИССИЯ ===== */}
      <MissionSection />

      {/* ===== КОНСУЛЬТАЦИЯ (форма обратной связи) ===== */}
      <ConsultSection />

      {/* ===== КОНТАКТЫ / ФУТЕР ===== */}
      <footer
        id="contacts"
        className="relative z-10 scroll-mt-20 border-t border-white/10 bg-ink/90 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Контакты</h2>
              <p className="mt-1 text-sm text-white/50">
                Свяжитесь с Центром цифрового развития
              </p>
            </div>
            <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
          </div>

          <div className="grid gap-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold tracking-wide text-nbk-gold">Контакт-центр</dt>
              <dd className="mt-1 text-white/70">1477 — круглосуточно</dd>
            </div>
            <div>
              <dt className="font-semibold tracking-wide text-nbk-gold">Расположение</dt>
              <dd className="mt-1 text-white/70">г. Алматы, Национальный Банк РК</dd>
            </div>
            <div>
              <dt className="font-semibold tracking-wide text-nbk-gold">Закупки</dt>
              <dd className="mt-1 text-white/70">Через единый портал закупок</dd>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/40">
            © {new Date().getFullYear()} Digital Development Center — National Bank
            of Kazakhstan
          </div>
        </div>
      </footer>
    </div>
  )
}
