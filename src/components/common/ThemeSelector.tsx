import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeSelectorProps {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  variant = 'compact',
  className = '' 
}) => {
  const { themeMode, effectiveTheme, setThemeMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all text-xs font-semibold ${className}`}
        title={`Current Theme: ${effectiveTheme.toUpperCase()} (Click to toggle)`}
      >
        {effectiveTheme === 'dark' ? (
          <>
            <Moon className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Light</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Appearance Theme
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              themeMode === 'light'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              themeMode === 'dark'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setThemeMode('system')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              themeMode === 'system'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>System</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm hover:shadow transition-all"
      >
        {themeMode === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
        {themeMode === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
        {themeMode === 'system' && <Laptop className="w-4 h-4 text-purple-500" />}
        <span className="capitalize">{themeMode}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 animate-fadeIn">
          <button
            type="button"
            onClick={() => { setThemeMode('light'); setIsOpen(false); }}
            className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
              themeMode === 'light' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </span>
            {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-amber-500" />}
          </button>

          <button
            type="button"
            onClick={() => { setThemeMode('dark'); setIsOpen(false); }}
            className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
              themeMode === 'dark' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Dark Mode</span>
            </span>
            {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={() => { setThemeMode('system'); setIsOpen(false); }}
            className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
              themeMode === 'system' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-purple-500" />
              <span>System Mode</span>
            </span>
            {themeMode === 'system' && <Check className="w-3.5 h-3.5 text-purple-500" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
