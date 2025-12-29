/**
 * Router.ts
 *
 * Simple hash-based router for Physics Playground.
 * Routes: #/, #/ball-pit, #/dominoes
 */

export type Route = 'home' | 'ball-pit' | 'dominoes';

export class Router {
  private currentRoute: Route = 'home';
  private onRouteChange: (route: Route) => void;

  constructor(onRouteChange: (route: Route) => void) {
    this.onRouteChange = onRouteChange;

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // Handle initial route
    this.handleRoute();
  }

  private handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    switch (hash) {
      case '/':
      case '':
        this.currentRoute = 'home';
        break;
      case '/ball-pit':
        this.currentRoute = 'ball-pit';
        break;
      case '/dominoes':
        this.currentRoute = 'dominoes';
        break;
      default:
        this.currentRoute = 'home';
    }

    this.onRouteChange(this.currentRoute);
  }

  navigate(route: Route) {
    const hash = route === 'home' ? '/' : `/${route}`;
    window.location.hash = hash;
  }

  getCurrentRoute(): Route {
    return this.currentRoute;
  }
}
