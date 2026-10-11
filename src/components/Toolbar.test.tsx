import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TOOL_SETTINGS } from '../lib/tools';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  it('marks the selected tool and reports tool changes', async () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} onClearBoard={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Line' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Circle' }));

    expect(onChange).toHaveBeenCalledWith({ tool: 'circle' });
  });

  it('toggles fill', async () => {
    const onChange = vi.fn();
    render(<Toolbar settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} onClearBoard={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Fill shapes' }));

    expect(onChange).toHaveBeenCalledWith({ fill: true });
  });

  it('disables clearing the board when not joined', () => {
    render(
      <Toolbar
        settings={DEFAULT_TOOL_SETTINGS}
        onChange={vi.fn()}
        onClearBoard={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: 'Clear board for everyone' })).toBeDisabled();
  });
});
