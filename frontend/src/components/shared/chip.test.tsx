import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Chip } from './chip';

describe('Chip Component', () => {
  it('renders label and handles click', () => {
    const handleClick = vi.fn();
    render(<Chip label="Cricket" selected={false} onClick={handleClick} />);
    
    const chip = screen.getByText('Cricket');
    expect(chip).toBeDefined();

    fireEvent.click(chip);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
