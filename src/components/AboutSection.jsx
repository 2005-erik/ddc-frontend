import { useState } from 'react'

// Вехи истории центра (текст реалистичный для ИТ-подразделения нацбанка)
const milestones = [
  {
    year: '1996',
    title: 'Банковское сервисное бюро',
    desc: 'Создание Банковского сервисного бюро Национального Банка РК — начало централизованного ИТ-обслуживания банковской системы страны.',
  },
  {
    year: '2003',
    title: 'Развитие инфраструктуры',
    desc: 'Расширение функций: развитие телекоммуникационной инфраструктуры и систем обработки платежей для нужд регулятора.',
  },
  {
    year: '2015',
    title: 'Модернизация ЦОД',
    desc: 'Обновление центров обработки данных и переход на современные стандарты информационной безопасности.',
  },
  {
    year: '2017',
    title: 'Центр цифрового развития',
    desc: 'Реорганизация в Центр цифрового развития с фокусом на цифровой трансформации процессов Нацбанка и его дочерних организаций.',
  },
  {
    year: '2020–2023',
    title: 'Портал закупок',
    desc: 'Запуск и развитие единого портала закупок: перевод закупочных процедур регулятора в прозрачную цифровую среду.',
  },
  {
    year: '2025',
    title: 'Текущий этап',
    desc: 'Внедрение аналитики данных и сервисов на базе ИИ, развитие контакт-центра 1477 и расширение линейки цифровых услуг.',
  },
]

export default function AboutSection() {
  const [active, setActive] = useState(0)
  const current = milestones[active]

  return (
    <section id="about" className="relative z-10 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="plate-head">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">О нас</h2>
            <p className="mt-1 text-sm text-white/50">
              Центр цифрового развития Национального Банка Казахстана
            </p>
          </div>
          <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
        </div>

        <p className="plate mb-12 max-w-3xl p-5 leading-relaxed text-white/70 sm:p-6">
          Почти три десятилетия мы развиваем технологическую основу финансовой
          системы Казахстана — от первого сервисного бюро до современного центра
          цифровой трансформации.
        </p>

        {/* Таймлайн: горизонтальный на десктопе, вертикальный на мобильном */}
        {/* внешняя плашка с отступами; внутренний relative — система координат
            для соединительных линий (чтобы padding не сбивал их позицию) */}
        <div className="plate p-6 sm:p-8">
          <div className="relative">
            {/* соединительная линия */}
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-white/15 md:block" />
            <div className="absolute bottom-2 left-5 top-2 w-px bg-white/15 md:hidden" />

          <ol className="flex flex-col gap-6 md:flex-row md:justify-between md:gap-2">
            {milestones.map((m, i) => {
              const isActive = i === active
              return (
                <li key={m.year} className="md:flex-1">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    className="group flex w-full items-center gap-4 md:flex-col md:gap-3"
                  >
                    <span
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isActive
                          ? 'border-nbk-gold bg-nbk-gold/20 shadow-[0_0_18px_rgba(255,187,52,0.4)]'
                          : 'border-white/25 bg-ink group-hover:border-nbk-gold/60'
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                          isActive ? 'bg-nbk-gold' : 'bg-white/40 group-hover:bg-nbk-gold/70'
                        }`}
                      />
                    </span>
                    <span
                      className={`text-sm font-semibold tracking-wide transition-colors ${
                        isActive ? 'text-nbk-gold' : 'text-white/55 group-hover:text-white'
                      }`}
                    >
                      {m.year}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          </div>
        </div>

        {/* Описание активной вехи */}
        <div className="plate mt-10 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-white">
            {current.title}{' '}
            <span className="text-nbk-gold">· {current.year}</span>
          </h3>
          <p className="mt-3 max-w-3xl leading-relaxed text-white/70">
            {current.desc}
          </p>
        </div>
      </div>
    </section>
  )
}
