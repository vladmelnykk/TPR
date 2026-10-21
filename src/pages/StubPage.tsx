import { Link } from 'react-router-dom'

export default function StubPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-xl font-bold">Сторінку не знайдено</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Оберіть інструмент у меню або поверніться до аналізу альтернатив.</p>
      <Link to="/" className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-600">До аналізу альтернатив</Link>
    </div>
  )
}
