/**
 * Reliably scroll to top after React re-renders.
 * Uses requestAnimationFrame + instant behavior to avoid
 * smooth-scroll being interrupted by DOM updates.
 */
export function scrollToTopInstant() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  });
}
