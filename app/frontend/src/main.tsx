import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global fetch interceptor to route API requests to public localtunnel backend
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    let urlStr = "";
    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      urlStr = input.url;
    }

    if (urlStr.startsWith('/api')) {
      const customUrl = localStorage.getItem('stalk_market_backend_url') || '';
      let rewrittenUrl = "";
      if (customUrl) {
        rewrittenUrl = customUrl.replace(/\/$/, '') + urlStr;
      } else {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          rewrittenUrl = urlStr;
        } else {
          rewrittenUrl = `http://127.0.0.1:8000${urlStr}`;
        }
      }
      const headers = new Headers(init?.headers || {});
      headers.set('Bypass-Tunnel-Reminder', 'true');
      
      if (input && typeof input === 'object' && !(input instanceof URL) && 'clone' in input) {
        const req = (input as Request).clone();
        const newRequest = new Request(rewrittenUrl, {
          method: req.method,
          headers: headers,
          body: req.body,
          referrer: req.referrer,
          referrerPolicy: req.referrerPolicy,
          mode: req.mode,
          credentials: req.credentials,
          cache: req.cache,
          redirect: req.redirect,
          integrity: req.integrity,
          keepalive: req.keepalive,
          signal: req.signal
        });
        return originalFetch(newRequest);
      }

      return originalFetch(rewrittenUrl, {
        ...init,
        headers
      });
    }
  } catch (err) {
    console.error("Global fetch interceptor error: ", err);
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

