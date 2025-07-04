import { Component, h } from 'preact';

interface RouterProps {
  routes: Record<string, () => h.JSX.Element>;
  utilityRoutes: string[];
  fallback?: () => h.JSX.Element;
}

const getCurrentPath = () => window.location.pathname;

export class Router extends Component<RouterProps> {
  state = {
    path: getCurrentPath(),
  };

  handleRouteChange = () => {
    const newPath = getCurrentPath();
    this.updateBodyClass(newPath);
    this.setState({ path: newPath });
  };

  updateBodyClass(path: string) {
    const appRoot = document.getElementById('app');
    if (appRoot) {
      if (this.props.utilityRoutes.includes(path)) {
        appRoot.classList.add('utility-page-active');
      } else {
        appRoot.classList.remove('utility-page-active');
      }
    }
  }

  componentDidMount() {
    window.addEventListener('popstate', this.handleRouteChange);
    window.addEventListener('pushstate', this.handleRouteChange);
    this.updateBodyClass(this.state.path); // Initial load
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleRouteChange);
    window.removeEventListener('pushstate', this.handleRouteChange);
    // Clean up class on unmount
    const appRoot = document.getElementById('app');
    if (appRoot) {
      appRoot.classList.remove('utility-page-active');
    }
  }

  render() {
    const { routes, fallback } = this.props;
    const { path } = this.state;

    const PageComponent = routes[path] || (path.startsWith('/game/') ? routes['/'] : undefined) || fallback;

    return PageComponent ? <PageComponent /> : null;
  }
} 