import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B5E20' : '#94A3B8'} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DetectIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B5E20' : '#94A3B8'} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4z" />
    <path d="M10 8h4M8 10v4M16 14v-4M14 16h-4" />
  </svg> // Scanning frame icon
);

const SymptomsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B5E20' : '#94A3B8'} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </svg>
);

const MapIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B5E20' : '#94A3B8'} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const SOSIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#1B5E20' : '#94A3B8'} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function BottomNav() {
  const { user } = useAuth();
  
  const tabs = [
    { to: user?.role === 'authority' ? '/dashboard' : '/home', label: 'Home', Icon: HomeIcon, end: true },
    { to: '/detect', label: 'Detect', Icon: DetectIcon },
    { to: '/sos', label: 'SOS', Icon: SOSIcon, highlight: true },
    { to: '/symptoms', label: 'Symptoms', Icon: SymptomsIcon },
    { to: '/profile', label: 'Profile', Icon: ProfileIcon },
  ];

  const baseClass =
    'flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative h-16';

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 flex bg-white border-t border-zg-border shadow-float-lg safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]"
    >
      {tabs.map(({ to, label, Icon, end, highlight }) => (
        <NavLink
          key={to}
          to={to}
          id={`nav-${label.toLowerCase()}`}
          end={end}
          className={({ isActive }) =>
            `${baseClass} ${
              isActive
                ? highlight ? 'text-white' : 'text-brand-green'
                : 'text-zg-text-muted hover:text-zg-text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {highlight ? (
                <div
                  className="absolute -top-6 w-[60px] h-[60px] rounded-full gradient-emergency shadow-float-red flex items-center justify-center transform transition-transform active:scale-95 border-4 border-warm-cream"
                >
                  <Icon active={isActive} />
                </div>
              ) : (
                <div className={`relative px-4 py-1 rounded-full transition-colors flex flex-col items-center gap-1 ${isActive ? 'bg-brand-green/10' : ''}`}>
                  <Icon active={isActive} />
                  <span
                    className={`text-[9px] font-bold tracking-wide transition-colors ${
                      isActive ? 'text-brand-green' : 'text-zg-text-muted'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
