import { useState, useEffect, useRef } from 'react'

// Single-page: ссылки ведут к секциям на главной (плавный скролл, без смены URL).
// id: null — скролл наверх (Hero).
const navLinks = [
  { id: null, label: 'Главная' },
  { id: 'about', label: 'О нас' },
  { id: 'services', label: 'Услуги' },
  { id: 'mission', label: 'Миссия' },
  { id: 'consult', label: 'Консультация' },
  { id: 'contacts', label: 'Контакты' },
]

const languages = ['KZ', 'RU', 'EN']

// TODO: заменить на реальный URL портала закупок НБРК
const PROCUREMENT_URL = '#'

// Пилюля-подложка: заметный контур при наведении, залитая золотом — для активного пункта
function navClass(isActive) {
  return `rounded-full border px-3 py-1.5 text-sm tracking-wide transition-colors ${
    isActive
      ? 'border-nbk-gold/50 bg-nbk-gold/15 text-nbk-gold'
      : 'border-transparent text-white/85 hover:border-nbk-gold/40 hover:bg-white/10 hover:text-nbk-gold'
  }`
}

function scrollToId(id) {
  if (!id) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Выпадающий список языков (заглушка: меняет только отображение)
function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // клик вне списка закрывает его
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg border border-white/15 bg-ink/30 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/85 backdrop-blur-sm transition-colors hover:border-nbk-gold/40 hover:text-nbk-gold"
      >
        {lang}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-10 mt-1 w-20 overflow-hidden rounded-lg border border-white/15 bg-ink/95 shadow-lg backdrop-blur-md"
        >
          {languages.map((code) => (
            <li key={code} role="option" aria-selected={lang === code}>
              <button
                type="button"
                onClick={() => {
                  setLang(code)
                  setOpen(false)
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs font-medium tracking-wide transition-colors ${
                  lang === code
                    ? 'bg-ddc-blue text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-nbk-gold'
                }`}
              >
                {code}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
        {/* Логотип: крупная золотая аббревиатура DDC + приглушённая подпись в две строки */}
        <button
          type="button"
          onClick={() => handleNav(null)}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <span className="font-mono text-2xl font-extrabold tracking-tight text-nbk-gold transition-colors group-hover:text-nbk-gold-soft sm:text-3xl">
            DDC
          </span>
          <span className="hidden flex-col text-left leading-tight sm:flex">
            <span className="text-[11px] font-medium tracking-wide text-white/70">
              Digital Development Center
            </span>
            <span className="text-[10px] tracking-wide text-white/40">
              National Bank of Kazakhstan
            </span>
          </span>
        </button>

        {/* Навигация (десктоп / средний экран) */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
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
          <LangDropdown lang={lang} setLang={setLang} />
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
          <nav className="mx-auto flex max-w-7xl flex-col items-start gap-2 px-6 py-5">
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
            <div className="flex w-full items-center justify-between gap-4 pt-3">
              <LangDropdown lang={lang} setLang={setLang} />
              {ProcurementBtn}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
