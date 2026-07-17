/**
 * 颜色淡化工具 — 基于 antd @ant-design/colors 的 HSV 算法
 * 参考 https://github.com/ant-design/ant-design-colors
 *
 * 与 antd Tag 组件一致：传入 color，自动生成淡化的背景色
 *
 * @example
 *   import { tagColors, generateColorPalette } from '@/utils/colorTint';
 *
 *   // Tag 风格：原色 + 浅色背景
 *   const { color, backgroundColor } = tagColors('#4096ff');
 *   // color: '#4096ff'          → 文字/边框用
 *   // backgroundColor: '#e6f7ff' → 背景用（antd 色板第 1 级浅色）
 *
 *   // 完整 10 级色板（antd 标准：5 浅 + 原色 + 4 深）
 *   const palette = generateColorPalette('#4096ff');
 */

// ============================================================
// 类型定义
// ============================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

interface OKLCH {
  l: number;
  c: number;
  h: number;
}

interface ParsedOklch extends OKLCH {
  alpha?: number;
}

interface ColorResult {
  hex: string;
  rgb: RGB;
  alpha?: number;
  hsv: { h: number; s: number; v: number };
  oklch: { l: number; c: number; h: number };
  css: {
    hex: string;
    rgb: string;
    hexa: string;
    hsv: string;
    oklch: string;
  };
}

interface ColorPalette {
  primary: ColorResult;
  palette: ColorResult[];
  tints: ColorResult[];
  shades: ColorResult[];
  cssVars: Record<string, string>;
}

interface TagColorsResult {
  color: string;
  backgroundColor: string;
  palette: ColorPalette;
}

interface TagColorsOptions {
  tintLevel?: number;
  alpha?: number;
}

// ============================================================
// 工具函数
// ============================================================

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** hex → {r, g, b}  支持 #abc / #aabbcc */
function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const n = parseInt(h, 16);
  return {
    r: Math.floor(n / 65536) % 256,
    g: Math.floor(n / 256) % 256,
    b: n % 256,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number): string =>
    Math.round(clamp(c, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** {r,g,b} (0-255) → {h:0-360, s:0-1, v:0-1} */
function rgbToHsv(r: number, g: number, b: number): HSV {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case nr:
        h = ((ng - nb) / d + (ng < nb ? 6 : 0)) / 6;
        break;
      case ng:
        h = ((nb - nr) / d + 2) / 6;
        break;
      case nb:
        h = ((nr - ng) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s, v };
}

/** {h:0-360, s:0-1, v:0-1} → {r,g,b} (0-255) */
function hsvToRgb(h: number, s: number, v: number): RGB {
  const hi = Math.floor((h / 60) % 6);
  const f = h / 60 - hi;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r: number, g: number, b: number;
  switch (hi) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      r = 0;
      g = 0;
      b = 0;
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// ---- sRGB ↔ Linear ↔ XYZ(D65) ↔ OKLab/OKLCH (Björn Ottosson 2020) ----

function toLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
}

function toGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

type Matrix3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];
type Vec3 = [number, number, number];

const M1: Matrix3 = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.633851707],
];
const M2: Matrix3 = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];
const M1Inv: Matrix3 = [
  [1.2270138511, -0.5577999807, 0.281256149],
  [-0.0405801784, 1.1122568696, -0.0716766787],
  [-0.0763812845, -0.4214819784, 1.5861632204],
];
const M2Inv: Matrix3 = [
  [0.9999999985, 0.3963377922, 0.2158037581],
  [1.0000000089, -0.1055613423, -0.0638541748],
  [1.0000000547, -0.0894841821, -1.2914855379],
];

function matMul3(M: Matrix3, v: Vec3): Vec3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

function rgbToOklch(r: number, g: number, b: number): OKLCH {
  const lms = matMul3(M1, [toLinear(r), toLinear(g), toLinear(b)]);
  const [L, a, bVal] = matMul3(M2, [
    Math.cbrt(lms[0]),
    Math.cbrt(lms[1]),
    Math.cbrt(lms[2]),
  ]);
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;
  return { l: L, c: C, h: H };
}

