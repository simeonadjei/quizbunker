import { createRoot } from 'react-dom/client';
import { setBaseUrl, setCredentials } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// On Render (and other non-Replit hosts) the frontend and API server are
// deployed as separate services on different domains, so relative API
// paths would otherwise resolve against the frontend's own origin.
// VITE_API_URL points requests at the deployed API server. Leave unset on
// Replit, where the artifact proxy already routes same-origin.
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl);
  // Cross-origin deployment: session cookies must be sent with every request
  // so that admin auth (and regular auth) is preserved across calls.
  setCredentials("include");
}

createRoot(document.getElementById('root')!).render(<App />);
