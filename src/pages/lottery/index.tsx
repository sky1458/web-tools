import { useState, useCallback } from 'react';
import styles from './index.module.less';

// ── types ──
type LotteryType = 'ssq' | 'dlt' | 'fc3d' | 'qxc' | 'pl5';
type SelectMode = 'single' | 'compound';

interface GroupConfig {
  key: string;
  label: string;
  range: [number, number];
  pickCount: number;
}

interface LotteryConfig {
  name: string;
  groups: GroupConfig[];
}

// ── configs ──
const LOTTERIES: Record<LotteryType, LotteryConfig> = {
  ssq: {
    name: '双色球',
    groups: [
      { key: 'red', label: '红球', range: [1, 33], pickCount: 6 },
      { key: 'blue', label: '蓝球', range: [1, 16], pickCount: 1 },
    ],
  },
  dlt: {
    name: '大乐透',
    groups: [
      { key: 'front', label: '前区', range: [1, 35], pickCount: 5 },
      { key: 'back', label: '后区', range: [1, 12], pickCount: 2 },
    ],
  },
  fc3d: {
    name: '福彩3D',
    groups: [
      { key: 'bai', label: '百位', range: [0, 9], pickCount: 1 },
      { key: 'shi', label: '十位', range: [0, 9], pickCount: 1 },
      { key: 'ge', label: '个位', range: [0, 9], pickCount: 1 },
    ],
  },
  qxc: {
    name: '7星彩',
    groups: [
      { key: 'p1', label: '第1位', range: [0, 9], pickCount: 1 },
      { key: 'p2', label: '第2位', range: [0, 9], pickCount: 1 },
      { key: 'p3', label: '第3位', range: [0, 9], pickCount: 1 },
      { key: 'p4', label: '第4位', range: [0, 9], pickCount: 1 },
      { key: 'p5', label: '第5位', range: [0, 9], pickCount: 1 },
      { key: 'p6', label: '第6位', range: [0, 9], pickCount: 1 },
      { key: 'p7', label: '第7位', range: [0, 9], pickCount: 1 },
    ],
  },
  pl5: {
    name: '排列5',
    groups: [
      { key: 'w', label: '万位', range: [0, 9], pickCount: 1 },
      { key: 'q', label: '千位', range: [0, 9], pickCount: 1 },
      { key: 'b', label: '百位', range: [0, 9], pickCount: 1 },
      { key: 's', label: '十位', range: [0, 9], pickCount: 1 },
      { key: 'g', label: '个位', range: [0, 9], pickCount: 1 },
    ],
  },
};

const isPoolLottery = (t: LotteryType) => t === 'ssq' || t === 'dlt';

