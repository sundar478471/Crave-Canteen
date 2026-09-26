import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  /** Alias for backward compatibility */
  theme: EffectiveTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const savedMode = localStorage.getItem('cravecanteen_theme_mode');
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        return savedMode;
      }
      // Check legacy key if present
      const legacySaved = localStorage.getItem('cravecanteen_theme');
      if (legacySaved === 'light' || legacySaved === 'dark') {
        return legacySaved;
      }
    } catch (e) {
      console.warn("Theme storage read notice:", e);
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to system OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const effectiveTheme: EffectiveTheme = themeMode === 'system' 
    ? (systemIsDark ? 'dark' : 'light') 
    : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    try {
      localStorage.setItem('cravecanteen_theme_mode', themeMode);
      localStorage.setItem('cravecanteen_theme', effectiveTheme);
    } catch (e) {
      console.warn("Theme storage write notice:", e);
    }
  }, [themeMode, effectiveTheme]);

  // Listen for cross-tab theme changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cravecanteen_theme_mode' && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark' || e.newValue === 'system') {
          setThemeModeState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    if (effectiveTheme === 'dark') {
      setThemeModeState('light');
    } else {
      setThemeModeState('dark');
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        themeMode, 
        effectiveTheme, 
        setThemeMode, 
        toggleTheme, 
        theme: effectiveTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
