import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
  let theme = $state<Theme>('system');

  function init() {
    if (!browser) return;

    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      theme = stored;
    }

    applyTheme();
  }

  function setTheme(newTheme: Theme) {
    theme = newTheme;
    if (browser) {
      localStorage.setItem('theme', newTheme);
      applyTheme();
    }
  }

  function applyTheme() {
    if (!browser) return;

    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // Listen for system changes if in system mode
  if (browser) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme === 'system') {
        applyTheme();
      }
    });
  }

  return {
    get current() { return theme; },
    setTheme,
    init
  };
}

export const themeState = createThemeStore();
