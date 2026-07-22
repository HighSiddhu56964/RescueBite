import SymptomChecker from '../components/SymptomChecker';
import { useNavigate } from 'react-router-dom';

export default function SymptomCheckerPage() {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 bg-zg-bg">
      <button onClick={() => navigate('/home')} className="absolute top-12 left-4 z-50 flex items-center gap-2 text-zg-text-secondary hover:text-zg-text text-sm font-bold bg-white px-3 py-1.5 rounded-full shadow-sm border border-zg-border">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        Back
      </button>
      <SymptomChecker />
    </div>
  );
}
