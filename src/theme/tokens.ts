/**
 * Design tokens.
 *
 * Visual language borrows from the amber dot-matrix panels used on
 * Singapore bus stops and bus destination signs: arrival numerals sit on
 * a dark strip in amber monospace, and everything around them stays
 * neutral so the times are the thing your eye lands on first.
 *
 * Every colour is defined for both schemes so components never branch on
 * theme themselves; they read from the palette they are handed.
 */

import { Platform } from 'react-native';

export interface Palette {
  /** Screen background. */
  background: string;
  /** Raised surfaces: cards, rows. */
  surface: string;
  /** Pressed / secondary surface. */
  surfaceAlt: string;
  /** Hairline dividers and borders. */
  border: string;
  /** Primary text. */
  text: string;
  /** Secondary text: road names, captions. */
  textMuted: string;
  /** Tertiary text: timestamps, hints. */
  textFaint: string;
  /** The dark strip behind arrival numerals. */
  board: string;
  /** Amber numerals on the board. */
  boardText: string;
  /** Dimmed numerals for schedule-based (unmonitored) estimates. */
  boardTextDim: string;
  /** Filled segments of the crowding gauge. */
  gaugeFill: string;
  /** Empty segments of the crowding gauge. */
  gaugeTrack: string;
  /** Interactive accent: links, selected tabs. */
  accent: string;
  /** Destructive / error state. */
  danger: string;
}

const light: Palette = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F3',
  border: '#DFE3E8',
  text: '#171A1F',
  textMuted: '#5C6470',
  textFaint: '#8B93A0',
  board: '#1B1F26',
  boardText: '#FFAF3B',
  boardTextDim: '#8A6E3E',
  gaugeFill: '#2C7A5A',
  gaugeTrack: '#DCE1E6',
  accent: '#1F5FA8',
  danger: '#B5342B',
};

const dark: Palette = {
  background: '#0D1015',
  surface: '#161A21',
  surfaceAlt: '#1E232C',
  border: '#2A303A',
  text: '#F2F4F7',
  textMuted: '#9AA3B0',
  textFaint: '#6C7684',
  board: '#000000',
  boardText: '#FFAF3B',
  boardTextDim: '#7A6234',
  gaugeFill: '#4FB98C',
  gaugeTrack: '#2A303A',
  accent: '#6FA8E8',
  danger: '#E8756B',
};

export const palettes = { light, dark };

/** Consistent spacing scale, in points. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

/**
 * Monospace face for arrival numerals.
 *
 * Monospace keeps digits the same width, so a countdown ticking from
 * '10' to '9' does not make the whole row jump sideways.
 */
export const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const type = {
  /** Large arrival numeral. */
  eta: { fontFamily: monoFont, fontSize: 22, fontWeight: '700' as const },
  /** Smaller following-bus numerals. */
  etaSmall: { fontFamily: monoFont, fontSize: 14, fontWeight: '600' as const },
  /** Bus service number. */
  service: { fontSize: 20, fontWeight: '700' as const },
  /** Screen and section headings. */
  heading: { fontSize: 17, fontWeight: '600' as const },
  /** Standard body copy. */
  body: { fontSize: 15, fontWeight: '400' as const },
  /** Captions, road names, timestamps. */
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;
