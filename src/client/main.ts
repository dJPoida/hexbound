import { render, h } from 'preact';
import htm from 'htm';
import { registerSW } from 'virtual:pwa-register';
import { Router } from './components/Router/Router';
import { App } from './App';
import { StyleGuide } from './pages/StyleGuide/StyleGuide';
import { Utils } from './pages/Utils/Utils';
import './global.css';
import './HexboundIcons.css';

// Register the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // A new service worker is waiting to activate.
    // Send a message to it to trigger the 'skipWaiting' process.
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});

const html = htm.bind(h);

// Define the routes for the application
const routes = {
  '/': () => html`<${App} />`,
  '/style-guide': () => html`<${StyleGuide} />`,
  '/utils': () => html`<${Utils} />`,
};

const utilityRoutes = ['/style-guide', '/utils'];

const appElement = document.getElementById('app');

if (appElement) {
  render(html`<${Router} routes=${routes} utilityRoutes=${utilityRoutes} />`, appElement);
} else {
  console.error("Could not find element with id 'app' to mount the application.");
} 