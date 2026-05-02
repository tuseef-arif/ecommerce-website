/**
 * UI delay durations in milliseconds. Import from here instead of scattering magic numbers.
 */

/** One second — use to compose readable timeouts (`n * SECOND_MS`). */
export const SECOND_MS = 1000;

/** Standard 3s auto-dismiss (auth success dialog, toasts, etc.). */
export const THREE_SECOND_TIMEOUT_MS = 3 * SECOND_MS;

/** Desktop shop nav: grace period before closing flyout when pointer leaves trigger/gap */
export const DESKTOP_SHOP_NAV_HOVER_CLOSE_DELAY_MS = 140;

/** Category slider horizontal scroll animation duration */
export const CATEGORY_SLIDER_SCROLL_DURATION_MS = 520;

/** Hero banner slide auto-advance interval */
export const HERO_BANNER_AUTO_ADVANCE_MS = 6500;

/** Per-item stagger offset for desktop nav dropdown entrance (CSS `ms`) */
export const DESKTOP_NAV_DROPDOWN_STAGGER_STEP_MS = 44;
