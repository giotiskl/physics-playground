/**
 * BackButton.ts
 *
 * Floating back button to return to landing page.
 */

export function createBackButton(onClick: () => void): HTMLElement {
  const button = document.createElement('button');
  button.className = 'back-button';
  button.innerHTML = '← Back';
  button.addEventListener('click', onClick);
  document.body.appendChild(button);
  return button;
}

export function removeBackButton() {
  const button = document.querySelector('.back-button');
  if (button) button.remove();
}
