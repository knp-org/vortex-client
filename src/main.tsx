import ReactDOM from "react-dom/client";
import App from "./App";

// Patch window.fetch in Tauri to resolve relative API routes and inject auth
if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
    if (url.startsWith('/api/')) {
      const savedUrl = localStorage.getItem('server_url') || 'http://localhost:3000';
      const cleanServerUrl = savedUrl.replace(/\/$/, '');
      url = `${cleanServerUrl}${url}`;

      // Inject auth token for cross-origin API calls (cookies won't work cross-origin in Tauri)
      const token = localStorage.getItem('auth_token');
      if (token) {
        init = init || {};
        const existingHeaders = new Headers(init.headers);
        if (!existingHeaders.has('Authorization')) {
          existingHeaders.set('Authorization', `Bearer ${token}`);
        }
        init.headers = existingHeaders;
      }

      if (typeof input === 'string') {
        input = url;
      } else if (input instanceof URL) {
        input = new URL(url);
      } else {
        input = new Request(url, input);
      }
    }
    return originalFetch(input, init);
  };
}

// NOTE: StrictMode is intentionally disabled. Its dev-only double-invocation of
// effects double-spawns the embedded mpv process (Player setup), which races and
// can orphan an mpv instance. Production never double-invokes regardless.
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);

