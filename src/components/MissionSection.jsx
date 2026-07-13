import { Lightbulb, Eye, ShieldCheck, Boxes, Users } from 'lucide-react'

const values = [
  { icon: Lightbulb, label: 'Инновации' },
  { icon: Eye, label: 'Прозрачность' },
  { icon: ShieldCheck, label: 'Качество' },
  { icon: Boxes, label: 'Надёжность' },
  { icon: Users, label: 'Партнёрство' },
]

export default function MissionSection() {
  return (
    <section id="mission" className="relative z-10 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="plate-head">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Миссия</h2>
            <p className="mt-1 text-sm text-white/50">
              Технологическое лидерство и доверие в финансах
            </p>
          </div>
          <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
        </div>

        {/* Тезис миссии */}
        <p className="plate max-w-4xl p-6 text-2xl font-semibold leading-snug text-white sm:p-8 sm:text-3xl">
          Обеспечивать технологическое лидерство Национального Банка Казахстана,
          создавая передовые и безопасные цифровые решения для регулятора и его
          дочерних организаций — на уровне международных стандартов качества{' '}
          <span className="text-nbk-gold">ISO 9001</span>.
        </p>

        {/* Видение */}
        <div className="plate mt-12 max-w-3xl p-6 sm:p-8">
          <h3 className="text-sm font-bold tracking-[0.2em] text-nbk-gold">
            ВИДЕНИЕ
          </h3>
          <p className="mt-3 leading-relaxed text-white/70">
            Стать эталоном цифровой трансформации в финансовом секторе страны:
            выстраивать надёжные, прозрачные и эффективные процессы, которым
            доверяют, и задавать стандарт качества для всей отрасли.
          </p>
        </div>

        {/* Ценности */}
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {values.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="plate group flex flex-col items-center gap-3 px-4 py-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-nbk-gold/50 hover:shadow-[0_0_24px_rgba(255,187,52,0.15)]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-nbk-gold/30 bg-nbk-gold/10 text-nbk-gold transition-colors group-hover:bg-nbk-gold/20">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-white/85">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
