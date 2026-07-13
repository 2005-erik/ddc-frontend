import { useState, useRef, useEffect } from 'react'
import {
  MessageCircle,
  X,
  ClipboardList,
  Send,
  LifeBuoy,
  Phone,
  Star,
  ArrowLeft,
} from 'lucide-react'
import { sendMessage } from '../api/chat.js'
import { sendSupport, sendReview } from '../api/support.js'

const GREETING = {
  from: 'bot',
  text: 'Здравствуйте! Я помощник Центра цифрового развития. Спросите про услуги, портал закупок или поддержку 1477.',
}

const fieldClass =
  'w-full rounded-lg border border-white/15 bg-ink/50 px-3 py-2 text-sm text-white placeholder:text-white/40 transition-colors focus:border-nbk-gold/60 focus:outline-none'

// ── Мини-форма: срочное обращение к живому сотруднику ──────────────
function SupportForm() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim() && form.contact.trim() && form.message.trim().length >= 5

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending')
    try {
      await sendSupport(form)
      setStatus('success')
    } catch (err) {
      console.error('Ошибка поддержки', err)
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Контакты живой поддержки */}
      <div className="flex items-center gap-2 rounded-lg border border-nbk-gold/30 bg-nbk-gold/10 px-3 py-2 text-sm text-white/85">
        <Phone className="h-4 w-4 shrink-0 text-nbk-gold" aria-hidden="true" />
        <span>
          Экстренно — контакт-центр <span className="font-semibold text-nbk-gold">1477</span> (круглосуточно)
        </span>
      </div>

      {status === 'success' ? (
        <p className="rounded-lg bg-white/5 px-3 py-3 text-sm text-ddc-blue-light">
          Обращение принято — сотрудник свяжется с вами в ближайшее время.
        </p>
      ) : (
        <>
          <input className={fieldClass} placeholder="Имя" value={form.name} onChange={update('name')} />
          <input className={fieldClass} placeholder="Email или телефон" value={form.contact} onChange={update('contact')} />
          <textarea
            className={`${fieldClass} resize-y`}
            rows={3}
            placeholder="Суть обращения"
            value={form.message}
            onChange={update('message')}
          />
          {status === 'error' && (
            <p className="text-xs text-red-400">Не удалось отправить. Попробуйте ещё раз.</p>
          )}
          <button
            type="submit"
            disabled={!valid || status === 'sending'}
            className="w-full rounded-lg bg-nbk-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-nbk-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'sending' ? 'Отправка…' : 'Отправить обращение'}
          </button>
        </>
      )}
    </form>
  )
}

