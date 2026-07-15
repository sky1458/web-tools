import { forwardRef } from 'react';
import type { CardData, ThemeColors } from './types';
import styles from './Card.module.less';

interface CardProps {
  data: CardData;
  theme: ThemeColors;
  particles: { id: number; left: number; top: number; delay: number; duration: number }[];
  capturing: boolean;
}

// ── helpers ──

function hexToRgb(hex: string): string {
  const v = parseInt(hex.replace('#', ''), 16);
  return `${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}`;
}

function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function blendHex(hex: string, target: string, ratio: number): string {
  const r1 = parseInt(hex.slice(1, 3), 16);
  const g1 = parseInt(hex.slice(3, 5), 16);
  const b1 = parseInt(hex.slice(5, 7), 16);
  const r2 = parseInt(target.slice(1, 3), 16);
  const g2 = parseInt(target.slice(3, 5), 16);
  const b2 = parseInt(target.slice(5, 7), 16);
  const r = Math.round(r1 * ratio + r2 * (1 - ratio));
  const g = Math.round(g1 * ratio + g2 * (1 - ratio));
  const b = Math.round(b1 * ratio + b2 * (1 - ratio));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── theme → CSS vars ──

function themeCssVars(t: ThemeColors): Record<string, string> {
  const p = hexToRgb(t.primary);
  const g = hexToRgb(t.gold);
  return {
    '--primary': t.primary,
    '--primaryDark': t.primaryDark,
    '--gold': t.gold,
    '--goldLight': t.goldLight,
    '--p-10': `rgba(${p}, 0.1)`,
    '--p-12': `rgba(${p}, 0.12)`,
    '--p-20': `rgba(${p}, 0.2)`,
    '--p-30': `rgba(${p}, 0.3)`,
    '--p-40': `rgba(${p}, 0.4)`,
    '--g-20': `rgba(${g}, 0.2)`,
    '--g-30': `rgba(${g}, 0.3)`,
    '--g-35': `rgba(${g}, 0.35)`,
    '--card-bg': t.cardBg,
    '--text-primary': t.textPrimary,
    '--text-secondary': t.textSecondary,
    '--text-muted': t.textMuted,
    '--badge-bg': `rgba(${p}, 0.1)`,
    '--badge-border': `rgba(${p}, 0.18)`,
    '--divider-alpha': `rgba(${p}, 0.12)`,
    '--scan-accent': t.gold,
    '--qr-glow-color': `rgba(${p}, 0.15)`,
  };
}

// ── custom color → ThemeColors ──

export function generateCustomTheme(hex: string): ThemeColors {
  const lum = luminance(hex);
  const isDark = lum < 128;
  const [h, s, l] = hexToHsl(hex);
  const goldH = (h + 42) % 360;
  const primaryDark = blendHex(hex, '#000000', 0.78);
  const gold = hslToHex(goldH, Math.min(s, 70), isDark ? 65 : 45);
  const goldLight = hslToHex(goldH, Math.min(s, 60), isDark ? 80 : 60);

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

  return {
    primary: hex,
    primaryDark,
    gold,
    goldLight,
    cardBg: isDark ? blendHex(hex, '#0a0a0f', 0.18) : blendHex(hex, '#ffffff', 0.15),
    ...(isDark ? LIGHT_TEXT : DARK_TEXT),
  };
}

// ── SVG icons ──

const QR_FRAME = { width: 960, height: 944 };

const WechatSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.906 2.495 3.205 3.805 5.498 3.799.52-.002 1.038-.08 1.54-.235l1.733 1.014a.317.317 0 0 0 .157.048c.158 0 .288-.13.288-.292a.352.352 0 0 0-.046-.16l-.385-1.445a.59.59 0 0 1 .206-.643C20.453 18.053 22 16.325 22 14.231c0-2.926-2.37-5.318-5.062-5.373zm-2.363 2.242c.553 0 1 .453 1 1.01a1.004 1.004 0 0 1-1 1.008c-.553 0-1-.453-1-1.009a1.004 1.004 0 0 1 1-1.009zm4.726 0c.553 0 1 .453 1 1.01a1.004 1.004 0 0 1-1 1.008c-.553 0-1-.453-1-1.009a1.004 1.004 0 0 1 1-1.009z" />
  </svg>
);

const ScanSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

const Card = forwardRef<HTMLDivElement, CardProps>(({ data, theme, particles, capturing }, ref) => {
  const cardClass = `${styles.card}${capturing ? ` ${styles.capturing}` : ''}`;
  const cssVars = themeCssVars(theme) as React.CSSProperties;

  return (
    <div className={cardClass} ref={ref} style={cssVars}>
      {/* Decorative accents */}
      <div className={`${styles.accent} ${styles.accentTL}`} />
      <div className={`${styles.accent} ${styles.accentBR}`} />

      {/* QR at top */}
      <div className={styles.qrFrame}>
        <div className={styles.qrGlow} />
        <img src={data.qrImage} alt="微信二维码" width={QR_FRAME.width} height={QR_FRAME.height} />
      </div>

      {/* WeChat badge */}
      <div className={styles.badge}>
        <WechatSvg />
        微信扫码添加
      </div>

      {/* Info */}
      <div className={styles.info}>
        <span className={styles.label}>微信名片</span>
        <h1 className={styles.name} dangerouslySetInnerHTML={{ __html: data.name }} />
        <p className={styles.role}>{data.role}</p>
        <p className={styles.orgText}>{data.org}</p>
        <div className={styles.contactRow}>
          <span className={styles.contactItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            微信扫码
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Scan hint */}
      <div className={styles.scanHint}>
        <span>打开微信</span>
        <span className={styles.scanIcon}>
          <ScanSvg />
          扫一扫
        </span>
        <span>识别二维码</span>
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
