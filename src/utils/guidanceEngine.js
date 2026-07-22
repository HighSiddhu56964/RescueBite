/* ══════════════════════════════════════════════════════════════
   guidanceEngine.js — Lightweight RAG Guidance System
   Static dataset + rule-based symptom matching. No ML required.
   Works fully offline (text guidance). Videos need connectivity.
   ══════════════════════════════════════════════════════════════ */

// ─── Static Knowledge Base ───────────────────────────────────

const KNOWLEDGE_BASE = [
  {
    condition: 'venomous_high',
    keywords: ['severe pain', 'swelling', 'dizziness', 'breathing difficulty', 'bleeding', 'nausea', 'vomiting', 'paralysis', 'blurred vision', 'numbness', 'rapid heartbeat', 'drooping eyelids'],
    guidance: [
      { step: 1, text: 'Call emergency services (112) IMMEDIATELY. Time is critical.' },
      { step: 2, text: 'Lay the victim flat. Elevate legs slightly if showing signs of shock.' },
      { step: 3, text: 'Immobilize the bitten limb using a splint or sling. Keep it at or BELOW heart level.' },
      { step: 4, text: 'Remove all rings, watches, bracelets, and tight clothing near the bite — swelling will worsen.' },
      { step: 5, text: 'Gently wash the wound with clean water and soap. Do NOT scrub.' },
      { step: 6, text: 'Apply a loose, sterile bandage over the wound. Mark swelling edges with a pen and note the time.' },
      { step: 7, text: 'Monitor breathing and pulse every 2 minutes until help arrives.' },
      { step: 8, text: 'If the victim stops breathing, begin CPR immediately.' },
    ],
    dos: [
      'Call emergency services (112) IMMEDIATELY',
      'Keep the victim CALM and completely STILL',
      'Immobilize the bitten limb BELOW heart level',
      'Remove rings, watches, tight clothing near bite',
      'Mark the edge of swelling with a pen + note the time',
      'Transport to the nearest hospital WITH antivenom',
      'Photograph the snake from a safe distance if possible',
    ],
    donts: [
      'Do NOT cut or suck the wound',
      'Do NOT apply a tourniquet or tight bandage',
      'Do NOT apply ice or cold compress',
      'Do NOT give the victim alcohol or aspirin',
      'Do NOT attempt to catch or kill the snake',
      'Do NOT let the victim walk or run',
    ],
    severity: 'HIGH',
  },
  {
    condition: 'venomous_medium',
    keywords: ['pain', 'swelling', 'nausea', 'dizziness', 'weakness', 'redness', 'bruising', 'mild numbness', 'headache', 'anxiety'],
    guidance: [
      { step: 1, text: 'Move the victim away from the snake to a safe location.' },
      { step: 2, text: 'Treat the bite as VENOMOUS until confirmed otherwise by a doctor.' },
      { step: 3, text: 'Keep the bitten limb immobilized and below heart level.' },
      { step: 4, text: 'Wash the wound gently with soap and water.' },
      { step: 5, text: 'Apply a loose bandage — cover but do not compress.' },
      { step: 6, text: 'Note the exact time of the bite and any symptom changes.' },
      { step: 7, text: 'Transport to hospital as quickly as possible. Do NOT wait for symptoms to worsen.' },
    ],
    dos: [
      'Treat the bite as VENOMOUS until proven otherwise',
      'Keep the person calm and the limb immobilized',
      'Seek hospital care — do NOT wait for symptoms to worsen',
      'Bring a photo of the snake if safely possible',
      'Note the exact time of the bite',
      'Keep the bite area clean and dry',
    ],
    donts: [
      'Do NOT apply a tourniquet',
      'Do NOT cut the wound or try to suck venom',
      'Do NOT apply ice or any home remedies',
      'Do NOT delay hospital visit to "see if symptoms develop"',
      'Do NOT give medications without medical advice',
    ],
    severity: 'MEDIUM',
  },
  {
    condition: 'non_venomous',
    keywords: ['pain', 'redness', 'mild swelling', 'scratch', 'teeth marks', 'bleeding', 'soreness'],
    guidance: [
      { step: 1, text: 'Clean the wound thoroughly with soap and running water for at least 5 minutes.' },
      { step: 2, text: 'Apply antiseptic solution (iodine or hydrogen peroxide) and let it dry.' },
      { step: 3, text: 'Cover with a clean, sterile gauze bandage.' },
      { step: 4, text: 'Take an over-the-counter pain reliever (ibuprofen or acetaminophen) if needed.' },
      { step: 5, text: 'Check the wound daily. See a doctor if redness spreads, pus develops, or fever occurs.' },
      { step: 6, text: 'Visit a doctor for a tetanus booster if not updated in the last 5 years.' },
    ],
    dos: [
      'Wash wound thoroughly with soap and clean water for 5 minutes',
      'Apply antiseptic (iodine or hydrogen peroxide)',
      'Cover with a clean, sterile bandage',
      'Monitor for signs of infection (redness, warmth, pus) over 24–48 hours',
      'Visit a doctor for tetanus shot if not updated in 5 years',
      'Take an over-the-counter pain reliever if needed',
    ],
    donts: [
      'Do NOT ignore signs of infection (increasing redness, swelling, fever)',
      'Do NOT apply home remedies like turmeric paste or herbal oils',
      'Do NOT leave the wound uncovered',
    ],
    severity: 'LOW',
  },
  {
    condition: 'general_first_aid',
    keywords: ['wound', 'bite', 'pain', 'injury', 'unknown'],
    guidance: [
      { step: 1, text: 'Stay calm. Move away from the area where the bite occurred.' },
      { step: 2, text: 'Wash the affected area with soap and clean water.' },
      { step: 3, text: 'Apply a sterile bandage to the wound.' },
      { step: 4, text: 'If possible, note the appearance of the animal (color, size, pattern).' },
      { step: 5, text: 'Seek medical attention as soon as possible for proper evaluation.' },
      { step: 6, text: 'Watch for any delayed symptoms over the next 24 hours.' },
    ],
    dos: [
      'Stay calm and move to safety',
      'Clean the wound with soap and water',
      'Apply a clean bandage',
      'Note characteristics of the animal if possible',
      'Seek medical evaluation promptly',
      'Monitor for any new symptoms',
    ],
    donts: [
      'Do NOT panic or make sudden movements',
      'Do NOT apply home remedies without medical advice',
      'Do NOT ignore the wound — always get it checked',
    ],
    severity: 'LOW',
  },
];

