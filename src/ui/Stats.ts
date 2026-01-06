export interface StatsOptions {
  showOnMobile?: boolean;
}

export function createStats(
  options: StatsOptions = {},
): { dom: HTMLElement; update: () => void } {
  const { showOnMobile = true } = options;
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 16px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px;
    z-index: 1000;
    display: ${isMobile && !showOnMobile ? 'none' : 'block'};
  `;

  let frames = 0;
  let lastTime = performance.now();
  let fps = 0;

  const update = () => {
    frames++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fps = Math.round((frames * 1000) / (now - lastTime));
      frames = 0;
      lastTime = now;
      container.textContent = `${fps} FPS`;
    }
  };

  document.body.appendChild(container);

  return { dom: container, update };
}
