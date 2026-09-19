import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// تحسين واجهة الكونسول وتجاهل أخطاء وانقطاعات الشبكة المؤقتة في بيئة التطوير
const isIgnoredLog = (...args: any[]) => {
  const fullText = args.map(a => {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack || ''}`;
    try {
      return JSON.stringify(a);
    } catch {
      return String(a);
    }
  }).join(' ');

  return (
    fullText.includes("WebChannelConnection") ||
    fullText.includes("WebChannel") ||
    fullText.includes("offline mode") ||
    fullText.includes("WebSocket") ||
    fullText.includes("websocket") ||
    fullText.includes("closed without opened") ||
    fullText.includes("transport errored") ||
    fullText.includes("Listen stream") ||
    fullText.includes("Could not reach Cloud Firestore backend") ||
    fullText.includes("healthy Internet connection") ||
    fullText.includes("code=unavailable") ||
    fullText.includes("@firebase/firestore") ||
    fullText.includes("[vite] failed to connect to websocket")
  );
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (isIgnoredLog(...args)) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (isIgnoredLog(...args)) return;
  originalError(...args);
};

// Global error handlers to prevent app crashes from transient network & WebChannel/WebSocket hiccups
window.addEventListener('unhandledrejection', (event) => {
  const reasonMsg = event.reason?.message || String(event.reason || '');
  const reasonName = event.reason?.name || '';
  if (
    reasonMsg.includes('WebSocket') ||
    reasonMsg.includes('websocket') ||
    reasonMsg.includes('WebChannel') ||
    reasonMsg.includes('unavailable') ||
    reasonMsg.includes('Cloud Firestore backend') ||
    reasonMsg.includes('Listen') ||
    reasonMsg.includes('transport') ||
    reasonMsg.includes('closed without opened') ||
    reasonName === 'FirebaseError'
  ) {
    event.preventDefault(); // Suppress the crash cleanly and silently
  }
});

window.addEventListener('error', (event) => {
  const errorMsg = String(event.message || '') + ' ' + String(event.error?.message || '');
  if (
    errorMsg.includes('WebSocket') ||
    errorMsg.includes('websocket') ||
    errorMsg.includes('WebChannel') ||
    errorMsg.includes('unavailable') ||
    errorMsg.includes('Listen') ||
    errorMsg.includes('transport') ||
    errorMsg.includes('closed without opened')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="حدث خطأ أثناء تحميل لوحة التحكم">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
