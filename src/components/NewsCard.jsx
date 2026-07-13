const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : dateFormatter.format(d)
}

/**
 * Переиспользуемая карточка новости.
 * Непрозрачный тёмно-зелёный фон (#022622), фиксированная высота, картинка-блок сверху.
 * @param {object} props.news - { date, category, title, excerpt, image }
 */
export default function NewsCard({ news }) {
  const { date, category, title, excerpt, image } = news

  return (
    <article className="group flex h-[400px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-nbk-gold/50 hover:shadow-[0_16px_44px_-12px_rgba(255,187,52,0.28)]">
      {/* Изображение / градиент — фиксированная высота, не растягивается */}
      <div
        className="h-[180px] w-full shrink-0"
        style={{ backgroundImage: image, backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-hidden="true"
      />

      {/* Контент */}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-ddc-teal/25 px-3 py-1 text-xs font-semibold tracking-wide text-nbk-gold">
            {category}
          </span>
          <time className="text-xs uppercase tracking-wide text-slate-400">
            {formatDate(date)}
          </time>
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-nbk-gold">
          {title}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-slate-300/90">
          {excerpt}
        </p>
      </div>
    </article>
  )
}
