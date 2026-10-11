import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JoinDialog } from './JoinDialog';

describe('JoinDialog', () => {
  it('joins with the trimmed name', async () => {
    const onJoin = vi.fn();
    render(<JoinDialog onJoin={onJoin} />);

    await userEvent.type(screen.getByLabelText("What's your name?"), '  Ada  {Enter}');

    expect(onJoin).toHaveBeenCalledWith('Ada');
  });

  it('requires a name', async () => {
    const onJoin = vi.fn();
    render(<JoinDialog onJoin={onJoin} />);

    await userEvent.click(screen.getByRole('button', { name: 'Join' }));

    expect(onJoin).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
  });
});
