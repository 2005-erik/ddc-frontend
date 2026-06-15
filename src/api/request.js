import { API } from './config.js'

/**
 * Отправить заявку на услугу (POST /api/requests).
 *
 * Форма собирает выбранную услугу (service) + контактные данные.
 * Backend требует непустой `type` (классификатор обращения) и `service`
 * (конкретная услуга) — отправляем type: 'заявка', service: выбранное.
 *
 * Бросает ошибку при сетевом сбое или не-2xx ответе — форма ловит её
 * в catch и показывает пользователю понятное сообщение.
 *
 * @param {{ service: string, name: string, contact: string, message: string }} data
 * @returns {Promise<object>} созданная заявка от backend
 */
export async function sendRequest(data) {
  const res = await fetch(`${API}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'заявка',
      service: data.service,
      name: data.name,
      contact: data.contact,
      message: data.message,
    }),
  })
  if (!res.ok) throw new Error(`Не удалось отправить заявку: ${res.status}`)
  return res.json()
}

export default sendRequest
