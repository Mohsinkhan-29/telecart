/* Stroke icons used across the storefront. Admin pickers use ICON_NAMES. */
const P = {
  phone: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  tablet: <><rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M11 18h2" /></>,
  watch: <><rect x="7" y="6" width="10" height="12" rx="3" /><path d="M9 6l.8-3h4.4l.8 3M9 18l.8 3h4.4l.8-3" /></>,
  charger: <path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 01-10 0zM12 16v5" />,
  cable: <path d="M4 18c0-6 6-3 8-7s-2-7 3-8M15 3h4v4M9 21H5v-4" />,
  headset: <><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="13" width="4" height="7" rx="2" /><rect x="17" y="13" width="4" height="7" rx="2" /></>,
  case: <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />,
  battery: <><rect x="3" y="7" width="16" height="10" rx="2.5" /><path d="M21 11v2M7 10v4M11 10v4" /></>,
  shield: <><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  whatsapp: <><path d="M20 12a8 8 0 01-11.7 7.1L4 20l1-4.1A8 8 0 1120 12z" /><path d="M9 9c0 3 3 6 6 6l1-1.6-2-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1-1-2z" /></>,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5 6.5-5s5.7 1.4 6.5 5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M17 14.5c2.4.2 4 1.6 4.5 4.5" /></>,
  return: <><path d="M4 9h11a5 5 0 010 10H8" /><path d="M8 5L4 9l4 4" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  cart: <><path d="M3 4h2.5l2.2 11h10.6l2-8H7" /><circle cx="9.5" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></>,
  call: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  facebook: <path d="M14 8h3V4h-3a4 4 0 00-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8.5c0-.3.2-.5.5-.5z" />,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17" cy="7" r=".8" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  box: <><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
};

export const ICON_NAMES = Object.keys(P);

export default function Icon({ name, size = 20, className = "", filled = false }) {
  const body = P[name] ?? P.box;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`tc-i ${className}`}
      style={filled ? { fill: "currentColor", stroke: "none" } : undefined}>
      {body}
    </svg>
  );
}
