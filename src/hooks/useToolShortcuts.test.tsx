import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TOOL_SETTINGS } from '../lib/tools';
import type { ToolSettings } from '../lib/tools';
import { useToolShortcuts } from './useToolShortcuts';

function Harness(props: {
  settings: ToolSettings;
  onChange: (c: Partial<ToolSettings>) => void;
  enabled: boolean;
}) {
  useToolShortcuts(props.settings, props.onChange, props.enabled);
  return <input aria-label="field" />;
}

describe('useToolShortcuts', () => {
  it('maps keys to tool changes', () => {
    const onChange = vi.fn();
    render(<Harness settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} enabled />);

    fireEvent.keyDown(window, { key: 'o' });
    fireEvent.keyDown(window, { key: 'f' });
    fireEvent.keyDown(window, { key: ']' });
    fireEvent.keyDown(window, { key: '[' });

    expect(onChange.mock.calls).toEqual([
      [{ tool: 'circle' }],
      [{ fill: true }],
      [{ width: 8 }],
      [{ width: 2 }],
    ]);
  });

  it('ignores keys typed into a field, with modifiers, or while disabled', () => {
    const onChange = vi.fn();
    const { getByLabelText, rerender } = render(
      <Harness settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} enabled />,
    );

    fireEvent.keyDown(getByLabelText('field'), { key: 'e' });
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    rerender(<Harness settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} enabled={false} />);
    fireEvent.keyDown(window, { key: 'e' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
