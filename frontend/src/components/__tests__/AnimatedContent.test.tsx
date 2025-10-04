import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import AnimatedContent from '../AnimatedContent';
import '@testing-library/jest-dom/vitest';

describe('AnimatedContent', () => {
  it('renders children correctly', () => {
    render(
      <AnimatedContent>
        <div>Test Content</div>
      </AnimatedContent>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies animation variants', () => {
    const { container } = render(
      <AnimatedContent>
        <div>Animated</div>
      </AnimatedContent>
    );

    // Check if motion div is rendered
    const motionDiv = container.querySelector('div[style]');
    expect(motionDiv).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <AnimatedContent>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </AnimatedContent>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
