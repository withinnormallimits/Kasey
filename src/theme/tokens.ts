/**
 * Design tokens. Nothing outside this file hardcodes a color.
 *
 * Values are lifted verbatim from prototype/kasey-prototype.html, which is the
 * reference implementation. Both themes are verified against WCAG AA:
 * 4.5:1 for text, 3:1 for interactive borders. See theme/contrast.test.ts,
 * which fails the build if a pair drops below threshold.
 *
 * The recovery ramp is a single hue varying by lightness, not a traffic light.
 * Green-to-red measured 1.04:1 under deuteranopia, which affects about 8% of
 * men. Meaning is never carried by color alone anywhere in this app.
 */

export type ThemeName = 'light' | 'dark';
export type ThemeMode = ThemeName | 'auto';

export interface Palette {
  /** page backdrop behind the app frame */
  bg: string;
  /** the app surface */
  paper: string;
  /** raised surfaces: entries, fields, cards */
  card: string;
  /** primary text */
  ink: string;
  /** secondary text */
  ink2: string;
  /** tertiary text, still AA against paper and card */
  ink3: string;
  /** decorative divider, not an interactive affordance */
  line: string;
  /** faint divider inside cards */
  line2: string;
  /** interactive border. Must stay at or above 3:1 */
  edge: string;
  /** primary brand action */
  deep: string;
  onDeep: string;
  deepSoft: string;
  onDeepSoft: string;
  /** good day affordances */
  good: string;
  goodSoft: string;
  onGoodSoft: string;
  /**
   * Rationed to exactly two states: "nothing we tried helped", and a stage 4
   * meltdown. It is not a general purpose alert color.
   */
  warn: string;
  warnSoft: string;
  onWarnSoft: string;
  /** slider and bar troughs */
  track: string;
  /** sequential recovery ramp, shortest to longest */
  ramp: readonly [string, string, string, string, string];
}

export const light: Palette = {
  bg: '#E6E9E4',
  paper: '#F1F3EF',
  card: '#FFFFFF',
  ink: '#16201F',
  ink2: '#3C4A48',
  ink3: '#5E6D69',
  line: '#DDE2DC',
  line2: '#EDF0EC',
  edge: '#7C8A84',
  deep: '#2C574B',
  onDeep: '#FFFFFF',
  deepSoft: '#E4EDE8',
  onDeepSoft: '#24473E',
  good: '#3C7554',
  goodSoft: '#E8F1EA',
  onGoodSoft: '#2F5E44',
  warn: '#A8503C',
  warnSoft: '#F6E7E3',
  onWarnSoft: '#8B4231',
  track: '#E4E9E5',
  ramp: ['#BBD2C7', '#8FB5A5', '#639784', '#3E7864', '#25584A'],
};

export const dark: Palette = {
  bg: '#0D1111',
  // never pure black. OLED black raises smearing on scroll and reads as a void
  paper: '#151A19',
  card: '#1E2524',
  ink: '#E4EAE7',
  ink2: '#B9C4C0',
  ink3: '#97A5A1',
  line: '#2A3332',
  line2: '#232B2A',
  edge: '#6E7B77',
  deep: '#6FC2A3',
  onDeep: '#0C1714',
  deepSoft: '#1B2E28',
  onDeepSoft: '#8FD6B8',
  good: '#6FC2A3',
  goodSoft: '#172A23',
  onGoodSoft: '#8FD6B8',
  warn: '#E0906E',
  warnSoft: '#33201A',
  onWarnSoft: '#F0AE90',
  track: '#2A3332',
  ramp: ['#2F5346', '#3E7864', '#559A80', '#74BC9C', '#9BD9BC'],
};

export const palettes: Record<ThemeName, Palette> = { light, dark };

/**
 * The generated handoff pages stay white paper in both themes. They print, and
 * a document handed to a psychiatrist should look like a document.
 */
export const paperDoc = {
  bg: '#FFFFFF',
  border: '#DDE2DC',
  ink: '#16201F',
  ink2: '#3C4A48',
  ink3: '#5E6D69',
  line: '#DDE2DC',
  deep: '#2C574B',
  warn: '#A8503C',
  goodSoft: '#E8F1EA',
  onGoodSoft: '#2F5E44',
  masthead: '#22506B',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 34,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

/**
 * Minimum touch target. Every interactive element in the app must meet this.
 * WCAG 2.2 target size is 24px; 48px is the Material and Apple guidance and is
 * what a stressed parent using one thumb actually needs.
 */
export const TAP = 48;

export const type = {
  /** wordmark only */
  wordmark: 'Fraunces_600SemiBold',
  /** headings and generated page titles */
  display: 'Newsreader_400Regular',
  displayLight: 'Newsreader_300Light',
  displayMedium: 'Newsreader_500Medium',
  /** all interface text */
  ui: 'PublicSans_400Regular',
  uiMedium: 'PublicSans_500Medium',
  uiSemi: 'PublicSans_600SemiBold',
  uiBold: 'PublicSans_700Bold',
  /** numbers, timestamps, labels. Tabular so columns line up */
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemi: 'IBMPlexMono_600SemiBold',
} as const;

/** Maps recovery minutes onto the sequential ramp. Never onto a hue scale. */
export function rampIndex(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 5) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 60) return 3;
  return 4;
}

export function rampColor(minutes: number, p: Palette): string {
  return p.ramp[rampIndex(minutes)];
}