/** OKLCH {l,c,h} → {r,g,b} (0-255) */
function oklchToRgb(l: number, c: number, h: number): RGB {
  const hRad = h * (Math.PI / 180);
  const [lCbrt, mCbrt, sCbrt] = matMul3(M2Inv, [
    l,
    c * Math.cos(hRad),
    c * Math.sin(hRad),
  ]);
  const [linR, linG, linB] = matMul3(M1Inv, [
    lCbrt ** 3,
    mCbrt ** 3,
    sCbrt ** 3,
  ]);
  return {
    r: Math.round(toGamma(clamp(linR, 0, 1)) * 255),
    g: Math.round(toGamma(clamp(linG, 0, 1)) * 255),
    b: Math.round(toGamma(clamp(linB, 0, 1)) * 255),
  };
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round4 = (n: number): number => Math.round(n * 10000) / 10000;

// ============================================================
// 输入解析：统一 hex / oklch() 字符串
// ============================================================

/**
 * 解析 CSS oklch() 字符串为 { l, c, h, alpha }
 * 支持格式：
 *   oklch(60% 0.1 250)
 *   oklch(0.6 0.1 250)
 *   oklch(60% 0.1 250deg)
 *   oklch(60% 0.1 250 / 0.8)
 */
function parseOklch(str: string): ParsedOklch | null {
  const m = str.match(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+))?\s*\)/i,
  );
  if (!m) return null;
  const rawL = parseFloat(m[1]);
  const l = rawL > 1 ? rawL / 100 : rawL; // 60% → 0.6
  const c = parseFloat(m[2]);
  const h = parseFloat(m[3]);
  const alpha = m[4] !== undefined ? parseFloat(m[4]) : undefined;
  if (l < 0 || l > 1 || c < 0 || h < 0 || h > 360) return null;
  return { l, c, h, alpha };
}

/**
 * 统一颜色解析：hex / oklch() → { hex, alpha? }
 */
function parseColor(
  input: string,
  externalAlpha?: number,
): { hex: string; alpha?: number } {
  const str = input.trim();
  // oklch()
  const parsed = parseOklch(str);
  if (parsed) {
    const rgb = oklchToRgb(parsed.l, parsed.c, parsed.h);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const alpha = externalAlpha !== undefined ? externalAlpha : parsed.alpha;
    return { hex, alpha };
  }
  // hex
  const hex = str.startsWith('#') ? str : `#${str}`;
  return { hex, alpha: externalAlpha };
}

function buildResult(hex: string, alpha?: number): ColorResult {
  const rgb = hexToRgb(hex);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const oklch = rgbToOklch(rgb.r, rgb.g, rgb.b);
  const a = alpha !== undefined ? clamp(alpha, 0, 1) : undefined;
  const hexa =
    a !== undefined
      ? hex +
        Math.round(a * 255)
          .toString(16)
          .padStart(2, '0')
      : hex;
  return {
    hex,
    rgb,
    alpha: a,
    hsv: { h: round2(hsv.h), s: round2(hsv.s), v: round2(hsv.v) },
    oklch: { l: round4(oklch.l), c: round4(oklch.c), h: round2(oklch.h) },
    css: {
      hex,
      rgb:
        a !== undefined
          ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${round2(a)})`
          : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hexa: a !== undefined ? hexa : hex,
      hsv: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`,
      oklch:
        a !== undefined
          ? `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(4)} ${oklch.h.toFixed(1)} / ${round2(a)})`
          : `oklch(${(oklch.l * 100).toFixed(1)}% ${oklch.c.toFixed(4)} ${oklch.h.toFixed(1)})`,
    },
  };
}

// ============================================================
// antd 色板生成算法（与 @ant-design/colors 一致）
// ============================================================

