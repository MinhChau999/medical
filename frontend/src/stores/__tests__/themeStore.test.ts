import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useThemeStore.setState({ isDarkMode: false });
  });

  it('should have initial state with isDarkMode false', () => {
    const { isDarkMode } = useThemeStore.getState();
    expect(isDarkMode).toBe(false);
  });

  it('should toggle dark mode', () => {
    const { toggleTheme } = useThemeStore.getState();

    toggleTheme();
    expect(useThemeStore.getState().isDarkMode).toBe(true);

    toggleTheme();
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('should set dark mode to true', () => {
    const { setTheme } = useThemeStore.getState();

    setTheme(true);
    expect(useThemeStore.getState().isDarkMode).toBe(true);
  });

  it('should set dark mode to false', () => {
    const { setTheme } = useThemeStore.getState();

    setTheme(true);
    expect(useThemeStore.getState().isDarkMode).toBe(true);

    setTheme(false);
    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });

  it('should maintain state across multiple operations', () => {
    const { toggleTheme, setTheme } = useThemeStore.getState();

    toggleTheme(); // true
    toggleTheme(); // false
    setTheme(true); // true
    toggleTheme(); // false

    expect(useThemeStore.getState().isDarkMode).toBe(false);
  });
});