// ─── Symptom Catalog (for multi-select UI) ──────────────────

export const SYMPTOM_CATALOG = [
  { id: 'severe_pain', label: 'Severe Pain', category: 'Pain', risk: 'HIGH' },
  { id: 'pain', label: 'Pain at bite site', category: 'Pain', risk: 'LOW' },
  { id: 'swelling', label: 'Swelling', category: 'Swelling', risk: 'MEDIUM' },
  { id: 'mild_swelling', label: 'Mild Swelling', category: 'Swelling', risk: 'LOW' },
  { id: 'redness', label: 'Redness', category: 'Skin', risk: 'LOW' },
  { id: 'bruising', label: 'Bruising', category: 'Skin', risk: 'MEDIUM' },
  { id: 'bleeding', label: 'Uncontrolled Bleeding', category: 'Skin', risk: 'HIGH' },
  { id: 'nausea', label: 'Nausea', category: 'Systemic', risk: 'MEDIUM' },
  { id: 'vomiting', label: 'Vomiting', category: 'Systemic', risk: 'HIGH' },
  { id: 'dizziness', label: 'Dizziness', category: 'Neurological', risk: 'MEDIUM' },
  { id: 'blurred_vision', label: 'Blurred Vision', category: 'Neurological', risk: 'HIGH' },
  { id: 'numbness', label: 'Numbness / Tingling', category: 'Neurological', risk: 'HIGH' },
  { id: 'breathing_difficulty', label: 'Difficulty Breathing', category: 'Critical', risk: 'HIGH' },
  { id: 'paralysis', label: 'Paralysis / Can\'t Move', category: 'Critical', risk: 'HIGH' },
  { id: 'rapid_heartbeat', label: 'Rapid Heartbeat', category: 'Critical', risk: 'HIGH' },
  { id: 'weakness', label: 'Muscle Weakness', category: 'Systemic', risk: 'MEDIUM' },
  { id: 'headache', label: 'Headache', category: 'Systemic', risk: 'LOW' },
  { id: 'anxiety', label: 'Anxiety / Panic', category: 'Systemic', risk: 'LOW' },
  { id: 'drooping_eyelids', label: 'Drooping Eyelids', category: 'Critical', risk: 'HIGH' },
];

