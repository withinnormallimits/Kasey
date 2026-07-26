/**
 * Contrast verification. This test fails the build if any token pair drops
 * below WCAG AA. CLAUDE.md requires verifying contrast before committing a
 * palette change; this makes that mechanical instead of a promise.
 *
 * AA thresholds: 4.5:1 for body text, 3:1 for large text and for the boundary
 * of an interactive control.
 */

import { dark, light, Palette } from '../tokens';

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a 6 digit hex color: ${hex}`);
  const int = parseInt(m[1], 16);
  const r = srgbToLinear((int >> 16) & 255);
  const g = srgbToLinear((int >> 8) & 255);
  const b = srgbToLinear(int & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light_ = Math.max(la, lb);
  const dark_ = Math.min(la, lb);
  return (light_ + 0.05) / (dark_ + 0.05);
}

const TEXT_AA = 4.5;
const UI_AA = 3;

function textPairs(p: Palette): Array<[string, string, string]> {
  return [
    ['ink on paper', p.ink, p.paper],
    ['ink on card', p.ink, p.card],
    ['ink2 on paper', p.ink2, p.paper],
    ['ink2 on card', p.ink2, p.card],
    ['ink3 on paper', p.ink3, p.paper],
    ['ink3 on card', p.ink3, p.card],
    ['deep on paper', p.deep, p.paper],
    ['deep on card', p.deep, p.card],
    ['onDeep on deep', p.onDeep, p.deep],
    ['onDeepSoft on deepSoft', p.onDeepSoft, p.deepSoft],
    ['onGoodSoft on goodSoft', p.onGoodSoft, p.goodSoft],
    ['onWarnSoft on warnSoft', p.onWarnSoft, p.warnSoft],
    ['good on card', p.good, p.card],
    ['warn on card', p.warn, p.card],
  ];
}

function uiPairs(p: Palette): Array<[string, string, string]> {
  return [
    ['edge on paper', p.edge, p.paper],
    ['edge on card', p.edge, p.card],
    ['deep on paper', p.deep, p.paper],
  ];
}

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme meets WCAG AA', (_name, palette) => {
  it.each(textPairs(palette))('%s is at least 4.5:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(TEXT_AA);
  });

  it.each(uiPairs(palette))('%s is at least 3:1', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(UI_AA);
  });
});

describe('the recovery ramp', () => {
  it('varies by lightness so it survives colour vision deficiency', () => {
    // A traffic light ramp measured 1.04:1 under deuteranopia. A single hue
    // varying by lightness stays distinguishable because luminance carries
    // the signal, not hue.
    for (const palette of [light, dark]) {
      const lums = palette.ramp.map(relativeLuminance);
      const sorted = [...lums].sort((a, b) => a - b);
      const monotonic =
        lums.every((v, i) => v === sorted[i]) ||
        lums.every((v, i) => v === sorted[sorted.length - 1 - i]);
      expect(monotonic).toBe(true);

      // adjacent steps must be separable, not just ordered
      for (let i = 1; i < lums.length; i += 1) {
        expect(contrastRatio(palette.ramp[i - 1], palette.ramp[i])).toBeGreaterThan(1.15);
      }
    }
  });

  it('spans a wide enough luminance range to read as a scale', () => {
    for (const palette of [light, dark]) {
      expect(contrastRatio(palette.ramp[0], palette.ramp[4])).toBeGreaterThan(3);
    }
  });
});
