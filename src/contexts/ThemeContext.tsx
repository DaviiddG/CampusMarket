import { createContext, useContext, useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeDirect: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setThemeDirect: () => {},
});

function applyToDOM(t: Theme) {
  const html = document.documentElement;
  if (t === 'dark') {
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  } else {
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
  }
  localStorage.setItem('theme', t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) {
      // Apply immediately to avoid FOUC
      applyToDOM(saved);
      return saved;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = prefersDark ? 'dark' : 'light';
    applyToDOM(initial);
    return initial;
  });

  // Keep DOM in sync with state at all times
  useEffect(() => {
    applyToDOM(theme);
  }, [theme]);

  // Uses prev => ... to avoid stale closures completely
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      // Apply synchronously to DOM so animations can see the change
      applyToDOM(next);
      return next;
    });
  }, []);

  const setThemeDirect = useCallback((t: Theme) => {
    applyToDOM(t);
    setTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeDirect }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