// ─── YouTube Video Map ──────────────────────────────────────
// IDs verified via YouTube oEmbed + embed URL (HTTP 200). Older IDs were invalid → "Video unavailable".

const VIDEO_MAP = {
  venomous_high: {
    id: 'yyicCyoEpPM',
    title: 'When Snakes Bite: Pre-Hospital Care',
    channel: 'University of California Television (UCTV)',
  },
  venomous_medium: {
    id: 'vatnwqGMNdQ',
    title: 'Snake bites: pressure bandage & the “square” rule',
    channel: 'First Aid Pro',
  },
  non_venomous: {
    id: 'oGvyiWfXB7c',
    title: 'First Aid Treatment for Wounds',
    channel: 'ehowhealth',
  },
  general_first_aid: {
    id: 'oGvyiWfXB7c',
    title: 'First Aid Treatment for Wounds',
    channel: 'ehowhealth',
  },
};

/** Default when mapping fails or ID is missing (always a known‑good embed). */
export const DEFAULT_YOUTUBE_FALLBACK_ID = VIDEO_MAP.general_first_aid.id;

/** Plain YouTube ID map for demos / external use */
export const videoMap = {
  venomous_high: VIDEO_MAP.venomous_high.id,
  venomous_medium: VIDEO_MAP.venomous_medium.id,
  non_venomous: VIDEO_MAP.non_venomous.id,
  general_first_aid: VIDEO_MAP.general_first_aid.id,
};

/** Extract 11-char video id from common URL shapes or return valid raw id. */
export function normalizeYoutubeVideoId(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  let m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m?.[1]) return m[1];
  m = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (m?.[1]) return m[1];
  m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m?.[1]) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  return '';
}

/** Canonical embed URL (never youtu.be or watch?v= in the iframe src). */
export function getYoutubeEmbedUrl(videoId) {
  const id = normalizeYoutubeVideoId(videoId) || DEFAULT_YOUTUBE_FALLBACK_ID;
  return `https://www.youtube.com/embed/${id}`;
}

function stepsToString(guidanceArr) {
  return guidanceArr.map((g) => `${g.step}. ${g.text}`).join('\n');
}

/** Static guidance blocks keyed by condition (risk + prediction matching in getGuidance) */
export const guidanceData = (() => {
  const by = (id) => KNOWLEDGE_BASE.find((e) => e.condition === id);
  const mk = (id) => {
    const e = by(id);
    if (!e) return null;
    return {
      steps: stepsToString(e.guidance),
      dos: [...e.dos],
      donts: [...e.donts],
      severity: e.severity,
      video_id: videoMap[id] ?? null,
    };
  };
  return {
    venomous_high: mk('venomous_high'),
    venomous_medium: mk('venomous_medium'),
    non_venomous: mk('non_venomous'),
  };
})();

const FALLBACK_VIDEO = VIDEO_MAP.general_first_aid;

// ─── Condition Resolver ─────────────────────────────────────

function resolveCondition(prediction, riskLevel) {
  const { isSnakebite, venomous } = prediction;

  if (!isSnakebite) return 'general_first_aid';

  if (venomous === true) {
    if (riskLevel === 'HIGH') return 'venomous_high';
    return 'venomous_medium';
  }

  if (venomous === false) return 'non_venomous';

  // Unknown venomous status — treat as medium risk
  return 'venomous_medium';
}

// ─── Symptom Matching Scorer ────────────────────────────────