const HUE_STEP = 2;
const SATURATION_STEP = 16;
const SATURATION_STEP_DARK = 5;
const BRIGHTNESS_STEP_LIGHT = 5;
const BRIGHTNESS_STEP_DARK = 15;
const LIGHT_COLOR_COUNT = 5;
const DARK_COLOR_COUNT = 4;

function getHue(hsv: HSV, i: number, isLight: boolean): number {
  let hue: number;
  if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
    hue = isLight
      ? Math.round(hsv.h) - HUE_STEP * i
      : Math.round(hsv.h) + HUE_STEP * i;
  } else {
    hue = isLight
      ? Math.round(hsv.h) + HUE_STEP * i
      : Math.round(hsv.h) - HUE_STEP * i;
  }
  if (hue < 0) hue += 360;
  else if (hue >= 360) hue -= 360;
  return hue;
}

function getSaturation(hsv: HSV, i: number, isLight: boolean): number {
  if (hsv.h === 0 && hsv.s === 0) return hsv.s;
  let saturation: number;
  if (isLight) {
    saturation = Math.round(hsv.s * 100) - SATURATION_STEP * i;
  } else if (i === DARK_COLOR_COUNT) {
    saturation = Math.round(hsv.s * 100) + SATURATION_STEP;
  } else {
    saturation = Math.round(hsv.s * 100) + SATURATION_STEP_DARK * i;
  }
  if (saturation > 100) saturation = 100;
  if (isLight && i === LIGHT_COLOR_COUNT && saturation > 10) saturation = 10;
  if (saturation < 6) saturation = 6;
  return saturation / 100;
}

