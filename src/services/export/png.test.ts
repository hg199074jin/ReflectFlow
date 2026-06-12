import { describe, it, expect, vi } from 'vitest';
import { exportNodeAsPng } from './png';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

describe('exportNodeAsPng', () => {
  it('calls toPng and triggers download', async () => {
    const click = vi.fn();
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement);

    const node = document.createElement('div');
    await exportNodeAsPng(node, 'test');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(click).toHaveBeenCalled();

    createElement.mockRestore();
  });
});
