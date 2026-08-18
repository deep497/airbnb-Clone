'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

// The classic Konami code: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

export default function EasterEgg() {
  useEffect(() => {
    let progress = 0;
    let fired = false;

    function handleKey(e: KeyboardEvent) {
      if (fired) return;

      // Match key against the next expected key in the sequence
      if (e.key === KONAMI[progress]) {
        progress += 1;
      } else {
        // Wrong key — reset, but still check if this key starts a fresh sequence
        progress = e.key === KONAMI[0] ? 1 : 0;
      }

      if (progress === KONAMI.length) {
        fired = true;
        toast('🎉 You found it. Now go book somewhere nice.', {
          duration: 5000,
          icon: '🏠',
          style: {
            borderRadius: '12px',
            background: '#222',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
          },
        });
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Renders nothing — purely a side-effect component
  return null;
}
