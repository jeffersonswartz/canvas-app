import { Circle, Eraser, Pencil, Slash, Square, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tool } from '../../shared/protocol';
import { TOOL_DEFINITIONS } from '../lib/tools';
import styles from './ToolRail.module.css';

const ICONS: Record<Tool, LucideIcon> = {
  free: Pencil,
  line: Slash,
  circle: Circle,
  square: Square,
  erase: Eraser,
};

interface ToolRailProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onClearBoard: () => void;
  canClear: boolean;
}

export function ToolRail({ tool, onToolChange, onClearBoard, canClear }: ToolRailProps) {
  return (
    <nav className={styles.rail} aria-label="Tools">
      <div role="radiogroup" aria-label="Tool" className={styles.group}>
        {TOOL_DEFINITIONS.map(({ tool: value, label, shortcut }) => {
          const Icon = ICONS[value];
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={tool === value}
              aria-label={label}
              aria-keyshortcuts={shortcut}
              data-tip={label}
              data-key={shortcut}
              data-tip-side="right"
              className={styles.tool}
              onClick={() => onToolChange(value)}
            >
              <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <hr className={styles.divider} />
      <button
        type="button"
        aria-label="Clear board for everyone"
        data-tip="Clear board for everyone"
        data-tip-side="right"
        className={`${styles.tool} ${styles.danger}`}
        disabled={!canClear}
        onClick={onClearBoard}
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </nav>
  );
}
