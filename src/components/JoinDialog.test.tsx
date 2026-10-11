import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JoinDialog } from './JoinDialog';

const user = (id: string, name: string) => ({ id, name, color: '#2f5bd3' });

describe('JoinDialog', () => {
  it('joins with the trimmed name', async () => {
    const onJoin = vi.fn();
    render(<JoinDialog onJoin={onJoin} users={[]} />);

    await userEvent.type(screen.getByLabelText('Your name'), '  Ada  {Enter}');

    expect(onJoin).toHaveBeenCalledWith('Ada');
  });

  it('requires a name', async () => {
    const onJoin = vi.fn();
    render(<JoinDialog onJoin={onJoin} users={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Start drawing' }));

    expect(onJoin).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
  });

  it.each([
    [[], 'Nobody’s here yet'],
    [[user('a', 'Ada')], 'Ada is drawing right now.'],
    [[user('a', 'Ada'), user('b', 'Bob')], 'Ada and Bob are drawing right now.'],
    [
      [user('a', 'Ada'), user('b', 'Bob'), user('c', 'Cy'), user('d', 'Di')],
      'Ada, Bob and 2 more are drawing right now.',
    ],
  ])('says who is already drawing (%#)', (users, text) => {
    render(<JoinDialog onJoin={vi.fn()} users={users} />);
    expect(screen.getByText(text, { exact: false })).toBeInTheDocument();
  });
});
