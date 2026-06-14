import { useEffect } from 'react';
import { useTimelineStore } from '../store';
import type { AppMode } from '../lib/schema';

interface ShortcutHandlers {
  onOpenSettings?: () => void;
  onOpenExport?: () => void;
  onCloseDialog?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const setAppMode = useTimelineStore((s) => s.setAppMode);
  const setView = useTimelineStore((s) => s.setView);
  const setSelectedMonth = useTimelineStore((s) => s.setSelectedMonth);
  const selectedMonth = useTimelineStore((s) => s.selectedMonth);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      // Esc always works — close dialogs
      if (e.key === 'Escape') {
        handlers.onCloseDialog?.();
        return;
      }

      // Don't trigger shortcuts when typing in inputs
      if (isInput) return;

      // Ctrl/Cmd + number: switch mode
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setAppMode('checkin' as AppMode);
            break;
          case '2':
            e.preventDefault();
            setAppMode('browse' as AppMode);
            break;
          case 'e':
            e.preventDefault();
            handlers.onOpenExport?.();
            break;
          case ',':
            e.preventDefault();
            handlers.onOpenSettings?.();
            break;
        }
      }

      // Arrow keys: navigate months (when not in input)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateMonth(selectedMonth, -1, setSelectedMonth);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateMonth(selectedMonth, 1, setSelectedMonth);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers, setAppMode, setView, setSelectedMonth, selectedMonth]);
}

function navigateMonth(current: string, delta: number, setter: (month: string) => void) {
  const [yearStr, monthStr] = current.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const date = new Date(year, month - 1 + delta, 1);
  const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  setter(newMonth);
}