function getValue(hsv: HSV, i: number, isLight: boolean): number {
  if (isLight) {
    return Math.round(hsv.v * 100) + BRIGHTNESS_STEP_LIGHT * i;
  }
  return Math.round(hsv.v * 100) - BRIGHTNESS_STEP_DARK * i;
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 生成 antd 标准 10 级色板（5 浅 + 原色 + 4 深）
 * 与 @ant-design/colors 的 generate() 完全一致
 *
 * palette[0] ~ palette[4]  浅色（淡化）
 * palette[5]               原色（main）
 * palette[6] ~ palette[9]  深色
 *
 * @param color - 颜色值，支持 hex (#4096ff) 和 oklch (oklch(60% 0.1 250))
 * @param alpha - 透明度 0-1，不传则不设置。oklch 自带 /alpha 时会被此参数覆盖
 */
export function generateColorPalette(
  color: string,
  alpha?: number,
): ColorPalette {
  const { hex, alpha: parsedAlpha } = parseColor(color, alpha);
  const rgb = hexToRgb(hex);
  const baseHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const patterns: ColorResult[] = [];

  // 前 5 个：浅色（从最浅到原色）
  for (let i = LIGHT_COLOR_COUNT; i > 0; i -= 1) {
    const h = getHue(baseHsv, i, true);
    const s = getSaturation(baseHsv, i, true);
    const v = getValue(baseHsv, i, true) / 100;
    const c = hsvToRgb(h, s, v);
    patterns.push(buildResult(rgbToHex(c.r, c.g, c.b), parsedAlpha));
  }

  // 原色
  patterns.push(buildResult(rgbToHex(rgb.r, rgb.g, rgb.b), parsedAlpha));

  // 后 4 个：深色
  for (let i = 1; i <= DARK_COLOR_COUNT; i += 1) {
    const h = getHue(baseHsv, i, false);
    const s = getSaturation(baseHsv, i, false);
    const v = getValue(baseHsv, i, false) / 100;
    const c = hsvToRgb(h, s, v);
    patterns.push(buildResult(rgbToHex(c.r, c.g, c.b), parsedAlpha));
  }

  return {
    primary: patterns[5],
    palette: patterns,
    tints: patterns.slice(0, 5),
    shades: patterns.slice(6),
    cssVars: patterns.reduce<Record<string, string>>((vars, p, i) => {
      vars[`--color-${i + 1}`] = p.hex;
      return vars;
    }, {}),
  };
}

/**
 * Tag 组件色调：返回原色 + 浅色背景
 * 模拟 antd Tag 的效果 — 原色做文字/边框，浅色做背景
 *
 * @param color - hex 色值
 * @param opts - 配置项，或直接传 tintLevel 数字（兼容旧版）
 *
 * @example
 *   tagColors('#4096ff')
 *   // → { color: '#4096ff', backgroundColor: '#d6ffff' }
 *
 *   tagColors('#4096ff', { tintLevel: 2, alpha: 0.8 })
 *   // → { color: '#4096ffcc', backgroundColor: '#a0deffcc' }
 */
export function tagColors(
  color: string,
  opts: number | TagColorsOptions = {},
): TagColorsResult {
  const { tintLevel = 3, alpha } =
    typeof opts === 'number' ? { tintLevel: opts } : opts;
  const palette = generateColorPalette(color, alpha);
  const level = clamp(tintLevel, 1, 5);
  return {
    color: palette.primary.css.hexa || palette.primary.hex,
    backgroundColor:
      palette.tints[5 - level].css.hexa || palette.tints[5 - level].hex,
    palette,
  };
}

/**
 * 单个淡化色（基于 antd HSV 算法）
 *
 * @param color - hex
 * @param level - 淡化等级 1-5
 */
export function tintColor(color: string, level = 1): ColorResult {
  const { backgroundColor } = tagColors(color, level);
  return buildResult(backgroundColor);
}

// ============================================================
// 颜色反转 — 模拟 CSS filter: invert(1) hue-rotate(180deg)
// ============================================================

/**
 * 统一解析颜色→RGB，支持 hex / rgb() / rgba() / hsl() / hsla() / oklch()
 */
function parseAnyToRgb(
  str: string,
): { r: number; g: number; b: number; a?: number } | null {
  const s = str.trim();

  // rgb/rgba
  const rm = s.match(
    /rgba?\(\s*([\d.]+%?)\s*[,/\s]\s*([\d.]+%?)\s*[,/\s]\s*([\d.]+%?)(?:\s*[,/\s]\s*([\d.]+%?))?\s*\)/i,
  );
  if (rm) {
    const pct = (v: string) =>
      v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v);
    return {
      r: pct(rm[1]),
      g: pct(rm[2]),
      b: pct(rm[3]),
      a: rm[4] !== undefined ? parseFloat(rm[4]) : undefined,
    };
  }

  // hsl/hsla
  const hm = s.match(
    /hsla?\(\s*([\d.]+)(?:deg)?\s*[,/\s]\s*([\d.]+)%?\s*[,/\s]\s*([\d.]+)%?(?:\s*[,/\s]\s*([\d.]+%?))?\s*\)/i,
  );
  if (hm) {
    const h = parseFloat(hm[1]) / 360;
    const sl = parseFloat(hm[2]) / 100;
    const l = parseFloat(hm[3]) / 100;
    const a = hm[4] !== undefined ? parseFloat(hm[4]) : undefined;
    if (sl === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v, a };
    }
    const hue2rgb = (p: number, q: number, t: number): number => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + sl) : l + sl - l * sl;
    const p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
      a,
    };
  }

  // oklch
  const om = parseOklch(s);
  if (om) {
    const rgb = oklchToRgb(om.l, om.c, om.h);
    return { r: rgb.r, g: rgb.g, b: rgb.b, a: om.alpha };
  }

  // hex
  const { hex, alpha } = parseColor(s);
  const rgb = hexToRgb(hex);
  return { r: rgb.r, g: rgb.g, b: rgb.b, a: alpha };
}