// ── helpers ──
function randomPick(min: number, max: number, count: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

function toggle(arr: number[], num: number, limit: number): number[] {
  const idx = arr.indexOf(num);
  if (idx >= 0) return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
  if (arr.length >= limit) return arr;
  return [...arr, num];
}

// ── component ──
export default function LotteryPage() {
  const [type, setType] = useState<LotteryType>('ssq');
  const [selected, setSelected] = useState<Record<string, number[]>>({});
  const [mode, setMode] = useState<SelectMode>('single');
  const [compoundCount, setCompoundCount] = useState<Record<string, number>>(
    {},
  );

  const config = LOTTERIES[type];
  const isPool = isPoolLottery(type);

  const getLimit = useCallback(
    (groupKey: string) => {
      const g = config.groups.find((x) => x.key === groupKey)!;
      if (mode === 'single') return g.pickCount;
      return compoundCount[groupKey] ?? g.pickCount;
    },
    [config, mode, compoundCount],
  );

  const handleToggle = useCallback(
    (groupKey: string, num: number) => {
      setSelected((prev) => {
        const cur = prev[groupKey] ?? [];
        const limit = getLimit(groupKey);
        return { ...prev, [groupKey]: toggle(cur, num, limit) };
      });
    },
    [getLimit],
  );

  const handleRandom = useCallback(() => {
    const next: Record<string, number[]> = {};
    for (const g of config.groups) {
      const [min, max] = g.range;
      const count =
        mode === 'single' ? g.pickCount : (compoundCount[g.key] ?? g.pickCount);
      next[g.key] = randomPick(min, max, count);
    }
    setSelected(next);
  }, [config, mode, compoundCount]);

  const handleClear = useCallback(() => setSelected({}), []);

  const handleTypeChange = useCallback((t: LotteryType) => {
    setType(t);
    setSelected({});
    setCompoundCount({});
    if (!isPoolLottery(t)) setMode('single');
  }, []);

  const isComplete = config.groups.every(
    (g) => (selected[g.key]?.length ?? 0) >= getLimit(g.key),
  );

  const adjustCompound = useCallback(
    (groupKey: string, delta: number) => {
      setCompoundCount((prev) => {
        const g = config.groups.find((x) => x.key === groupKey)!;
        const cur = prev[groupKey] ?? g.pickCount;
        const next = cur + delta;
        const max = g.range[1] - g.range[0] + 1;
        if (next < g.pickCount || next > max) return prev;
        return { ...prev, [groupKey]: next };
      });
      // trim excess selections when count decreases
      setSelected((prev) => {
        const cur = prev[groupKey] ?? [];
        const g = config.groups.find((x) => x.key === groupKey)!;
        const limit = (compoundCount[groupKey] ?? g.pickCount) + delta;
        if (cur.length > limit) {
          return { ...prev, [groupKey]: cur.slice(0, limit) };
        }
        return prev;
      });
    },
    [config, compoundCount],
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>彩票号码生成器</h1>

      {/* ── type select ── */}
      <div className={styles.row}>
        <label className={styles.label}>彩种：</label>
        <select
          className={styles.select}
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as LotteryType)}
        >
          {Object.entries(LOTTERIES).map(([k, c]) => (
            <option key={k} value={k}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── mode switch (pool lotteries only) ── */}
      {isPool && (
        <div className={styles.row}>
          <label className={styles.label}>投注方式：</label>
          <div className={styles.modeGroup}>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'single' ? styles.modeActive : ''}`}
              onClick={() => setMode('single')}
            >
              单式
            </button>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'compound' ? styles.modeActive : ''}`}
              onClick={() => setMode('compound')}
            >
              复式
            </button>
          </div>
        </div>
      )}

      {/* ── number grids ── */}
      {config.groups.map((group, gi) => {
        const nums = selected[group.key] ?? [];
        const limit = getLimit(group.key);
        const [min, max] = group.range;
        const isDigit = max <= 9;
        const cc = compoundCount[group.key] ?? group.pickCount;
        return (
          <div key={group.key} className={styles.group}>
            <div className={styles.groupLabel}>
              {group.label}
              {mode === 'compound' && isPool ? (
                <span className={styles.compoundCtl}>
                  <button
                    type="button"
                    className={styles.ccBtn}
                    disabled={cc <= group.pickCount}
                    onClick={() => adjustCompound(group.key, -1)}
                  >
                    −
                  </button>
                  <span className={styles.ccNum}>选{cc}个</span>
                  <button
                    type="button"
                    className={styles.ccBtn}
                    disabled={cc >= max - min + 1}
                    onClick={() => adjustCompound(group.key, 1)}
                  >
                    +
                  </button>
                </span>
              ) : (
                <span className={styles.hint}>（选{group.pickCount}个）</span>
              )}
            </div>
            <div
              className={`${styles.ballGrid} ${isDigit ? styles.ballGridDigit : ''}`}
            >
              {Array.from({ length: max - min + 1 }, (_, i) => {
                const num = min + i;
                const sel = nums.includes(num);
                const overLimit = nums.length >= limit && !sel;
                return (
                  <button
                    type="button"
                    key={num}
                    className={`${styles.ball} ${sel ? styles.ballOn : ''} ${overLimit ? styles.ballOff : ''}`}
                    disabled={overLimit}
                    onClick={() => handleToggle(group.key, num)}
                    data-group={gi}
                  >
                    {String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── actions ── */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnRandom}
          onClick={handleRandom}
        >
          随机选号
        </button>
        <button type="button" className={styles.btnClear} onClick={handleClear}>
          清空
        </button>
      </div>

      {/* ── result ── */}
      {isComplete && (
        <div className={styles.result}>
          <div className={styles.resultLabel}>已选号码</div>
          <div className={styles.resultNums}>
            {config.groups.map((group, gi) => {
              const nums = [...(selected[group.key] ?? [])].sort(
                (a, b) => a - b,
              );
              return (
                <span key={group.key}>
                  {gi > 0 && <span className={styles.sep}> | </span>}
                  <span className={styles.numGroup} data-group={gi}>
                    {nums.join(' ')}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
