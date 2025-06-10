import { Component, h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface RouterProps {
  routes: Record<string, () => h.JSX.Element>;
  fallback?: () => h.JSX.Element;
}

const getCurrentPath = () => window.location.pathname;

export class Router extends Component<RouterProps> {
  state = {
    path: getCurrentPath(),
  };

  handleRouteChange = () => {
    this.setState({ path: getCurrentPath() });
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handleRouteChange);
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleRouteChange);
  }

  render() {
    const { routes, fallback } = this.props;
    const { path } = this.state;

    const PageComponent = routes[path] || fallback;

    return PageComponent ? <PageComponent /> : null;
  }
} 