import { Cpu, Shield, Database, Headphones, BarChart, RefreshCw } from 'lucide-react'

// Шесть направлений DDC. Иконки — line-icon из lucide, золотые.
const services = [
  {
    icon: Cpu,
    title: 'Цифровизация',
    desc: 'Оператор портала закупок с более чем 25-летним опытом цифровизации процессов.',
  },
  {
    icon: Shield,
    title: 'Информационная безопасность',
    desc: 'Сопровождение и администрирование ИТ-систем, защита данных и инфраструктуры.',
  },
  {
    icon: Database,
    title: 'Технологический оператор данных',
    desc: 'Обработка, хранение и управление информацией финансового сектора.',
  },
  {
    icon: Headphones,
    title: 'Контакт-центр 1477',
    desc: 'Консультационная и техническая поддержка пользователей в режиме 24/7.',
  },
  {
    icon: BarChart,
    title: 'Финансовая отчётность',
    desc: 'Подготовка и сопровождение годовой финансовой отчётности.',
  },
  {
    icon: RefreshCw,
    title: 'Гарантированное качество',
    desc: 'Цифровая трансформация с управляемым качеством на каждом этапе.',
  },
]

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="relative z-10 scroll-mt-20 bg-black/80 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Услуги</h2>
            <p className="mt-1 text-sm text-white/50">
              Цифровые сервисы и решения для финансового сектора
            </p>
          </div>
          <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-nbk-gold/50 hover:shadow-[0_0_28px_rgba(255,215,0,0.15)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-nbk-gold/30 bg-nbk-gold/10 text-nbk-gold transition-colors group-hover:bg-nbk-gold/20">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
