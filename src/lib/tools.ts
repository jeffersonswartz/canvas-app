import type { Tool } from '../../shared/protocol';

export interface ToolSettings {
  tool: Tool;
  fill: boolean;
  strokeColor: string;
  fillColor: string;
  width: number;
}

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  tool: 'line',
  fill: false,
  strokeColor: '#000000',
  fillColor: '#000000',
  width: 2,
};
