export type ThemePreset =
  | 'cream'
  | 'rose'
  | 'mint'
  | 'sky'
  | 'lavender'
  | 'sunset'
  | 'wechat'
  | 'glacier'
  | 'midnight'
  | 'onyx';

export type ThemeSource = ThemePreset | 'custom';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  gold: string;
  goldLight: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export interface CardData {
  name: string;
  role: string;
  org: string;
  qrImage: string;
}

// ── 10 presets light→dark ──

type PresetMap = Record<ThemePreset, ThemeColors>;

const LIGHT_TEXT = {
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.35)',
};

const DARK_TEXT = {
  textPrimary: 'rgba(0,0,0,0.82)',
  textSecondary: 'rgba(0,0,0,0.5)',
  textMuted: 'rgba(0,0,0,0.35)',
};

export const THEMES: PresetMap = {
  // ── light ──
  cream: {
    primary: '#d4a853',
    primaryDark: '#b8963e',
    gold: '#f59e0b',
    goldLight: '#fcd34d',
    cardBg: '#fef9ed',
    ...DARK_TEXT,
  },
  rose: {
    primary: '#f43f5e',
    primaryDark: '#e11d48',
    gold: '#fb7185',
    goldLight: '#fda4af',
    cardBg: '#fff1f3',
    ...DARK_TEXT,
  },
  mint: {
    primary: '#10b981',
    primaryDark: '#059669',
    gold: '#34d399',
    goldLight: '#6ee7b7',
    cardBg: '#ecfdf7',
    ...DARK_TEXT,
  },
  sky: {
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    gold: '#38bdf8',
    goldLight: '#7dd3fc',
    cardBg: '#f0f9ff',
    ...DARK_TEXT,
  },
  lavender: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    gold: '#a78bfa',
    goldLight: '#c4b5fd',
    cardBg: '#f5f3ff',
    ...DARK_TEXT,
  },

  // ── dark ──
  sunset: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    gold: '#fbbf24',
    goldLight: '#fde68a',
    cardBg: '#1c1410',
    ...LIGHT_TEXT,
  },
  wechat: {
    primary: '#07c160',
    primaryDark: '#06ad56',
    gold: '#d4a853',
    goldLight: '#f0d68a',
    cardBg: '#0d1a12',
    ...LIGHT_TEXT,
  },
  glacier: {
    primary: '#06b6d4',
    primaryDark: '#0891b2',
    gold: '#67e8f9',
    goldLight: '#a5f3fc',
    cardBg: '#0c1a1e',
    ...LIGHT_TEXT,
  },
  midnight: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    gold: '#a78bfa',
    goldLight: '#c4b5fd',
    cardBg: '#0e0f2e',
    ...LIGHT_TEXT,
  },
  onyx: {
    primary: '#78716c',
    primaryDark: '#57534e',
    gold: '#a8a29e',
    goldLight: '#d6d3d1',
    cardBg: '#0c0c0c',
    ...LIGHT_TEXT,
  },
};
