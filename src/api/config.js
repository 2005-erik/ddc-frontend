// Базовый URL backend-API. Меняется в одном месте при переходе на боевой адрес.
// Можно переопределить через переменную окружения Vite (VITE_API_URL).
export const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default API
