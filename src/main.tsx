import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global error handlers to prevent app crashes from transient network & WebChannel/WebSocket hiccups
window.addEventListener('unhandledrejection', (event) => {
  const reasonMsg = event.reason?.message || String(event.reason || '');
  const reasonName = event.reason?.name || '';
  if (
    reasonMsg.includes('WebSocket') ||
    reasonMsg.includes('WebChannel') ||
    reasonMsg.includes('unavailable') ||
    reasonMsg.includes('Cloud Firestore backend') ||
    reasonMsg.includes('Listen') ||
    reasonMsg.includes('transport') ||
    reasonName === 'FirebaseError'
  ) {
    event.preventDefault(); // Suppress the crash
    console.warn('Suppressed transient network/websocket error:', event.reason);
  }
});

window.addEventListener('error', (event) => {
  const errorMsg = String(event.message || '');
  if (
    errorMsg.includes('WebSocket') ||
    errorMsg.includes('WebChannel') ||
    errorMsg.includes('unavailable') ||
    errorMsg.includes('Listen')
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
