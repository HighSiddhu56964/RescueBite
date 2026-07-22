import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [news] = useState([
    { tag: 'SAFETY ALERT', title: 'Russell\'s Viper spotted near urban zones in the East', time: '2 hours ago', img: 'https://images.unsplash.com/photo-1590122864386-8a58a7abaf69?auto=format&fit=crop&q=80&w=200&h=200', url: '#' },
    { tag: 'MEDICAL', title: 'New Antivenom stockpile verified at City General Hospital', time: '5 hours ago', img: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=200&h=200', url: '#' },
    { tag: 'NEWS', title: 'Forest Rangers deploy new snake-rescue helplines', time: '1 day ago', img: 'https://images.unsplash.com/photo-1618251268316-db5b5eb0be88?auto=format&fit=crop&q=80&w=200&h=200', url: '#' },
    { tag: 'ADVISORY', title: 'Heavy rains increase snake encounters in residential areas', time: '2 days ago', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200&h=200', url: '#' }
  ]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  const userName = user?.name?.split(' ')[0] || user?.username || 'Pilot';

  return (
    <div id="home-page" className="fixed inset-0 bg-warm-cream overflow-y-auto pb-28">
      
      {/* 1. Logo Header */}
      <div className="px-4 pt-12 pb-2 flex items-center justify-between animate-fade-in-up">
        {/* Logo Left */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center font-bold text-sm shadow-12dp">
            R
          </div>
          <span className="text-zg-text font-black text-lg tracking-tight">ResqueBite</span>
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center gap-3">
          <Link to="/profile" className="w-10 h-10 rounded-full bg-mint-glow border-2 border-brand-green flex items-center justify-center overflow-hidden shadow-8dp">
            <span className="text-brand-green-dark font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </Link>
        </div>
      </div>

      <div className="px-5 mt-2 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-zg-text leading-tight">
          {t('home.greeting').replace('{{name}}', '')} <span className="font-extrabold">{userName}</span>
        </h1>
        {/* Status Pill */}
        <div className="mt-2 inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-8dp border border-zg-border">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-zg-success animate-status-glow' : 'bg-zg-warning'}`} />
            <span className="text-zg-text-secondary text-[10px] font-bold uppercase tracking-wider">
              {isOnline ? t('home.statusOnline') : t('home.statusOffline')}
            </span>
        </div>
      </div>



      {/* 2. Hero Emergency Card */}
      <div className="px-4 mt-6 animate-slide-up">
        <Link to="/sos" id="home-sos-card" className="block relative">
          <div className="relative rounded-[24px] p-6 overflow-hidden shadow-[0_8px_30px_rgba(244,63,94,0.25)] transition-all active:scale-[0.98] border border-rose-400 bg-gradient-to-br from-rose-500 to-rose-600">
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-black tracking-widest uppercase">
                  {t('home.emergencyAction')}
                </span>
              </div>
              <div>
                <h2 className="text-white text-[28px] font-black leading-none mb-1 whitespace-pre-line">{t('home.emergencyRescueTitle')}</h2>
                <p className="text-white/90 text-sm font-medium pr-12">{t('home.emergencyRescueDesc')}</p>
              </div>
            </div>
            {/* Minimal Icon */}
            <div className="absolute right-6 bottom-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Quick Actions */}
      <div className="px-4 mt-6 animate-fade-in-up">
        <h3 className="text-zg-text text-sm font-extrabold mb-3">{t('home.quickActions')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Identify Snake */}
          <Link to="/detect">
            <div className="bg-white rounded-[20px] p-4 shadow-8dp hover:shadow-12dp transition-all active:scale-[0.97] border border-zg-border h-full flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-mint-glow flex items-center justify-center mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4z" />
                  <path d="M10 8h4M8 10v4M16 14v-4M14 16h-4" />
                </svg>
              </div>
              <p className="text-zg-text text-sm font-bold leading-tight whitespace-pre-line">{t('home.identifySnake')}</p>
            </div>
          </Link>

          {/* Check Severity */}
          <Link to="/symptoms">
            <div className="bg-white rounded-[20px] p-4 shadow-8dp hover:shadow-12dp transition-all active:scale-[0.97] border border-zg-border h-full flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  <line x1="12" y1="10" x2="12" y2="16" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                </svg>
              </div>
              <p className="text-zg-text text-sm font-bold leading-tight whitespace-pre-line">{t('home.checkSeverity')}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Map & Data Visualizations */}
      <div className="px-4 mt-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-zg-text text-sm font-extrabold">{t('home.regionalRiskMap')}</h3>
          <Link to="/map" className="text-[10px] font-black text-brand-green tracking-widest uppercase px-2 py-1 bg-mint-glow rounded-full">
            {t('home.viewAll')}
          </Link>
        </div>
        
        <Link to="/map" className="block relative">
          <div className="bg-white border border-zg-border rounded-[24px] shadow-8dp hover:shadow-12dp transition-all overflow-hidden h-72">
            <div className="w-full h-full relative z-0">
               <MapContainer center={[21.0, 78.0]} zoom={4} zoomControl={true} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} className="w-full h-full [&>.leaflet-control-container_.leaflet-control-zoom]:!border-none [&>.leaflet-control-container_.leaflet-control-zoom_a]:!text-zg-text [&>.leaflet-control-container_.leaflet-control-zoom_a]:!bg-white/90 [&>.leaflet-control-container_.leaflet-control-zoom_a]:!shadow-sm" style={{ height: '100%', width: '100%' }}>
                 <TileLayer 
                   url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                   attribution="&copy; Esri"
                 />
                 <TileLayer 
                   url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                 />
               </MapContainer>
               
               {/* Maximize Icon */}
               <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm pointer-events-auto z-[1000]">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
               </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 5. Latest Incident News */}
      <div className="mt-6 mb-8 pl-4 pr-1 animate-fade-in-up">
        <h3 className="text-zg-text text-sm font-extrabold mb-3">{t('home.latestNews')}</h3>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-3 snap-x snap-mandatory">
          {news.map((item, i) => (
            <a href={item.url || '#'} target={item.url !== '#' ? "_blank" : "_self"} rel="noopener noreferrer" key={i} className="flex-shrink-0 w-64 bg-white rounded-[20px] p-3 shadow-8dp border border-zg-border snap-start flex items-center gap-3 active:scale-[0.98] transition-transform">
              <img src={item.img} alt="News thumbnail" className="w-16 h-16 rounded-[12px] object-cover bg-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-brand-red tracking-widest uppercase mb-1 block">
                  {item.tag}
                </span>
                <p className="text-zg-text text-xs font-bold leading-tight mb-1 line-clamp-2">
                  {item.title}
                </p>
                <p className="text-zg-text-muted text-[10px] font-medium">
                  {item.time}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
