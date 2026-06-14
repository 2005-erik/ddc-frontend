import { useState, useEffect } from 'react'

// Single-page: ссылки ведут к секциям на главной (плавный скролл, без смены URL).
// id: null — скролл наверх (Hero).
const navLinks = [
  { id: null, label: 'Главная' },
  { id: 'about', label: 'О нас' },
  { id: 'services', label: 'Услуги' },
  { id: 'mission', label: 'Миссия' },
  { id: 'contacts', label: 'Контакты' },
]

const languages = ['KZ', 'RU', 'EN']

// TODO: заменить на реальный URL портала закупок НБРК
const PROCUREMENT_URL = '#'

function navClass(isActive) {
  return `relative pb-1 text-sm tracking-wide transition-colors hover:text-nbk-gold ${
    isActive
      ? 'text-nbk-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-nbk-gold'
      : 'text-white/85'
  }`
}

function scrollToId(id) {
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Header() {
  const [lang, setLang] = useState('RU')
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState(null)

  // Scroll-spy: подсвечиваем секцию, ближайшую к верху вьюпорта
  useEffect(() => {
    const ids = navLinks.map((l) => l.id).filter(Boolean)
    const onScroll = () => {
      if (window.scrollY < 80) {
        setActive(null)
        return
      }
      let current = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (id) => {
    setMenuOpen(false)
    scrollToId(id)
  }

  const LangSwitcher = (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/15 bg-ink/30 p-0.5 backdrop-blur-sm">
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide transition-colors ${
            lang === code ? 'bg-ddc-blue text-white' : 'text-white/55 hover:text-white'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )

  const ProcurementBtn = (
    <a
      href={PROCUREMENT_URL}
      className="whitespace-nowrap rounded-lg bg-nbk-gold px-3 py-1.5 text-xs font-semibold tracking-wide text-ink shadow-[0_0_14px_rgba(255,215,0,0.2)] transition hover:bg-nbk-gold-soft"
    >
      Портал закупок
    </a>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        {/* Логотип — скролл наверх */}
        <button
          type="button"
          onClick={() => handleNav(null)}
          className="group flex flex-col items-start leading-tight"
        >
          <span className="whitespace-nowrap font-mono text-[11px] font-bold tracking-[0.14em] text-white transition-colors group-hover:text-nbk-gold sm:text-xs lg:text-sm">
            DIGITAL DEVELOPMENT CENTER
          </span>
          <span className="hidden whitespace-nowrap text-[9px] tracking-[0.1em] text-white/50 lg:block">
            National Bank of Kazakhstan
          </span>
        </button>

        {/* Навигация (десктоп / средний экран) */}
        <nav className="hidden items-center gap-5 md:flex lg:gap-7">
          {navLinks.map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => handleNav(l.id)}
              className={navClass(active === l.id)}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Языки + портал (десктоп / средний экран) */}
        <div className="hidden items-center gap-2 md:flex lg:gap-3">
          {LangSwitcher}
          {ProcurementBtn}
        </div>

        {/* Бургер (мобильный) */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md border border-white/15 md:hidden"
        >
          <span
            className={`h-0.5 w-5 bg-white transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
          />
          <span className={`h-0.5 w-5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span
            className={`h-0.5 w-5 bg-white transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Выпадающее меню (мобильный) */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-ink/70 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-5">
            {navLinks.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={() => handleNav(l.id)}
                className={navClass(active === l.id)}
              >
                {l.label}
              </button>
            ))}
            <div className="flex w-full items-center justify-between gap-4 pt-2">
              {LangSwitcher}
              {ProcurementBtn}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