// ── Мини-форма: отзыв о сайте ─────────────────────────────────────
function ReviewForm() {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')

  const valid = rating > 0 && text.trim().length >= 3

  const submit = async (e) => {
    e.preventDefault()
    if (!valid || status === 'sending') return
    setStatus('sending')
    try {
      await sendReview({ rating, text })
      setStatus('success')
    } catch (err) {
      console.error('Ошибка отзыва', err)
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {status === 'success' ? (
        <p className="rounded-lg bg-white/5 px-3 py-3 text-sm text-ddc-blue-light">
          Спасибо за отзыв — он помогает нам становиться лучше.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Оценка ${n}`}
                className="p-0.5 text-nbk-gold transition-transform hover:scale-110"
              >
                <Star
                  className="h-6 w-6"
                  fill={n <= rating ? 'currentColor' : 'none'}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <textarea
            className={`${fieldClass} resize-y`}
            rows={3}
            placeholder="Что понравилось или что улучшить?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {status === 'error' && (
            <p className="text-xs text-red-400">Не удалось отправить. Попробуйте ещё раз.</p>
          )}
          <button
            type="submit"
            disabled={!valid || status === 'sending'}
            className="w-full rounded-lg bg-nbk-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-nbk-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'sending' ? 'Отправка…' : 'Отправить отзыв'}
          </button>
        </>
      )}
    </form>
  )
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState('chat') // chat | support | review
  const scrollRef = useRef(null)
  const menuRef = useRef(null)

  // автоскролл истории вниз при новом сообщении / индикаторе печати
  useEffect(() => {
    if (panel !== 'chat') return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing, open, panel])

  // меню поддержки закрывается по клику вне него
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || typing) return

    // история до текущего сообщения — для контекста LLM на бэкенде
    const history = messages
    setMessages((m) => [...m, { from: 'user', text }])
    setInput('')
    setTyping(true)
    try {
      const reply = await sendMessage(text, history)
      setMessages((m) => [...m, { from: 'bot', text: reply }])
    } catch (err) {
      console.error('Ошибка чата', err)
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'Что-то пошло не так. Попробуйте ещё раз.' },
      ])
    } finally {
      setTyping(false)
    }
  }

  // переход к форме заявки: закрыть чат и плавно проскроллить к секции "Консультация"
  const goToFeedback = () => {
    setOpen(false)
    document.getElementById('consult')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openPanel = (p) => {
    setPanel(p)
    setMenuOpen(false)
  }

  const PANEL_TITLE = { support: 'Связаться с сотрудником', review: 'Отзыв о сайте' }

  return (
    <>
      {/* Окно чата (над кнопкой, снизу-справа) */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[60] flex h-[28rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-ink/95 shadow-2xl backdrop-blur-md sm:right-6">
          {/* Шапка */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nbk-gold/15 text-nbk-gold">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-white">Помощник DDC</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Поддержка («живой» канал — золотая иконка) */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  title="Поддержка"
                  aria-label="Поддержка"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-nbk-gold transition-colors hover:bg-nbk-gold/15"
                >
                  <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-white/15 bg-ink/95 shadow-xl backdrop-blur-md"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openPanel('support')}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-nbk-gold"
                    >
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-nbk-gold" aria-hidden="true" />
                      <span>
                        Связаться с сотрудником
                        <span className="block text-xs text-white/40">Экстренные вопросы, живая поддержка</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openPanel('review')}
                      className="flex w-full items-start gap-2.5 border-t border-white/10 px-3 py-2.5 text-left text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-nbk-gold"
                    >
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-nbk-gold" aria-hidden="true" />
                      <span>
                        Оставить отзыв о сайте
                        <span className="block text-xs text-white/40">Оценка и пожелания</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Оставить заявку (скролл к секции) */}
              <button
                type="button"
                onClick={goToFeedback}
                title="Оставить заявку"
                aria-label="Оставить заявку"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-nbk-gold"
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Закрыть */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Закрыть"
                aria-label="Закрыть чат"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {panel === 'chat' ? (
            <>
              {/* История сообщений */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <p
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        m.from === 'user'
                          ? 'rounded-br-sm bg-ddc-blue text-white'
                          : 'rounded-bl-sm bg-white/10 text-white/85'
                      }`}
                    >
                      {m.text}
                    </p>
                  </div>
                ))}

                {/* Индикатор "печатает" */}
                {typing && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nbk-gold [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nbk-gold [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-nbk-gold" />
                    </div>
                  </div>
                )}
              </div>

              {/* Поле ввода */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-3 py-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Напишите сообщение…"
                  className="flex-1 rounded-full border border-white/15 bg-ink/50 px-4 py-2 text-sm text-white placeholder:text-white/40 transition-colors focus:border-nbk-gold/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  aria-label="Отправить"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nbk-gold text-ink transition hover:bg-nbk-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            /* Панель поддержки / отзыва */
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <button
                type="button"
                onClick={() => setPanel('chat')}
                className="mb-3 flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-nbk-gold"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Назад к чату
              </button>
              <h3 className="mb-3 text-sm font-semibold text-white">{PANEL_TITLE[panel]}</h3>
              {panel === 'support' ? <SupportForm /> : <ReviewForm />}
            </div>
          )}
        </div>
      )}

      {/* Плавающая кнопка */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрыть чат' : 'Открыть чат с помощником'}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-nbk-gold text-ink shadow-[0_0_24px_rgba(255,187,52,0.4)] transition hover:scale-105 hover:bg-nbk-gold-soft sm:right-6"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </button>
    </>
  )
}