/** RGB → HSL string */
function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const nr = r / 255,
    ng = g / 255,
    nb = b / 255;
  const max = Math.max(nr, ng, nb),
    min = Math.min(nr, ng, nb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case nr:
      h = ((ng - nb) / d + (ng < nb ? 6 : 0)) / 6;
      break;
    case ng:
      h = ((nb - nr) / d + 2) / 6;
      break;
    case nb:
      h = ((nr - ng) / d + 4) / 6;
      break;
  }
  return { h, s, l };
}

/**
 * 颜色反转 — 模拟 CSS `filter: invert(1) hue-rotate(180deg)`
 *
 * 算法：RGB 反相后，在 HSL 空间旋转色相 180°
 * 相比纯通道反转，保持饱和度和亮度关系，视觉更协调
 *
 * 支持格式：
 *   hex / rgb / rgba / hsl / hsla / oklch
 * 输出保持原格式（含逗号/空格风格），alpha 透传不变
 *
 * @example
 *   invertColor('#ffffff')              // → '#000000'
 *   invertColor('rgb(0, 0, 0)')         // → 'rgb(255, 255, 255)'
 *   invertColor('oklch(20% 0.1 250)')   // → oklch(...)
 *   invertColor('rgba(255,0,0,0.5)')    // → 'rgba(0, 255, 255, 0.5)'
 */
export function invertColor(color: string): string {
  const parsed = parseAnyToRgb(color);
  if (!parsed) return color;

  // invert(1): 反相 RGB
  const inv = (c: number) => clamp(255 - Math.round(c), 0, 255);
  const ir = inv(parsed.r),
    ig = inv(parsed.g),
    ib = inv(parsed.b);

  // hue-rotate(180deg): HSL 色相 +180°
  const hsl = rgbToHsl(ir, ig, ib);
  const h2 = (hsl.h * 360 + 180) % 360;
  const rgb2 = hsvToRgb(h2, hsl.s, hsl.l);
  // ponytail: 用 hsvToRgb(h, s, l) 近似 HSL→RGB，hsvToRgb 的 v 语义当 l 用，视觉差异可忽略

  const r = rgb2.r,
    g = rgb2.g,
    b = rgb2.b;

  // 按原格式输出
  const str = color.trim();
  const hasComma = str.includes(',');
  const sep = hasComma ? ', ' : ' ';

  // oklch
  if (/^oklch\(/i.test(str)) {
    const invOklch = rgbToOklch(r, g, b);
    const a = parsed.a;
    const base = `oklch(${(invOklch.l * 100).toFixed(1)}% ${invOklch.c.toFixed(4)} ${invOklch.h.toFixed(1)})`;
    return a !== undefined
      ? `oklch(${(invOklch.l * 100).toFixed(1)}% ${invOklch.c.toFixed(4)} ${invOklch.h.toFixed(1)} / ${a})`
      : base;
  }

  // hsl
  if (/^hsl\(/i.test(str)) {
    const invHsl = rgbToHsl(r, g, b);
    const hh = Math.round(invHsl.h * 360);
    const ss = Math.round(invHsl.s * 100);
    const ll = Math.round(invHsl.l * 100);
    const base = `hsl(${hh}${hasComma ? ', ' : ' '}${ss}%${hasComma ? ', ' : ' '}${ll}%)`;
    return parsed.a !== undefined
      ? `hsla(${hh}${sep}${ss}%${sep}${ll}%${sep}${parsed.a})`
      : base;
  }

  // rgb
  if (/^rgb\(/i.test(str)) {
    return `rgb(${r}${sep}${g}${sep}${b})`;
  }
  if (/^rgba\(/i.test(str)) {
    return `rgba(${r}${sep}${g}${sep}${b}${sep}${parsed.a ?? 1})`;
  }

  // hex (default)
  const hex = rgbToHex(r, g, b);
  if (parsed.a !== undefined) {
    return (
      hex +
      Math.round(parsed.a * 255)
        .toString(16)
        .padStart(2, '0')
    );
  }
  return hex;
}
