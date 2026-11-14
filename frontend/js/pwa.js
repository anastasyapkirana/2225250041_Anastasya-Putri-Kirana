// Install ke layar utama + service worker.
import { logEvent } from './api.js';
import * as content from './content.js';

let deferredPrompt = null;
const listeners = new Set();

export const canInstall = () => Boolean(deferredPrompt);
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
export function onInstallChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  logEvent('install', { payload: { outcome } });
  deferredPrompt = null;
  listeners.forEach((fn) => fn());
  return outcome === 'accepted';
}

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; listeners.forEach((fn) => fn()); });
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!('serviceWorker' in navigator) || !secure) return;
  navigator.serviceWorker.register('sw.js')
    .then(() => content.preloadAll())
    .catch(() => { /* tidak didukung di lingkungan ini */ });
}
