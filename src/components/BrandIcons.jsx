// Iconos de marcas (Lucide no incluye logos de marcas). SVG livianos en línea.
const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true }

export const InstagramIcon = ({ className }) => (
  <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
)

export const FacebookIcon = ({ className }) => (
  <svg {...base} className={className} fill="currentColor">
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z" />
  </svg>
)

export const TikTokIcon = ({ className }) => (
  <svg {...base} className={className} fill="currentColor">
    <path d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.2c-1.4.1-2.7-.3-3.9-1.1v6.2c0 3.6-2.7 5.8-5.8 5.8-3.1 0-5.6-2.4-5.6-5.6 0-3.5 3-6 6.6-5.5v3.3c-1.6-.4-3.3.6-3.3 2.3 0 1.3 1 2.3 2.3 2.3 1.4 0 2.4-.9 2.4-2.6V3h3.4z" />
  </svg>
)

export const WhatsAppIcon = ({ className }) => (
  <svg {...base} className={className} fill="currentColor">
    <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3c-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4.1 1.7.7 2.4.8 3.2.7.5-.1 1.4-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
  </svg>
)
