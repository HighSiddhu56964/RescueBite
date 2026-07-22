import { useState, useRef, useCallback } from 'react';

/* ══════════════════════════════════════════════════════════════
   useSnakeDetection — Client-side AI inference hook
   Uses Teachable Machine (TensorFlow.js) loaded via CDN.

   ⚠️ INFERENCE CONTRACT:
   model.predict() receives RAW <img> or <video> element DIRECTLY.
   NEVER draw to canvas before predict(). NEVER preprocess pixels.
   tmImage internally handles cropTo() + capture() + normalize().
   ══════════════════════════════════════════════════════════════ */

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/Ce7PF21EQ/';

function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(el);
  });
}

/**
 * Priority-based decision engine.
 * Snake classes (venomous/non-venomous) at ≥0.5 override Not_SnakeBite.
 */
export function buildResult(predictions) {
  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);

  let venomous_prob = 0;
  let non_venomous_prob = 0;
  let not_snake_prob = 0;

  predictions.forEach((p) => {
    const lc = p.className.toLowerCase();
    if (lc.includes('non') && lc.includes('venemous')) {
      non_venomous_prob = p.probability;
    } else if (lc.includes('venemous')) {
      venomous_prob = p.probability;
    } else if (lc.includes('not')) {
      not_snake_prob = p.probability;
    }
  });

  const snake_prob = Math.max(venomous_prob, non_venomous_prob);
  let is_snakebite, venomous, risk_level, confidence, raw_class;

  if (snake_prob >= 0.5) {
    is_snakebite = true;
    if (non_venomous_prob > venomous_prob) {
      venomous = false;
      risk_level = 'LOW';
      confidence = non_venomous_prob;
      raw_class =
        predictions.find((p) => p.className.toLowerCase().includes('non'))?.className ||
        'NonVenemous_Bite';
    } else {
      venomous = true;
      confidence = venomous_prob;
      raw_class =
        predictions.find(
          (p) =>
            p.className.toLowerCase().includes('venemous') &&
            !p.className.toLowerCase().includes('non')
        )?.className || 'Venemous_Bite';
      risk_level = confidence >= 0.75 ? 'HIGH' : 'MEDIUM';
    }
  } else {
    is_snakebite = false;
    venomous = null;
    risk_level = 'NONE';
    confidence = not_snake_prob;
    raw_class =
      predictions.find((p) => p.className.toLowerCase().includes('not'))?.className ||
      'Not_SnakeBite';
  }

  return { is_snakebite, venomous, risk_level, confidence, raw_class, all: sorted };
}

export function useSnakeDetection() {
  const [modelReady, setModelReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState(null);
  const modelRef = useRef(null);

  const loadModel = useCallback(async () => {
    if (modelRef.current) {
      setModelReady(true);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      setLoadingMsg('Loading TensorFlow.js…');
      await injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');

      setLoadingMsg('Loading Teachable Machine…');
      await injectScript(
        'https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js'
      );

      // Wait for tmImage global to be fully available (CDN race condition guard)
      let waitAttempts = 0;
      while (!window.tmImage && waitAttempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        waitAttempts++;
      }
      if (!window.tmImage) throw new Error('Teachable Machine library failed to initialize');

      setLoadingMsg('Loading detection model…');
      const base = MODEL_URL.endsWith('/') ? MODEL_URL : MODEL_URL + '/';
      modelRef.current = await window.tmImage.load(base + 'model.json', base + 'metadata.json');

      const labels = modelRef.current.getClassLabels();
      console.log('[DetectionHook] Model classes:', labels);

      setModelReady(true);
    } catch (err) {
      console.error('[DetectionHook] Boot failed:', err);
      setError(err.message || 'Failed to load AI model');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }, []);

  const predict = useCallback(async (element) => {
    if (!modelRef.current) throw new Error('Model not loaded');
    const predictions = await modelRef.current.predict(element);
    console.log('[DetectionHook] Raw predictions:', predictions);
    return buildResult(predictions);
  }, []);

  return { modelReady, loading, loadingMsg, error, loadModel, predict };
}
