import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Главная', end: true },
  { to: '/about', label: 'О нас' },
  { to: '/services', label: 'Услуги' },
  { to: '/mission', label: 'Миссия' },
  { to: '/contacts', label: 'Контакты' },
]

const languages = ['KZ', 'RU', 'EN']

// TODO: заменить на реальный URL портала закупок НБРК
const PROCUREMENT_URL = '#'

function navClass({ isActive }) {
  return `relative pb-1 text-sm tracking-wide transition-colors hover:text-nbk-gold ${
    isActive
      ? 'text-nbk-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-nbk-gold'
      : 'text-white/85'
  }`
}

export default function Header() {
  const [lang, setLang] = useState('RU')
  const [menuOpen, setMenuOpen] = useState(false)

  const LangSwitcher = (
    <div className="flex items-center gap-1 rounded-full border border-white/15 bg-ink/30 p-0.5 backdrop-blur-sm">
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 text-xs font-medium tracking-wide transition-colors ${
            lang === code ? 'bg-ddc-blue text-white' : 'text-white/60 hover:text-white'
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
      className="rounded-full bg-nbk-gold px-4 py-2 text-xs font-semibold tracking-wide text-ink shadow-[0_0_18px_rgba(255,215,0,0.25)] transition hover:bg-nbk-gold-soft"
    >
      Портал закупок НБРК
    </a>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        {/* Логотип */}
        <Link to="/" className="group flex flex-col leading-tight" onClick={() => setMenuOpen(false)}>
          <span className="text-sm font-bold tracking-[0.18em] text-white transition-colors group-hover:text-nbk-gold sm:text-base">
            DIGITAL DEVELOPMENT CENTER
          </span>
          <span className="text-[10px] tracking-[0.12em] text-white/55 sm:text-xs">
            National Bank of Kazakhstan
          </span>
        </Link>

        {/* Навигация (десктоп) */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Языки + портал (десктоп) */}
        <div className="hidden items-center gap-4 lg:flex">
          {LangSwitcher}
          {ProcurementBtn}
        </div>

        {/* Бургер (мобильный) */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md border border-white/15 lg:hidden"
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
        <div className="border-t border-white/10 bg-ink/70 backdrop-blur-md lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className={navClass}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex items-center justify-between gap-4 pt-2">
              {LangSwitcher}
              {ProcurementBtn}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
