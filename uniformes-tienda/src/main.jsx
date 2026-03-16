import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Google Analytics 4 ────────────────────────────────────────────────────────
// Agrega VITE_GA_ID=G-XXXXXXXXXX en tu archivo .env para activar el tracking.
// En desarrollo (sin la variable) no se carga nada, sin ruido en la consola.
const GA_ID = import.meta.env.VITE_GA_ID;
if (GA_ID && typeof GA_ID === 'string' && /^G-[A-Z0-9]+$/.test(GA_ID)) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, {
    anonymize_ip: true,          // Privacidad: anonimiza la IP del usuario
    send_page_view: true,
  });
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
