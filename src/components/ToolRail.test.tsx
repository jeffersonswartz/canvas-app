import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToolRail } from './ToolRail';

describe('ToolRail', () => {
  it('marks the selected tool and reports changes', async () => {
    const onToolChange = vi.fn();
    render(<ToolRail tool="free" onToolChange={onToolChange} onClearBoard={vi.fn()} canClear />);

    expect(screen.getByRole('radio', { name: 'Pen' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Circle' }));

    expect(onToolChange).toHaveBeenCalledWith('circle');
  });

  it('disables clearing while offline', () => {
    render(<ToolRail tool="free" onToolChange={vi.fn()} onClearBoard={vi.fn()} canClear={false} />);

    expect(screen.getByRole('button', { name: 'Clear board for everyone' })).toBeDisabled();
  });
});
