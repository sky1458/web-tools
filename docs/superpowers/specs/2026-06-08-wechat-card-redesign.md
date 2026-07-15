# WeChat QR Card Redesign

**Date:** 2026-06-08
**Status:** Approved

## Goal

Restructure the WeChat QR business card component for maintainability and configurability:
- CSS Modules instead of global CSS
- Editable card fields via right-side control panel
- Theme preset switcher
- QR code image upload
- White page background, black card background

## File Structure

```
src/pages/index.tsx                    — Orchestrator: state owner, composes Card + ControlPanel
src/pages/index.module.less            — Page layout: white bg, left-right flex layout
src/pages/WechatCard/
  ├── Card.tsx                         — Pure presentational card, forwardRef for download
  ├── Card.module.less                 — Card styles (black bg, all visual effects)
  ├── ControlPanel.tsx                 — Right-side controls panel
  ├── ControlPanel.module.less         — Panel styles
  └── types.ts                         — Shared types (ThemePreset, CardData, ThemeColors)
```

Existing `src/pages/index.less` (global `wc-*` CSS) — deleted.

## Component Tree & Data Flow

```
index.tsx  (state: cardData, theme, particles)
  ├── <Card ref={cardRef} data={cardData} theme={THEMES[theme]} particles={particles} />
  └── <ControlPanel
        data={cardData}
        onFieldChange={...}
        theme={theme}
        onThemeChange={...}
        onQrUpload={...}
        onDownload={handleDownload}
      />
```

- **index.tsx** — owns all state. `cardRef` for html2canvas. `handleDownload` runs capture logic.
- **Card** — `forwardRef<HTMLDivElement>`. Pure render. Zero logic, zero side effects.
- **ControlPanel** — all interactive widgets. Fires callbacks upward. Stateless itself.

## Types (`types.ts`)

```ts
type ThemePreset = 'wechat' | 'midnight' | 'sunset' | 'glacier';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  gold: string;
  goldLight: string;
}

interface CardData {
  name: string;
  role: string;
  org: string;
  qrImage: string;
}
```

## Theme Presets

| Theme | Primary | Gold | Vibe |
|-------|---------|------|------|
| wechat (default) | `#07c160` / `#06ad56` | `#d4a853` / `#f0d68a` | Classic WeChat green |
| midnight | `#6366f1` / `#4f46e5` | `#a78bfa` / `#c4b5fd` | Indigo purple |
| sunset | `#f97316` / `#ea580c` | `#fbbf24` / `#fde68a` | Warm orange amber |
| glacier | `#06b6d4` / `#0891b2` | `#67e8f9` / `#a5f3fc` | Cyan blue |

Card background stays `#000000` regardless of theme. Theme only affects accent colors.

## ControlPanel Widgets

1. **Theme picker** — 4 colored swatches in a row, click to select. Active swatch has border/checkmark.
2. **Field inputs** — 3 text inputs for name, role, org. Labeled. Name supports `<br>`.
3. **QR upload** — Hidden `<input type="file" accept="image/*">` + styled trigger button. Shows filename.
4. **Download button** — Triggers `onDownload()`. Shows "生成中..." while loading.

## Download Logic

- In `index.tsx`. `html2canvas` with `backgroundColor: '#000000'`.
- `.capturing` class toggled before capture to hide `::before` shimmer.
- `requestAnimationFrame` wait ensures CSS update rendered.
- Cleanup on both success and error paths.

## Cleanup

Remove:
- `src/pages/index.less` — all global `wc-*` classes
- `src/pages/index.tsx` — inline component code → extracted to `Card.tsx`
- Tilt effect (handleMouseMove/handleMouseLeave) — dropped for simplicity

Keep:
- `src/pages/docs.tsx` — untouched
- `src/layouts/` — untouched
