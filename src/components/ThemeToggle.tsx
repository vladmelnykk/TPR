import { useThemeStore } from '../stores/themeStore';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
      aria-label="Перемкнути тему"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
