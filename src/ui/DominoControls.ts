/**
 * DominoControls.ts
 *
 * Tweakpane controls for Domino Chain example.
 */

import { Pane } from 'tweakpane';
import type { LayoutType } from '../examples/dominoes/layouts';

export interface DominoControlValues {
  dominoCount: number;
  layout: LayoutType;
}

export interface DominoControlCallbacks {
  onReset?: () => void;
  onLayoutChange?: (layout: LayoutType) => void;
  onCountChange?: (count: number) => void;
}

export function createDominoControls(
  initialValues: DominoControlValues,
  callbacks: DominoControlCallbacks = {},
): { pane: Pane; values: DominoControlValues } {
  const pane = new Pane({
    title: '🁡 Domino Chain',
  });

  const values = { ...initialValues };

  // Layout folder
  const layoutFolder = pane.addFolder({ title: 'Layout', expanded: true });

  layoutFolder
    .addBinding(values, 'layout', {
      label: 'Pattern',
      options: {
        Line: 'line',
        Curve: 'curve',
        Spiral: 'spiral',
        Split: 'split',
      },
    })
    .on('change', (ev: { value: LayoutType }) => {
      callbacks.onLayoutChange?.(ev.value);
    });

  layoutFolder
    .addBinding(values, 'dominoCount', {
      label: 'Count',
      min: 10,
      max: 100,
      step: 5,
    })
    .on('change', (ev: { value: number }) => {
      callbacks.onCountChange?.(ev.value);
    });

  // Actions folder
  const actionsFolder = pane.addFolder({ title: 'Actions', expanded: true });

  actionsFolder.addButton({ title: '🔄 Reset Dominoes' }).on('click', () => {
    callbacks.onReset?.();
  });

  // Style the pane
  const paneElement = pane.element;
  paneElement.style.position = 'fixed';
  paneElement.style.top = '16px';
  paneElement.style.right = '16px';
  paneElement.style.zIndex = '1000';

  return { pane, values };
}
