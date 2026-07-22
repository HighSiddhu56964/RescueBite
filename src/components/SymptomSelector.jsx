import { useState } from 'react';
import { SYMPTOM_CATALOG } from '../utils/guidanceEngine';

const CATEGORY_ORDER = ['Critical', 'Neurological', 'Pain', 'Swelling', 'Skin', 'Systemic'];

const RISK_COLORS = {
  HIGH: { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)', text: '#EF4444', dot: '#DC2626' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#F59E0B', dot: '#F59E0B' },
  LOW: { bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', text: '#22C55E', dot: '#22C55E' },
};

export default function SymptomSelector({ onSubmit, riskLevel }) {
  const [selected, setSelected] = useState([]);

  function toggle(symptomId) {
    setSelected((prev) =>
      prev.includes(symptomId)
        ? prev.filter((s) => s !== symptomId)
        : [...prev, symptomId]
    );
  }

  function handleSubmit() {
    const labels = selected.map(
      (id) => SYMPTOM_CATALOG.find((s) => s.id === id)?.label || id
    );
    onSubmit(labels);
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    name: cat,
    items: SYMPTOM_CATALOG.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  const accentColor =
    riskLevel === 'HIGH' ? '#DC2626' : riskLevel === 'MEDIUM' ? '#F59E0B' : '#22C55E';

  const hasHighRiskSelected = selected.some((id) => {
    const sym = SYMPTOM_CATALOG.find((s) => s.id === id);
    return sym?.risk === 'HIGH';
  });

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div
        className="rounded-3xl p-4 bg-zg-card border border-zg-border shadow-float"
        style={{
          background: `${accentColor}08`,
          border: `1px solid ${accentColor}20`,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">🩺</span>
          <h3 className="text-zg-text text-sm font-bold">Select Your Symptoms</h3>
        </div>
        <p className="text-zg-text-secondary text-xs leading-relaxed">
          Tap all symptoms you or the patient are experiencing. This helps provide the most accurate guidance.
        </p>
      </div>

      {/* High-risk warning */}
      {hasHighRiskSelected && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-red-50 border border-red-200"
          style={{
            animation: 'symptomPulse 2s ease-in-out infinite',
          }}
        >
          <span className="text-xl">🚨</span>
          <p className="text-zg-emergency text-xs font-semibold leading-snug">
            Critical symptoms detected — seek immediate medical help
          </p>
        </div>
      )}

      {/* Symptom Categories */}
      {grouped.map((group) => {
        const catColor =
          group.name === 'Critical' ? '#DC2626' :
          group.name === 'Neurological' ? '#F59E0B' :
          group.name === 'Pain' ? '#FB923C' :
          group.name === 'Swelling' ? '#A78BFA' :
          group.name === 'Skin' ? '#38BDF8' :
          '#22C55E';

        const catIcon =
          group.name === 'Critical' ? '⚡' :
          group.name === 'Neurological' ? '🧠' :
          group.name === 'Pain' ? '💢' :
          group.name === 'Swelling' ? '🫧' :
          group.name === 'Skin' ? '🩹' :
          '🫀';

        return (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">{catIcon}</span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: catColor }}
              >
                {group.name}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((symptom) => {
                const isSelected = selected.includes(symptom.id);
                const rc = RISK_COLORS[symptom.risk] || RISK_COLORS.LOW;

                return (
                  <button
                    key={symptom.id}
                    onClick={() => toggle(symptom.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.95]"
                    style={{
                      background: isSelected ? rc.bg : 'var(--zg-bg)',
                      border: isSelected
                        ? `1.5px solid ${rc.border}`
                        : '1.5px solid var(--zg-border)',
                      color: isSelected ? rc.text : 'var(--zg-text-secondary)',
                      boxShadow: isSelected ? `0 0 12px ${rc.bg}` : 'none',
                    }}
                  >
                    {/* Risk dot */}
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 border border-white/20"
                      style={{ background: isSelected ? rc.dot : '#CBD5E1' }}
                    />
                    {symptom.label}
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected count + Submit */}
      <div className="pt-2 space-y-3">
        {selected.length > 0 && (
          <p className="text-zg-text-secondary text-xs text-center font-medium">
            {selected.length} symptom{selected.length !== 1 ? 's' : ''} selected
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
          style={{
            background:
              selected.length > 0
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
                : 'var(--zg-bg)',
            color: selected.length > 0 ? '#fff' : 'var(--zg-text-muted)',
            border:
              selected.length > 0
                ? `2px solid ${accentColor}80`
                : '2px solid var(--zg-border)',
            boxShadow:
              selected.length > 0 ? `0 4px 20px ${accentColor}30` : 'none',
            opacity: selected.length > 0 ? 1 : 0.6,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          {selected.length > 0 ? 'Get Medical Guidance' : 'Select symptoms to continue'}
        </button>

        <button
          onClick={() => onSubmit([])}
          className="w-full py-3.5 rounded-2xl bg-zg-card border border-zg-border text-zg-text-secondary font-semibold text-xs transition-all active:scale-[0.97] shadow-float"
        >
          Skip — Show general guidance
        </button>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes symptomPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.2); }
          50% { box-shadow: 0 0 15px rgba(220,38,38,0.1); }
        }
      `}</style>
    </div>
  );
}
