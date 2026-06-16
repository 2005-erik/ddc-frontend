import { useState } from 'react'
import { sendRequest } from '../api/request.js'

// Направления DDC для выбора интересующей услуги
const SERVICES = [
  'Цифровизация',
  'Информационная безопасность',
  'Технологический оператор данных',
  'Контакт-центр 1477',
  'Финансовая отчётность',
  'Гарантированное качество',
  'Сотрудничество',
  'Другое',
]

const emptyForm = { service: SERVICES[0], name: '', contact: '', message: '' }

// Контакт: либо email, либо телефон (минимум 6 цифр)
function validate({ name, contact, message }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Укажите имя'
  if (!contact.trim()) {
    errors.contact = 'Укажите email или телефон'
  } else {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
    const isPhone = (contact.replace(/\D/g, '').length >= 6)
    if (!isEmail && !isPhone) errors.contact = 'Введите корректный email или телефон'
  }
  if (message.trim().length < 10) errors.message = 'Опишите запрос подробнее (минимум 10 символов)'
  return errors
}

const fieldClass =
  'w-full rounded-lg border border-white/15 bg-ink/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 transition-colors focus:border-nbk-gold/60 focus:outline-none focus:ring-1 focus:ring-nbk-gold/40'

export default function ConsultSection() {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (status === 'success' || status === 'error') setStatus('idle')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    if (Object.keys(found).length) {
      setErrors(found)
      return
    }
    setStatus('sending')
    try {
      await sendRequest(form)
      setStatus('success')
      setForm(emptyForm)
      setErrors({})
    } catch (err) {
      console.error('Не удалось отправить заявку', err)
      setStatus('error')
    }
  }

  return (
    <section id="consult" className="relative z-10 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="plate-head">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Оставить заявку</h2>
            <p className="mt-1 text-sm text-white/50">
              Заполните форму — специалист свяжется с вами
            </p>
          </div>
          <span className="hidden h-1 w-16 rounded-full bg-nbk-gold sm:block" />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="plate mx-auto max-w-2xl p-6 sm:p-8"
        >
          <div className="grid gap-5">
            {/* Интересующая услуга */}
            <div>
              <label htmlFor="rf-service" className="mb-1.5 block text-xs font-medium tracking-wide text-white/60">
                Интересующая услуга
              </label>
              <select
                id="rf-service"
                value={form.service}
                onChange={update('service')}
                className={fieldClass}
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s} className="bg-ink text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Имя + контакт */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="rf-name" className="mb-1.5 block text-xs font-medium tracking-wide text-white/60">
                  Имя
                </label>
                <input
                  id="rf-name"
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Как к вам обращаться"
                  aria-invalid={!!errors.name}
                  className={fieldClass}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="rf-contact" className="mb-1.5 block text-xs font-medium tracking-wide text-white/60">
                  Контакт
                </label>
                <input
                  id="rf-contact"
                  type="text"
                  value={form.contact}
                  onChange={update('contact')}
                  placeholder="Email или телефон"
                  aria-invalid={!!errors.contact}
                  className={fieldClass}
                />
                {errors.contact && <p className="mt-1 text-xs text-red-400">{errors.contact}</p>}
              </div>
            </div>

            {/* Сообщение */}
            <div>
              <label htmlFor="rf-message" className="mb-1.5 block text-xs font-medium tracking-wide text-white/60">
                Сообщение
              </label>
              <textarea
                id="rf-message"
                rows={4}
                value={form.message}
                onChange={update('message')}
                placeholder="Опишите задачу или запрос"
                aria-invalid={!!errors.message}
                className={`${fieldClass} resize-y`}
              />
              {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
            </div>

            {/* Кнопка + статус */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-lg bg-nbk-gold px-5 py-2.5 text-sm font-semibold tracking-wide text-ink shadow-[0_0_14px_rgba(255,215,0,0.2)] transition hover:bg-nbk-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'sending' ? 'Отправка…' : 'Отправить заявку'}
              </button>

              {status === 'success' && (
                <p className="text-sm text-ddc-blue-light">
                  Заявка принята, мы свяжемся с вами.
                </p>
              )}
              {status === 'error' && (
                <p className="text-sm text-red-400">
                  Не удалось отправить. Попробуйте ещё раз.
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
