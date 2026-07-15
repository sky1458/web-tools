import { useRef, useState } from 'react';
import type { CardData, ThemePreset, ThemeSource } from './types';
import { THEMES } from './types';
import styles from './ControlPanel.module.less';

interface ControlPanelProps {
  data: CardData;
  onFieldChange: (field: keyof CardData, value: string) => void;
  theme: ThemeSource;
  onThemeChange: (theme: ThemeSource) => void;
  customColor: string;
  onCustomColorChange: (hex: string) => void;
  onQrUpload: (dataUrl: string) => void;
  onDownload: () => void;
  downloading: boolean;
}

const PRESET_KEYS = Object.keys(THEMES) as ThemePreset[];

const DownloadSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ColorWheelSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function ControlPanel({
  data,
  onFieldChange,
  theme: activeTheme,
  onThemeChange,
  customColor,
  onCustomColorChange,
  onQrUpload,
  onDownload,
  downloading,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => onQrUpload(reader.result as string);
    reader.readAsDataURL(file);
  };

  const fields: { key: keyof CardData; label: string; placeholder: string }[] = [
    { key: 'name', label: '名字', placeholder: '扫一扫<br>添加好友' },
    { key: 'role', label: '角色', placeholder: 'WeChat Contact' },
    { key: 'org', label: '组织', placeholder: '微信用户' },
  ];

  return (
    <div className={styles.panel}>
      {/* Theme picker */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>主题配色</span>
        <div className={styles.themeRow}>
          {PRESET_KEYS.map((key) => {
            const t = THEMES[key];
            const isActive = key === activeTheme;
            return (
              <div
                key={key}
                className={`${styles.themeSwatch}${isActive ? ` ${styles.themeSwatchActive}` : ''}`}
                style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.gold})` }}
                title={key}
                onClick={() => onThemeChange(key)}
              />
            );
          })}
          {/* Custom color picker */}
          <input
            ref={colorInputRef}
            type="color"
            value={customColor}
            className={styles.colorInput}
            onChange={(e) => {
              onCustomColorChange(e.target.value);
              onThemeChange('custom');
            }}
          />
          <div
            className={`${styles.themeSwatch} ${styles.themeSwatchCustom}${activeTheme === 'custom' ? ` ${styles.themeSwatchActive}` : ''}`}
            style={{ background: customColor }}
            title="自定义颜色"
            onClick={() => colorInputRef.current?.click()}
          >
            {activeTheme !== 'custom' && <ColorWheelSvg />}
          </div>
        </div>
      </div>

      {/* Field inputs */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>名片信息</span>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className={styles.field}>
            <label className={styles.fieldLabel}>{label}</label>
            <input
              className={styles.input}
              type="text"
              value={data[key]}
              placeholder={placeholder}
              onChange={(e) => onFieldChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* QR upload */}
      <div className={styles.section}>
        <span className={styles.sectionTitle}>二维码</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
          <UploadSvg />
          选择图片
        </button>
        {fileName && <span className={styles.uploadFileName}>{fileName}</span>}
      </div>

      {/* Download */}
      <button
        className={styles.downloadBtn}
        onClick={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          '生成中...'
        ) : (
          <>
            <DownloadSvg />
            下载名片
          </>
        )}
      </button>
    </div>
  );
}
