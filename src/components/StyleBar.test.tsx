import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TOOL_SETTINGS } from '../lib/tools';
import { StyleBar } from './StyleBar';

describe('StyleBar', () => {
  it('applies palette colours to the stroke by default', async () => {
    const onChange = vi.fn();
    render(<StyleBar settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} />);

    expect(screen.getByRole('radio', { name: 'Ink' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Cobalt' }));

    expect(onChange).toHaveBeenCalledWith({ strokeColor: '#2f5bd3' });
  });

  it('picking a fill colour also turns fill on', async () => {
    const onChange = vi.fn();
    render(<StyleBar settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Fill colour' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Moss' }));

    expect(onChange).toHaveBeenCalledWith({ fillColor: '#4f7d3a', fill: true });
  });

  it('toggles fill and picks brush sizes', async () => {
    const onChange = vi.fn();
    render(<StyleBar settings={DEFAULT_TOOL_SETTINGS} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Fill shapes' }));
    expect(onChange).toHaveBeenCalledWith({ fill: true });

    expect(screen.getByRole('radio', { name: '4 px' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: '16 px' }));
    expect(onChange).toHaveBeenCalledWith({ width: 16 });
  });

  it('marks a colour outside the palette as custom', () => {
    render(
      <StyleBar
        settings={{ ...DEFAULT_TOOL_SETTINGS, strokeColor: '#123456' }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Custom colour')).toHaveValue('#123456');
    expect(screen.getAllByRole('radio', { checked: true }).map((r) => r.ariaLabel)).not.toContain(
      'Ink',
    );
  });
});
