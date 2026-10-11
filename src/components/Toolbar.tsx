import { Circle, Eraser, PaintBucket, Pencil, Slash, Square, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MAX_STROKE_WIDTH, MIN_STROKE_WIDTH } from '../../shared/protocol';
import type { Tool } from '../../shared/protocol';
import type { ToolSettings } from '../lib/tools';
import styles from './Toolbar.module.css';

const TOOL_BUTTONS: { tool: Tool; label: string; Icon: LucideIcon }[] = [
  { tool: 'free', label: 'Draw', Icon: Pencil },
  { tool: 'line', label: 'Line', Icon: Slash },
  { tool: 'circle', label: 'Circle', Icon: Circle },
  { tool: 'square', label: 'Square', Icon: Square },
  { tool: 'erase', label: 'Erase', Icon: Eraser },
];

interface ToolbarProps {
  settings: ToolSettings;
  onChange: (changes: Partial<ToolSettings>) => void;
  onClearBoard: () => void;
  disabled?: boolean;
}

export function Toolbar({ settings, onChange, onClearBoard, disabled = false }: ToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Drawing tools">
      <div className={styles.group} role="radiogroup" aria-label="Tool">
        {TOOL_BUTTONS.map(({ tool, label, Icon }) => (
          <button
            key={tool}
            type="button"
            role="radio"
            aria-checked={settings.tool === tool}
            aria-label={label}
            title={label}
            className={styles.button}
            onClick={() => onChange({ tool })}
          >
            <Icon size={20} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className={styles.group}>
        <button
          type="button"
          aria-pressed={settings.fill}
          aria-label="Fill shapes"
          title="Fill shapes"
          className={styles.button}
          onClick={() => onChange({ fill: !settings.fill })}
        >
          <PaintBucket size={20} aria-hidden="true" />
        </button>
        <label className={styles.color} title="Stroke colour">
          <span className={styles.label}>Stroke</span>
          <input
            type="color"
            value={settings.strokeColor}
            onChange={(e) => onChange({ strokeColor: e.target.value })}
          />
        </label>
        <label className={styles.color} title="Fill colour">
          <span className={styles.label}>Fill</span>
          <input
            type="color"
            value={settings.fillColor}
            onChange={(e) => onChange({ fillColor: e.target.value })}
          />
        </label>
      </div>

      <label className={styles.group}>
        <span className={styles.label}>Width</span>
        <input
          type="range"
          min={MIN_STROKE_WIDTH}
          max={MAX_STROKE_WIDTH}
          step={2}
          value={settings.width}
          onChange={(e) => onChange({ width: Number(e.target.value) })}
        />
        <output className={styles.value}>{settings.width}</output>
      </label>

      <button
        type="button"
        className={`${styles.button} ${styles.danger}`}
        aria-label="Clear board for everyone"
        title="Clear board for everyone"
        disabled={disabled}
        onClick={onClearBoard}
      >
        <Trash2 size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
