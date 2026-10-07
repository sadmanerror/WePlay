import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReliabilityBadge } from './reliability-badge';

describe('ReliabilityBadge Component', () => {
  it('renders Reliable for scores >= 90', () => {
    render(<ReliabilityBadge score={95} />);
    expect(screen.getByText('Reliable')).toBeDefined();
    expect(screen.getByText(/95%/)).toBeDefined();
  });

  it('renders Good for scores between 70 and 89', () => {
    render(<ReliabilityBadge score={75} />);
    expect(screen.getByText('Good')).toBeDefined();
    expect(screen.getByText(/75%/)).toBeDefined();
  });

  it('renders Needs Improvement for lower scores', () => {
    render(<ReliabilityBadge score={55} />);
    expect(screen.getByText('Needs Improvement')).toBeDefined();
    expect(screen.getByText(/55%/)).toBeDefined();
  });
});
