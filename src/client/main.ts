import './global.css';
import './HexboundIcons.css';

import htm from 'htm';
import { h, render } from 'preact';
import { registerSW } from 'virtual:pwa-register';

import { App } from './App';

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();
}

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

const appElement = document.getElementById('app');

if (appElement) {
  render(html`<${App} />`, appElement);
} else {
  console.error("Could not find element with id 'app' to mount the application.");
}
