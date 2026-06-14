import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the app shell', async () => {
    render(<App />);
    // Wait for async initialization
    expect(await screen.findByText('每日打卡时间线')).toBeInTheDocument();
  });
});