function scoreSymptomMatch(userSymptoms, conditionKeywords) {
  if (!userSymptoms || userSymptoms.length === 0) return 0;

  const normalizedUser = userSymptoms.map((s) =>
    s.toLowerCase().replace(/[_-]/g, ' ').trim()
  );

  let matchCount = 0;
  for (const keyword of conditionKeywords) {
    const normalizedKW = keyword.toLowerCase();
    for (const userSym of normalizedUser) {
      if (userSym.includes(normalizedKW) || normalizedKW.includes(userSym)) {
        matchCount++;
        break;
      }
    }
  }

  return matchCount;
}

// ─── Main Guidance Function ─────────────────────────────────

/**
 * getGuidance — Core RAG resolver
 *
 * @param {Object} input
 * @param {string[]} input.symptoms - Array of symptom strings
 * @param {string} input.risk_level - "HIGH" | "MEDIUM" | "LOW" | "NONE"
 * @param {Object} input.prediction - { isSnakebite, venomous }
 *
 * @returns {Object} {
 *   guidance_text: Array<{step, text}>,
 *   dos: string[],
 *   donts: string[],
 *   severity: string,
 *   video: { id, title, channel },
 *   condition: string,
 *   matchScore: number,
 *   summary: string
 * }
 */
export function getGuidance({ symptoms = [], risk_level = 'LOW', prediction = {} }) {
  // Step 1: Resolve initial condition from detection result
  const resolvedCondition = resolveCondition(prediction, risk_level);

  // Step 2: Score each knowledge base entry against user symptoms
  const scored = KNOWLEDGE_BASE.map((entry) => ({
    ...entry,
    score: scoreSymptomMatch(symptoms, entry.keywords),
  }));

  // Step 3: Find best match
  // Priority: resolved condition first, then symptom score, then severity
  const severityRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  scored.sort((a, b) => {
    // Boost the resolved condition
    const aIsResolved = a.condition === resolvedCondition ? 100 : 0;
    const bIsResolved = b.condition === resolvedCondition ? 100 : 0;

    const aTotal = aIsResolved + a.score * 10 + (severityRank[a.severity] || 0);
    const bTotal = bIsResolved + b.score * 10 + (severityRank[b.severity] || 0);

    return bTotal - aTotal;
  });

  const best = scored[0];

  // Step 4: If user has HIGH-risk symptoms, escalate
  let finalSeverity = best.severity;
  if (symptoms.length > 0) {
    const highRiskSymptoms = SYMPTOM_CATALOG.filter((s) => s.risk === 'HIGH');
    const hasHighRisk = symptoms.some((userSym) =>
      highRiskSymptoms.some(
        (hrs) =>
          userSym.toLowerCase().includes(hrs.label.toLowerCase()) ||
          hrs.id.replace(/_/g, ' ').includes(userSym.toLowerCase().replace(/[_-]/g, ' '))
      )
    );
    if (hasHighRisk && finalSeverity !== 'HIGH') {
      finalSeverity = 'HIGH';
    }
  }

  // Step 5: Get video (guarantee a resolvable 11-char id for embeds)
  let video = VIDEO_MAP[best.condition] || FALLBACK_VIDEO;
  let video_id = normalizeYoutubeVideoId(video?.id);
  if (!video_id) {
    video = { ...FALLBACK_VIDEO };
    video_id = FALLBACK_VIDEO.id;
  }

  // Step 6: Generate summary
  const summaryMap = {
    venomous_high: 'Immediate medical attention required. Venomous snakebite with high-risk symptoms detected.',
    venomous_medium: 'Possible venomous bite. Treat as venomous until confirmed otherwise. Seek hospital care promptly.',
    non_venomous: 'Non-venomous bite detected. Clean the wound properly and monitor for infection.',
    general_first_aid: 'General first aid guidance. Clean the wound and seek medical evaluation.',
  };

  return {
    guidance_text: best.guidance,
    dos: best.dos,
    donts: best.donts,
    severity: finalSeverity,
    video,
    video_id,
    condition: best.condition,
    matchScore: best.score,
    summary: summaryMap[best.condition] || summaryMap.general_first_aid,
  };
}

export default getGuidance;
