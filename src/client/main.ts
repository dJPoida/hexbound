import { render, h } from 'preact';
import htm from 'htm';
import { Router } from './components/Router/Router';
import { App } from './App';
import { StyleGuide } from './pages/StyleGuide/StyleGuide';

const html = htm.bind(h);

// Define the routes for the application
const routes = {
  '/': () => html`<${App} />`,
  '/style-guide': () => html`<${StyleGuide} />`,
};

const appElement = document.getElementById('app');

if (appElement) {
  render(html`<${Router} routes=${routes} />`, appElement);
} else {
  console.error("Could not find element with id 'app' to mount the application.");
} 