// frontend/utils/theme.ts

/**
 * Applies the theme to the HTML document element.
 * This adds or removes the 'dark' class based on the theme preference.
 */
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

const normalizeTheme = (theme: string | null | undefined): ThemePreference => {
  if (theme === "light" || theme === "dark" || theme === "system") return theme;
  return "system";
};

export const getStoredTheme = (): ThemePreference => {
  if (typeof window === "undefined") return "system";
  return normalizeTheme(localStorage.getItem(STORAGE_KEY));
};

export const applyTheme = (theme: ThemePreference) => {
  const root = window.document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Store in localStorage for instant retrieval on page load
  localStorage.setItem(STORAGE_KEY, theme);
};
