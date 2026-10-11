import { BRUSHES } from '../../shared/protocol';
import type { Brush, Tool } from '../../shared/protocol';

export interface ToolSettings {
  tool: Tool;
  brush: Brush;
  fill: boolean;
  strokeColor: string;
  fillColor: string;
  width: number;
}

export interface ToolDefinition {
  tool: Tool;
  label: string;
  shortcut: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { tool: 'free', label: 'Pen', shortcut: 'P' },
  { tool: 'line', label: 'Line', shortcut: 'L' },
  { tool: 'circle', label: 'Circle', shortcut: 'O' },
  { tool: 'square', label: 'Square', shortcut: 'S' },
  { tool: 'erase', label: 'Eraser', shortcut: 'E' },
];

/** A small set of inks that look good together on warm paper. */
export const PALETTE: { name: string; color: string }[] = [
  { name: 'Ink', color: '#1c1a17' },
  { name: 'Graphite', color: '#77726a' },
  { name: 'Vermilion', color: '#e5482d' },
  { name: 'Ochre', color: '#e3a42b' },
  { name: 'Moss', color: '#4f7d3a' },
  { name: 'Teal', color: '#1f7a7a' },
  { name: 'Cobalt', color: '#2f5bd3' },
  { name: 'Plum', color: '#8a3f8f' },
];

export const BRUSH_SIZES = [2, 4, 8, 16, 32];

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  tool: 'free',
  brush: 'ink',
  fill: false,
  strokeColor: '#1c1a17',
  fillColor: '#e3a42b',
  width: 4,
};

/** The next brush size up (`step` 1) or down (`step` -1) from `width`. */
export function stepBrushSize(width: number, step: 1 | -1): number {
  if (step > 0) return BRUSH_SIZES.find((size) => size > width) ?? width;
  return [...BRUSH_SIZES].reverse().find((size) => size < width) ?? width;
}

/** The brush after `brush`, wrapping around. */
export function nextBrush(brush: Brush): Brush {
  return BRUSHES[(BRUSHES.indexOf(brush) + 1) % BRUSHES.length] ?? 'ink';
}
