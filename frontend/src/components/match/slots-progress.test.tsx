import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlotsProgress } from './slots-progress';

describe('SlotsProgress Component', () => {
  it('renders current and max slots correctly', () => {
    render(<SlotsProgress current={5} max={10} />);
    expect(screen.getByText('Players')).toBeDefined();
    expect(screen.getByText(/5\s*\/\s*10/)).toBeDefined();
  });

  it('renders when full', () => {
    render(<SlotsProgress current={8} max={8} />);
    expect(screen.getByText('Players')).toBeDefined();
    expect(screen.getByText(/8\s*\/\s*8/)).toBeDefined();
  });
});
