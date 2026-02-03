import { useEffect, useCallback, RefObject } from 'react';
import L from 'leaflet';

interface KeyboardShortcutHandlers {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleDraw: () => void;
  onClearSelection: () => void;
  onToggleSavedLocations: () => void;
  onToggleTrainStations: () => void;
  onToggleHeatmap: () => void;
  onLocate: () => void;
  onShowHelp: () => void;
}

/**
 * Keyboard shortcuts for map navigation and controls
 * 
 * Shortcuts:
 * - +/= : Zoom in
 * - -/_ : Zoom out
 * - Escape : Clear selection / exit draw mode
 * - D : Toggle draw mode
 * - S : Toggle saved locations
 * - T : Toggle train stations
 * - H : Toggle price heatmap
 * - R : Reset view to Israel
 * - L : Locate me
 * - ? : Show help
 */
export function useMapKeyboardShortcuts(
  mapRef: RefObject<L.Map | null>,
  handlers: KeyboardShortcutHandlers
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore when typing in inputs or textareas
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Handle keyboard shortcuts
    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        handlers.onZoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        handlers.onZoomOut();
        break;
      case 'Escape':
        e.preventDefault();
        handlers.onClearSelection();
        break;
      case 'd':
      case 'D':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onToggleDraw();
        }
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onToggleSavedLocations();
        }
        break;
      case 't':
      case 'T':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onToggleTrainStations();
        }
        break;
      case 'h':
      case 'H':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onToggleHeatmap();
        }
        break;
      case 'r':
      case 'R':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onResetView();
        }
        break;
      case 'l':
      case 'L':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handlers.onLocate();
        }
        break;
      case '?':
        e.preventDefault();
        handlers.onShowHelp();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: '+', description: 'Zoom in' },
  { key: '-', description: 'Zoom out' },
  { key: 'Esc', description: 'Clear selection / exit draw' },
  { key: 'D', description: 'Toggle draw mode' },
  { key: 'S', description: 'Toggle saved locations' },
  { key: 'T', description: 'Toggle train stations' },
  { key: 'H', description: 'Toggle price heatmap' },
  { key: 'R', description: 'Reset view' },
  { key: 'L', description: 'Locate me' },
  { key: '?', description: 'Show shortcuts' },
] as const;
