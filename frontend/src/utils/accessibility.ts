/**
 * Accessibility utilities for keyboard navigation and screen readers
 */

// Trap focus within a modal/dialog
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Check if element is focusable
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;

  if (element.hasAttribute('disabled')) return false;

  const { display, visibility } = window.getComputedStyle(element);
  if (display === 'none' || visibility === 'hidden') return false;

  return true;
}

// Get all focusable elements in a container
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

  return elements.filter(isFocusable);
}

// Set focus to first element
export function focusFirstElement(container: HTMLElement) {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

// Keyboard event helpers
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

// Check if keyboard event matches key
export function isKey(event: KeyboardEvent, key: string): boolean {
  return event.key === key;
}

// Handle keyboard navigation for lists
export function handleListNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onSelect: (index: number) => void
) {
  let newIndex = currentIndex;

  switch (event.key) {
    case Keys.ARROW_UP:
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      break;
    case Keys.ARROW_DOWN:
      event.preventDefault();
      newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      break;
    case Keys.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case Keys.END:
      event.preventDefault();
      newIndex = totalItems - 1;
      break;
    case Keys.ENTER:
    case Keys.SPACE:
      event.preventDefault();
      onSelect(currentIndex);
      return;
  }

  if (newIndex !== currentIndex) {
    onSelect(newIndex);
  }
}

// ARIA label helpers
export function getAriaLabel(label: string, required = false): string {
  return required ? `${label} (required)` : label;
}

// Skip to main content
export function skipToContent(contentId: string) {
  const content = document.getElementById(contentId);
  if (content) {
    content.setAttribute('tabindex', '-1');
    content.focus();
    content.removeAttribute('tabindex');
  }
}
