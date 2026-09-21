import { useUi } from '../features/ui/UiContext';
import LucideIcon from './LucideIcon';

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useUi();

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="relative flex h-11 w-14 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      aria-label={isDarkMode ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
      aria-pressed={isDarkMode}
    >
      <span className={`absolute inset-x-1 h-6 rounded-full border transition-colors ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-300 bg-zinc-200'}`} />
      <span
        className={`absolute left-1 flex size-6 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm transition-transform ${
          isDarkMode ? 'translate-x-6 bg-zinc-700 text-amber-300' : 'translate-x-0'
        }`}
      >
        <LucideIcon name={isDarkMode ? 'Moon' : 'Sun'} size={13} />
      </span>
    </button>
  );
}
