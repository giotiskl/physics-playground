import { Pane } from 'tweakpane';

export interface ControlValues {
  ballCount: number;
  gravity: number;
  bounciness: number;
  paddleSize: number;
  bloomIntensity: number;
  showStats: boolean;
}

export interface ControlCallbacks {
  onReset?: () => void;
  onGravityChange?: (value: number) => void;
  onBloomChange?: (value: number) => void;
  onBallCountChange?: (value: number) => void;
  onPaddleSizeChange?: (value: number) => void;
}

export function createControls(
  initialValues: ControlValues,
  callbacks: ControlCallbacks = {},
): { pane: Pane; values: ControlValues } {
  const pane = new Pane({
    title: '🎱 Physics Playground',
  });

  const values = { ...initialValues };

  // Physics folder
  const physicsFolder = pane.addFolder({
    title: 'Physics',
    expanded: true,
  });

  physicsFolder
    .addBinding(values, 'gravity', {
      min: -20,
      max: 0,
      step: 0.1,
      label: 'Gravity',
    })
    .on('change', (ev: { value: number }) => {
      callbacks.onGravityChange?.(ev.value);
    });

  physicsFolder.addBinding(values, 'bounciness', {
    min: 0,
    max: 1,
    step: 0.05,
    label: 'Bounciness',
  });

  physicsFolder
    .addBinding(values, 'paddleSize', {
      min: 1,
      max: 5,
      step: 0.25,
      label: 'Paddle Size',
    })
    .on('change', (ev: { value: number }) => {
      callbacks.onPaddleSizeChange?.(ev.value);
    });

  // Visuals folder
  const visualsFolder = pane.addFolder({
    title: 'Visuals',
    expanded: true,
  });

  visualsFolder
    .addBinding(values, 'bloomIntensity', {
      min: 0,
      max: 2,
      step: 0.1,
      label: 'Bloom',
    })
    .on('change', (ev: { value: number }) => {
      callbacks.onBloomChange?.(ev.value);
    });

  // Actions folder
  const actionsFolder = pane.addFolder({
    title: 'Actions',
    expanded: true,
  });

  // Ball count slider (reactive)
  actionsFolder
    .addBinding(values, 'ballCount', {
      min: 10,
      max: 500,
      step: 10,
      label: 'Ball Count',
    })
    .on('change', (ev: { value: number }) => {
      callbacks.onBallCountChange?.(ev.value);
    });

  actionsFolder.addButton({ title: '🔄 Reset Balls' }).on('click', () => {
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
