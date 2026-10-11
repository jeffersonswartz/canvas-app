import { useEffect, useRef } from 'react';
import { TOOL_DEFINITIONS, stepBrushSize } from '../lib/tools';
import type { ToolSettings } from '../lib/tools';

/**
 * Single-key shortcuts: a tool's letter selects it, F toggles fill and
 * [ / ] change the brush size. Ignored while typing in a field.
 */
export function useToolShortcuts(
  settings: ToolSettings,
  onChange: (changes: Partial<ToolSettings>) => void,
  enabled: boolean,
): void {
  // Read the latest values from the listener without re-subscribing.
  const latest = useRef({ settings, onChange });
  useEffect(() => {
    latest.current = { settings, onChange };
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const { target } = event;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      const { settings: current, onChange: change } = latest.current;
      const key = event.key.toUpperCase();
      const tool = TOOL_DEFINITIONS.find((t) => t.shortcut === key)?.tool;
      if (tool) change({ tool });
      else if (key === 'F') change({ fill: !current.fill });
      else if (key === '[') change({ width: stepBrushSize(current.width, -1) });
      else if (key === ']') change({ width: stepBrushSize(current.width, 1) });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
