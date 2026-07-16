import { useState, useRef, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import qrDefault from '@/assets/qrcode_wechat.jpg';

import Card, { generateCustomTheme } from './WechatCard/Card';
import ControlPanel from './WechatCard/ControlPanel';
import { THEMES } from './WechatCard/types';
import type { CardData, ThemeSource } from './WechatCard/types';
import styles from './index.module.less';

const DEFAULT_PARTICLES = 30;
const SCALE = 8;

function makeParticles(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: 60 + Math.random() * 40,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 10,
  }));
}

export default function WechatCardPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardData, setCardData] = useState<CardData>({
    name: '扫一扫<br>添加好友',
    role: 'WeChat Contact',
    org: '微信用户',
    qrImage: qrDefault,
  });
  const [themeSource, setThemeSource] = useState<ThemeSource>('wechat');
  const [customColor, setCustomColor] = useState('#07c160');
  const [downloading, setDownloading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [particles] = useState(() => makeParticles(DEFAULT_PARTICLES));

  const theme = useMemo(() => {
    if (themeSource === 'custom') return generateCustomTheme(customColor);
    return THEMES[themeSource];
  }, [themeSource, customColor]);

  const handleFieldChange = useCallback(
    (field: keyof CardData, value: string) => {
      setCardData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleDownload = useCallback(async () => {
    if (downloading || !cardRef.current) return;
    setDownloading(true);
    setCapturing(true);

    try {
      await new Promise((r) => {
        requestAnimationFrame(r);
      });
      const rawCanvas = await html2canvas(cardRef.current, {
        backgroundColor: '#000000',
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
      });

      // Clip rounded corners — html2canvas doesn't support border-radius clipping
      const canvas = document.createElement('canvas');
      canvas.width = rawCanvas.width;
      canvas.height = rawCanvas.height;
      const ctx = canvas.getContext('2d')!;
      const scale = SCALE;
      const radius = 28 * scale;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(canvas.width - radius, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, radius, radius);
      ctx.lineTo(canvas.width, canvas.height - radius);
      ctx.arcTo(
        canvas.width,
        canvas.height,
        canvas.width - radius,
        canvas.height,
        radius,
      );
      ctx.lineTo(radius, canvas.height);
      ctx.arcTo(0, canvas.height, 0, canvas.height - radius, radius);
      ctx.lineTo(0, radius);
      ctx.arcTo(0, 0, radius, 0, radius);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(rawCanvas, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '微信名片.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
        setCapturing(false);
      }, 'image/png');
    } catch {
      setDownloading(false);
      setCapturing(false);
      alert('下载失败，请重试');
    }
  }, [downloading]);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.cardArea}>
          <Card
            ref={cardRef}
            data={cardData}
            theme={theme}
            particles={particles}
            capturing={capturing}
          />
        </div>
        <ControlPanel
          data={cardData}
          onFieldChange={handleFieldChange}
          theme={themeSource}
          onThemeChange={setThemeSource}
          customColor={customColor}
          onCustomColorChange={setCustomColor}
          onQrUpload={(dataUrl) => handleFieldChange('qrImage', dataUrl)}
          onDownload={handleDownload}
          downloading={downloading}
        />
      </div>
    </div>
  );
}
