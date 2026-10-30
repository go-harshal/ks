'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';

const SOUND_KEY = 'ks-alert-sound';
let audioCtx;

function unlockAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx ||= new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* audio unavailable */ }
}

/** Soft two-note chime generated in the browser (no audio file to load). */
function chime() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  [[880, 0], [1318.5, 0.14]].forEach(([freq, delay]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.16, now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.55);
  });
}

export function timeAgo(d) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function useNotifications(enabled) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [sound, setSound] = useState(true);
  const [desktop, setDesktop] = useState('unsupported');
  const [live, setLive] = useState(false);
  const soundRef = useRef(true);

  const load = useCallback(() => api('/admin/notifications').then((r) => { setItems(r.data.items); setUnread(r.data.unread); }).catch(() => {}), []);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    soundRef.current = localStorage.getItem(SOUND_KEY) !== 'off';
    setSound(soundRef.current);
    setDesktop('Notification' in window ? Notification.permission : 'unsupported');
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    const es = new EventSource('/api/v1/admin/events');
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.addEventListener('notification', (e) => {
      const n = JSON.parse(e.data);
      setItems((a) => [n, ...a.filter((x) => x.id !== n.id)].slice(0, 30));
      setUnread((u) => u + 1);
      setToasts((t) => [...t.slice(-2), n]);
      setTimeout(() => dismiss(n.id), 9000);
      if (soundRef.current) chime();
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const dn = new Notification(n.title, { body: n.body || 'Open Phobos to review it.', tag: n.id, icon: '/brand/logo-mark.png' });
        dn.onclick = () => { window.focus(); window.location.href = n.link || '/phobos/leads'; dn.close(); };
      }
      window.dispatchEvent(new CustomEvent('ks:leads-changed'));
    });
    es.addEventListener('session-ended', () => { es.close(); window.location.href = '/phobos/login'; });
    const poll = setInterval(load, 60000); // safety net if the live stream is interrupted
    return () => {
      es.close(); clearInterval(poll);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [enabled, load, dismiss]);

  const markRead = useCallback(async (id) => {
    setItems((a) => a.map((x) => (x.id === id && x.unread ? (setUnread((u) => Math.max(0, u - 1)), { ...x, unread: false }) : x)));
    await api(`/admin/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }, []);
  const markAll = useCallback(async () => {
    setItems((a) => a.map((x) => ({ ...x, unread: false }))); setUnread(0);
    await api('/admin/notifications/read-all', { method: 'POST' }).catch(() => {});
  }, []);
  const toggleSound = useCallback(() => {
    soundRef.current = !soundRef.current;
    setSound(soundRef.current);
    localStorage.setItem(SOUND_KEY, soundRef.current ? 'on' : 'off');
    if (soundRef.current) { unlockAudio(); setTimeout(chime, 50); }
  }, []);
  const enableDesktop = useCallback(async () => {
    if (!('Notification' in window)) return;
    setDesktop(await Notification.requestPermission());
  }, []);

  return { items, unread, toasts, dismiss, markRead, markAll, sound, toggleSound, desktop, enableDesktop, live };
}
