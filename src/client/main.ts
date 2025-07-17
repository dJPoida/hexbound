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
    // Store the current URL before refreshing
    const currentUrl = window.location.href;
    sessionStorage.setItem('pendingUpdateUrl', currentUrl);

    // A new service worker is waiting to activate.
    // Send a message to it to trigger the 'skipWaiting' process.
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});

// Check if we're returning from an update and redirect to the stored URL
const pendingUpdateUrl = sessionStorage.getItem('pendingUpdateUrl');
if (pendingUpdateUrl) {
  sessionStorage.removeItem('pendingUpdateUrl');
  if (window.location.href !== pendingUpdateUrl) {
    window.location.href = pendingUpdateUrl;
  }
}

const html = htm.bind(h);

const appElement = document.getElementById('app');

if (appElement) {
  render(html`<${App} />`, appElement);
} else {
  console.error("Could not find element with id 'app' to mount the application.");
}
