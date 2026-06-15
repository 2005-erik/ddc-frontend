// Хранилище JWT-токена админки.
//
// Пытаемся держать токен в localStorage (переживает перезагрузку страницы).
// В артефактах Claude localStorage недоступен — поэтому есть запасной вариант
// в памяти модуля: вход работает в рамках сессии, просто не переживает reload.
const KEY = 'ddc_admin_token'
let memToken = null

export function getToken() {
  try {
    return localStorage.getItem(KEY) || memToken
  } catch {
    return memToken
  }
}

export function setToken(token) {
  memToken = token
  try {
    localStorage.setItem(KEY, token)
  } catch {
    /* localStorage недоступен — остаёмся на memToken */
  }
}

export function clearToken() {
  memToken = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* нечего чистить */
  }
}
