export default function StubPage({ number }: { number: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-8">
        <p className="text-5xl">🚧</p>
        <h1 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-200">
          Лабораторна робота №{number}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Ця лабораторна поки що в розробці
        </p>
      </div>
    </div>
  );
}
