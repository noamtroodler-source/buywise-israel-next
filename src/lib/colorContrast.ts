/**
 * Ensures an accent color has enough contrast for use on buttons.
 * If the color is too light (high luminance), it darkens it.
 * Returns both a safe background color and the appropriate text color.
 */

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

/** Relative luminance per WCAG 2.0 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Darken a hex color by a factor (0–1, where 0 = black) */
function darken(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => Math.round(c * factor));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export interface ButtonColorStyle {
  backgroundColor: string;
  color: string;
  borderColor?: string;
}

/**
 * Returns safe styles for a filled button using the given accent color.
 * Light colors get darkened background + white text.
 * Dark colors keep original background + white text.
 */
export function getFilledButtonStyle(accentColor: string | undefined | null): React.CSSProperties | undefined {
  if (!accentColor) return undefined;
  const rgb = hexToRgb(accentColor);
  if (!rgb) return { backgroundColor: accentColor };

  const lum = relativeLuminance(...rgb);

  // If luminance > 0.4 the color is too light for white text
  if (lum > 0.4) {
    const darkened = darken(accentColor, 0.55);
    return { backgroundColor: darkened, borderColor: darkened };
  }

  return { backgroundColor: accentColor, borderColor: accentColor };
}

/**
 * Returns safe styles for an outline button using the given accent color.
 * Light colors get darkened text + border.
 */
export function getOutlineButtonStyle(accentColor: string | undefined | null): React.CSSProperties | undefined {
  if (!accentColor) return undefined;
  const rgb = hexToRgb(accentColor);
  if (!rgb) return { borderColor: `${accentColor}40`, color: accentColor };

  const lum = relativeLuminance(...rgb);

  if (lum > 0.4) {
    const darkened = darken(accentColor, 0.55);
    return { borderColor: `${darkened}40`, color: darkened };
  }

  return { borderColor: `${accentColor}40`, color: accentColor };
}
