import { supabase } from '../lib/supabase';

const QUEUE_KEY = 'snakesafe_offline_sos_queue';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function queueSOS(data) {
  const queue = getQueue();
  queue.push({ ...data, _queuedAt: Date.now() });
  saveQueue(queue);
}

export async function syncOfflineQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  const failed = [];
  for (const item of queue) {
    const { _queuedAt, ...record } = item;
    try {
      const { error } = await supabase.from('emergencies').insert([record]);
      if (error) failed.push(item);
    } catch {
      failed.push(item);
    }
  }
  saveQueue(failed);
}

export function initOfflineSync() {
  window.addEventListener('online', () => {
    syncOfflineQueue();
  });

  // Also try on load if already online
  if (navigator.onLine) {
    syncOfflineQueue();
  }
}
