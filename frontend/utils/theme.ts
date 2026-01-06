// frontend/utils/theme.ts

/**
 * Applies the theme to the HTML document element.
 * This adds or removes the 'dark' class based on the theme preference.
 */
export const applyTheme = (theme: string) => {
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
  localStorage.setItem("theme-preference", theme);
};