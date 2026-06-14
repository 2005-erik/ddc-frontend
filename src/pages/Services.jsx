import { Link } from 'react-router-dom'

export default function Services() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-nbk-gold">Услуги</h1>
      <p className="text-white/70">Страница в разработке.</p>
      <Link to="/" className="text-sm text-ddc-blue-light hover:text-nbk-gold">
        ← На главную
      </Link>
    </main>
  )
}
