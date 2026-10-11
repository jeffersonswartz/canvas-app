import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OnlineUsers } from './OnlineUsers';

describe('OnlineUsers', () => {
  it('shows an initial per user and marks the current user', () => {
    render(
      <OnlineUsers
        users={[
          { id: 'a', name: 'ada', color: '#ff9800' },
          { id: 'b', name: 'Bob', color: '#03a9f4' },
        ]}
        selfId="a"
      />,
    );

    expect(screen.getByLabelText('ada (you)')).toHaveTextContent('A');
    expect(screen.getByLabelText('Bob')).toHaveTextContent('B');
  });
});
