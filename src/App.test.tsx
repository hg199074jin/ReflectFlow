import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app shell', async () => {
    render(<App />);
    // Wait for async initialization
    expect(await screen.findByText('Daily Check-in Timeline')).toBeInTheDocument();
  });
});
