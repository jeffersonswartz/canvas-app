import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OnlineUsers } from './OnlineUsers';

const users = ['ada', 'Bob', 'Cy', 'Di', 'Eve', 'Fay'].map((name, i) => ({
  id: String(i),
  name,
  color: '#2f5bd3',
}));

describe('OnlineUsers', () => {
  it('shows an initial per user', () => {
    render(<OnlineUsers users={users.slice(0, 2)} />);

    expect(screen.getByLabelText('ada')).toHaveTextContent('A');
    expect(screen.getByLabelText('Bob')).toHaveTextContent('B');
  });

  it('collapses everyone past the fourth into a count', () => {
    render(<OnlineUsers users={users} />);

    expect(screen.getByLabelText('6 other people drawing').children).toHaveLength(5);
    expect(screen.getByLabelText('and 2 more')).toHaveTextContent('+2');
  });

  it('renders nothing when nobody else is here', () => {
    const { container } = render(<OnlineUsers users={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
