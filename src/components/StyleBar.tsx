import { PaintBucket, Plus } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { BRUSH_INFO } from '../lib/brushes';
import { BRUSH_SIZES, PALETTE } from '../lib/tools';
import { BrushPreview } from './BrushPreview';
import type { ToolSettings } from '../lib/tools';
import styles from './StyleBar.module.css';

type ColorTarget = 'stroke' | 'fill';

interface StyleBarProps {
  settings: ToolSettings;
  onChange: (changes: Partial<ToolSettings>) => void;
}

/** Brush, colours, fill and brush size for the next stroke. */
export function StyleBar({ settings, onChange }: StyleBarProps) {
  const [target, setTarget] = useState<ColorTarget>('stroke');
  const current = target === 'stroke' ? settings.strokeColor : settings.fillColor;
  const isCustom = !PALETTE.some(({ color }) => color === current);
  const brushApplies = settings.tool !== 'erase';

  const pickColor = (color: string) => {
    if (target === 'stroke') onChange({ strokeColor: color });
    // Choosing a fill colour clearly means the user wants filled shapes.
    else onChange({ fillColor: color, fill: true });
  };

  return (
    <div className={styles.bar} role="toolbar" aria-label="Style">
      <div
        className={`${styles.section} ${styles.brushes}`}
        role="radiogroup"
        aria-label="Brush"
        aria-disabled={!brushApplies}
      >
        {BRUSH_INFO.map(({ brush, label }) => (
          <button
            key={brush}
            type="button"
            role="radio"
            aria-checked={settings.brush === brush}
            aria-label={label}
            aria-keyshortcuts="B"
            data-tip={brushApplies ? label : `${label} (not used by the eraser)`}
            data-key={brushApplies ? 'B' : ''}
            data-tip-side="top"
            className={styles.brush}
            onClick={() => onChange({ brush })}
          >
            <BrushPreview brush={brush} color={settings.strokeColor} />
          </button>
        ))}
      </div>

      <div className={`${styles.section} ${styles.colorTargets}`}>
        <div className={styles.targets} role="radiogroup" aria-label="Colour applies to">
          <button
            type="button"
            role="radio"
            aria-checked={target === 'stroke'}
            aria-label="Stroke colour"
            data-tip="Stroke colour"
            data-tip-side="top"
            className={styles.target}
            onClick={() => setTarget('stroke')}
          >
            <span className={styles.strokeChip} style={{ borderColor: settings.strokeColor }} />
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={target === 'fill'}
            aria-label="Fill colour"
            data-tip="Fill colour"
            data-tip-side="top"
            className={styles.target}
            onClick={() => setTarget('fill')}
          >
            <span
              className={styles.fillChip}
              data-off={!settings.fill}
              style={{ background: settings.fillColor }}
            />
          </button>
        </div>
        <button
          type="button"
          aria-pressed={settings.fill}
          aria-label="Fill shapes"
          aria-keyshortcuts="F"
          data-tip="Fill shapes"
          data-key="F"
          data-tip-side="top"
          className={styles.toggle}
          onClick={() => onChange({ fill: !settings.fill })}
        >
          <PaintBucket size={17} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div
        className={`${styles.section} ${styles.swatches}`}
        role="radiogroup"
        aria-label={target === 'stroke' ? 'Stroke colour' : 'Fill colour'}
      >
        {PALETTE.map(({ name, color }) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={current === color}
            aria-label={name}
            data-tip={name}
            data-tip-side="top"
            className={styles.swatch}
            style={{ '--swatch': color } as CSSProperties}
            onClick={() => pickColor(color)}
          />
        ))}
        <label
          className={`${styles.swatch} ${styles.custom}`}
          data-selected={isCustom}
          data-tip="Custom colour"
          data-tip-side="top"
          style={isCustom ? ({ '--swatch': current } as CSSProperties) : undefined}
        >
          <input
            type="color"
            className="visually-hidden"
            aria-label="Custom colour"
            value={current}
            onChange={(e) => pickColor(e.target.value)}
          />
          {!isCustom && <Plus size={14} strokeWidth={2} aria-hidden="true" />}
        </label>
      </div>

      <div
        className={`${styles.section} ${styles.sizes}`}
        role="radiogroup"
        aria-label="Brush size"
      >
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={settings.width === size}
            aria-label={`${size} px`}
            data-tip={`${size} px`}
            data-tip-side="top"
            className={styles.size}
            onClick={() => onChange({ width: size })}
          >
            <span
              className={styles.dot}
              style={{
                width: 3 + Math.sqrt(size) * 2.6,
                height: 3 + Math.sqrt(size) * 2.6,
                background: settings.strokeColor,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
