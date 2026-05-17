import { useEffect, useRef, useState } from 'react';

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Popup = { id: number; x: number; y: number; size: number; src: string };

export default function PopupIcon() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const scheduleRef = useRef<number | null>(null);
  const hideTimersRef = useRef<Record<number, number>>({});
  const showTimersRef = useRef<number[]>([]);
  const bigScheduleRef = useRef<number | null>(null);
  const nextIdRef = useRef(1);

  useEffect(() => {
    scheduleNext();
    scheduleBig();
    return () => {
      if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
      if (bigScheduleRef.current) window.clearTimeout(bigScheduleRef.current);
      // clear all hide timers
      Object.values(hideTimersRef.current).forEach((t) => window.clearTimeout(t));
      hideTimersRef.current = {};
      // clear any scheduled show timers
      showTimersRef.current.forEach((t) => window.clearTimeout(t));
      showTimersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleBig() {
    const delay = rand(60000, 180000); // 1 - 3 minutes
    bigScheduleRef.current = window.setTimeout(() => {
      spawnBigIcon();
    }, delay);
  }

  function spawnBigIcon() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // big size ~25-40% of viewport smaller dimension
    const dim = Math.min(w, h);
    const s = rand(Math.floor(dim * 0.25), Math.floor(dim * 0.4));
    const px = rand(0, Math.max(0, w - s));
    const py = rand(0, Math.max(0, h - s));
    const id = nextIdRef.current++;
    const src = Math.random() < 0.5 ? '/icon.png' : '/icon2.png';
    // show immediately
    setPopups((prev) => [...prev, { id, x: px, y: py, size: s, src }]);
    // hide after longer duration
    const hideTimer = window.setTimeout(() => removePopup(id), 6000);
    hideTimersRef.current[id] = hideTimer;
    // schedule next big
    scheduleBig();
  }

  function scheduleNext() {
    const delay = rand(10000, 30000);
    scheduleRef.current = window.setTimeout(() => {
      spawnRandomIcons();
    }, delay);
  }

  function spawnRandomIcons() {
    const count = rand(1, 20);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const newPopups: Popup[] = [];
    for (let i = 0; i < count; i++) {
      const s = rand(36, 96);
      const px = rand(0, Math.max(0, w - s));
      const py = rand(0, Math.max(0, h - s));
      const id = nextIdRef.current++;
      const src = Math.random() < 0.5 ? '/icon.png' : '/icon2.png';
      const showDelay = i * 300; // stagger by 0.3s
      const showTimer = window.setTimeout(() => {
        setPopups((prev) => [...prev, { id, x: px, y: py, size: s, src }]);
        const hideTimer = window.setTimeout(() => removePopup(id), 2500);
        hideTimersRef.current[id] = hideTimer;
      }, showDelay);
      showTimersRef.current.push(showTimer);
    }
    // schedule next spawn after scheduling this batch
    scheduleNext();
  }

  function removePopup(id: number) {
    setPopups((prev) => prev.filter((p) => p.id !== id));
    const t = hideTimersRef.current[id];
    if (t) {
      window.clearTimeout(t);
      delete hideTimersRef.current[id];
    }
  }

  function handleClick(id: number) {
    removePopup(id);
  }

  return (
    <div aria-hidden>
      {popups.map((p) => (
        <div
          key={p.id}
          onClick={() => handleClick(p.id)}
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'auto',
            transform: 'translateZ(0)',
            animation: 'popup-zoom 600ms ease, popup-fade 2500ms linear',
            cursor: 'pointer',
          }}
        >
          <img
            src={p.src}
            alt="popup icon"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              display: 'block',
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes popup-zoom {
          0% { transform: scale(0.2); opacity: 0 }
          60% { transform: scale(1.12); opacity: 1 }
          100% { transform: scale(1); opacity: 1 }
        }
        @keyframes popup-fade {
          0% { opacity: 1 }
          80% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
}
