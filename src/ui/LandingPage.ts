/**
 * LandingPage.ts
 *
 * Playful, cartoony landing page for Physics Playground.
 */

export interface Example {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
  available: boolean;
}

const examples: Example[] = [
  {
    id: 'ball-pit',
    title: 'Ball Pit Chaos',
    emoji: '🎱',
    description:
      'Scatter colorful balls with your mouse. Pure chaos, pure fun.',
    color: '#ff6b6b',
    available: true,
  },
  {
    id: 'dominoes',
    title: 'Domino Chain',
    emoji: '🁡',
    description: 'Knock them down and watch the chain reaction unfold.',
    color: '#4ecdc4',
    available: true,
  },
  {
    id: 'soft-body',
    title: 'Soft Body Jelly',
    emoji: '🟢',
    description: 'Squishy, wobbly, mesmerizing physics.',
    color: '#ffe66d',
    available: false,
  },
  {
    id: 'ragdoll',
    title: 'Ragdoll Physics',
    emoji: '🤸',
    description: 'Floppy characters tumbling through space.',
    color: '#aa96da',
    available: false,
  },
];

export function createLandingPage(
  onSelectExample: (id: string) => void,
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'landing-page';

  container.innerHTML = `
    <div class="landing-content">
      <div class="landing-header">
        <h1 class="landing-title">
          <span class="title-physics">Physics</span>
          <span class="title-playground">Playground</span>
        </h1>
        <p class="landing-subtitle">by <a href="https://georgekal.com" target="_blank">George Kal</a></p>
        <p class="landing-tagline">Interactive physics experiments in your browser. <br/>Click, drag, break stuff. It's science! 🧪</p>
      </div>
      
      <div class="examples-grid">
        ${examples
          .map(
            (ex) => `
          <button 
            class="example-card ${ex.available ? '' : 'coming-soon'}" 
            data-id="${ex.id}"
            style="--card-color: ${ex.color}"
            ${ex.available ? '' : 'disabled'}
          >
            <span class="card-emoji">${ex.emoji}</span>
            <h2 class="card-title">${ex.title}</h2>
            <p class="card-description">${ex.description}</p>
            ${ex.available ? '<span class="card-cta">Play →</span>' : '<span class="card-badge">Coming Soon</span>'}
          </button>
        `,
          )
          .join('')}
      </div>
      
      <footer class="landing-footer">
        <a href="https://github.com/giotiskl/physics-playground" target="_blank">GitHub</a>
        <span>•</span>
        <a href="https://x.com/heygeorgekal" target="_blank">X</a>
        <span>•</span>
        <span>MIT License</span>
      </footer>
    </div>
  `;

  // Add click handlers
  container
    .querySelectorAll('.example-card:not(.coming-soon)')
    .forEach((card) => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.id;
        if (id) onSelectExample(id);
      });
    });

  return container;
}

export function removeLandingPage() {
  const landing = document.querySelector('.landing-page');
  if (landing) {
    landing.classList.add('fade-out');
    setTimeout(() => landing.remove(), 300);
  }
}
