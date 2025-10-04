import { useEffect, useRef } from 'react';

// Hook replicating pane image rotation logic (simplified)
export function usePaneRotator(images = [], interval = 6000) {
  const imagesRef = useRef(images);
  const cycleRef = useRef(0);
  useEffect(() => { imagesRef.current = images; }, [images]);

  useEffect(() => {
    const panes = document.querySelectorAll('.hero-frame .pane');
    if (!panes.length || !imagesRef.current.length) return;

    let timeoutId;
    let running = true;

    async function rotateOnce() {
      const pool = [...imagesRef.current];
      if (!pool.length) return;
      // shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      panes.forEach((p, idx) => {
        const next = pool[idx % pool.length];
        if (!next) return;
        const current = p.getAttribute('data-current');
        if (current === next) return;
        p.style.setProperty('--pane-after-image', `url('${next}')`);
        p.classList.add('swap-active');
        setTimeout(() => {
          p.style.setProperty('--pane-img-inline', `url('${next}')`);
          p.setAttribute('data-current', next);
          p.classList.remove('swap-active');
        }, 900);
      });
    }

    function schedule() {
      if (!running) return;
      timeoutId = setTimeout(async () => {
        await rotateOnce();
        schedule();
      }, interval);
    }
    schedule();

    return () => { running = false; clearTimeout(timeoutId); };
  }, [interval]);
}
