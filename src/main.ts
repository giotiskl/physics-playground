/**
 * main.ts
 *
 * Entry point for Physics Playground.
 * Handles routing between landing page and examples.
 */

import './style.css';
import { Router } from './core/Router';
import { createLandingPage, removeLandingPage } from './ui/LandingPage';
import { createBackButton, removeBackButton } from './ui/BackButton';
import type { Route } from './core/Router';

let currentEngine: { dispose: () => void } | null = null;
let router: Router;

// Example loaders
const exampleLoaders: Record<string, () => Promise<{ dispose: () => void }>> = {
  'ball-pit': () =>
    import('./examples/ball-pit/BallPit').then((m) => m.initBallPit()),
  dominoes: () =>
    import('./examples/dominoes/Dominoes').then((m) => m.initDominoes()),
};

// Clean up current example
function cleanupCurrentExample() {
  if (currentEngine) {
    currentEngine.dispose();
    currentEngine = null;
  }
  removeBackButton();

  // Remove any leftover canvases
  document.querySelectorAll('canvas').forEach((c) => c.remove());

  // Remove stats
  document.querySelectorAll('[style*="position: fixed"]').forEach((el) => {
    if (el.textContent?.includes('FPS')) el.remove();
  });
}

// Load an example
async function loadExample(id: string) {
  const loader = exampleLoaders[id];
  if (!loader) {
    console.error(`Unknown example: ${id}`);
    return;
  }

  removeLandingPage();

  try {
    currentEngine = await loader();
    createBackButton(() => router.navigate('home'));
  } catch (err) {
    console.error(`Failed to load example: ${id}`, err);
    router.navigate('home');
  }
}

// Show landing page
function showLandingPage() {
  cleanupCurrentExample();

  const landing = createLandingPage((exampleId) => {
    router.navigate(exampleId as Route);
  });

  document.body.appendChild(landing);
}

// Handle route changes
function handleRouteChange(route: Route) {
  if (route === 'home') {
    showLandingPage();
  } else {
    loadExample(route);
  }
}

// Initialize router
router = new Router(handleRouteChange);
