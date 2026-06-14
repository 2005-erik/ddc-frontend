import { useEffect, useState } from 'react'
import NewsCard from './NewsCard.jsx'

const AUTOPLAY_MS = 4000

// сколько карточек видно в зависимости от ширины экрана
function getPerView(width) {
  if (width >= 1024) return 3 // десктоп
  if (width >= 640) return 2 // планшет
  return 1 // мобильный
}

export default function NewsCarousel({ items = [] }) {
  const [perView, setPerView] = useState(() =>
    getPerView(typeof window !== 'undefined' ? window.innerWidth : 1024)
  )
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const maxIndex = Math.max(0, items.length - perView)

  // адаптив: пересчёт perView при ресайзе
  useEffect(() => {
    const onResize = () => setPerView(getPerView(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // не выходить за границы при смене perView
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  // автопрокрутка каждые 4с (пауза при наведении)
  useEffect(() => {
    if (paused || items.length <= perView) return
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, items.length, perView, maxIndex])

  if (!items.length) return null

  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1))
  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1))

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ряд карточек */}
      <div className="relative">
        {/* Окно слайдера (pt/pb — чтобы hover-подъём и тень не обрезались) */}
        <div className="overflow-hidden px-1 pb-4 pt-2">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="shrink-0 px-3"
                style={{ flex: `0 0 ${100 / perView}%` }}
              >
                <NewsCard news={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Стрелки — по вертикали в центре карточек (картинка 180 + часть контента) */}
        <button
          type="button"
          onClick={prev}
          aria-label="Предыдущие новости"
          className="absolute left-0 top-[200px] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0d1424]/90 text-xl text-white shadow-lg backdrop-blur transition hover:border-[#FFD700] hover:text-[#FFD700] sm:-left-4"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Следующие новости"
          className="absolute right-0 top-[200px] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0d1424]/90 text-xl text-white shadow-lg backdrop-blur transition hover:border-[#FFD700] hover:text-[#FFD700] sm:-right-4"
        >
          ›
        </button>
      </div>

      {/* Точки-индикаторы */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Перейти к слайду ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-[#FFD700]' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
