import { useEffect, useRef, useState } from 'react'

// Мягкое «появление» элемента при попадании в зону видимости.
// Возвращает [ref, shown]: навешиваем ref на элемент, по shown переключаем
// классы анимации.
//
// ВАЖНО: контент важнее анимации. Поэтому показ устроен «fail-open» —
// если IntersectionObserver недоступен или почему-то не сработал, элемент
// всё равно проявляется (страховочный таймер). Скрытым навсегда остаться нельзя.
export function useReveal({
  threshold = 0,
  rootMargin = '0px 0px -10% 0px',
  fallbackMs = 1500,
} = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Нет поддержки IO — сразу показываем.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    let fallback = null
    const reveal = () => {
      setShown(true)
      if (fallback) clearTimeout(fallback)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal()
          io.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)

    // Страховка: что бы ни случилось с наблюдателем, контент проявится.
    fallback = setTimeout(reveal, fallbackMs)

    return () => {
      io.disconnect()
      if (fallback) clearTimeout(fallback)
    }
  }, [threshold, rootMargin, fallbackMs])

  return [ref, shown]
}

export default useReveal
