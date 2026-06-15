import { API } from './config.js'
import { getToken } from './adminAuth.js'

// Клиент админ-API. Все защищённые запросы идут через authFetch — он
// подставляет заголовок Authorization: Bearer <token>.
//
// При 401 бросаем ошибку с флагом .status = 401, чтобы UI мог разлогинить
// пользователя и увести на страницу входа (токен истёк/недействителен).

async function authFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = new Error(await errorMessage(res))
    err.status = res.status
    throw err
  }
  return res.json()
}

// Достаём текст ошибки из тела ответа (если есть), иначе — по статусу.
async function errorMessage(res) {
  try {
    const data = await res.json()
    if (data?.error) return data.error
  } catch {
    /* тело не JSON — игнорируем */
  }
  return `Ошибка ${res.status}`
}

/**
 * Вход в админку. Возвращает { token, username }.
 * Не использует authFetch — токена ещё нет.
 */
export async function login(username, password) {
  const res = await fetch(`${API}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    throw new Error(await errorMessage(res))
  }
  return res.json()
}

// ─── Заявки ───
export const getRequests = () => authFetch('/requests')
export const updateRequestStatus = (id, status) =>
  authFetch(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })

// ─── Обращения / отзывы ───
export const getFeedback = () => authFetch('/feedback')

// ─── Новости (CRUD) ───
export const getNews = () => authFetch('/news')
export const createNews = (data) =>
  authFetch('/news', { method: 'POST', body: JSON.stringify(data) })
export const updateNews = (id, data) =>
  authFetch(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteNews = (id) => authFetch(`/news/${id}`, { method: 'DELETE' })
