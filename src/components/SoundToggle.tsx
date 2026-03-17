import { useState } from 'react';
import { isMuted, setMuted } from '../lib/soundEngine';

export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted);

  function toggle() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  return (
    <button
      onClick={toggle}
      title={muted ? 'Włącz dźwięk' : 'Wycisz'}
      className="text-[10px] tracking-widest uppercase transition-colors focus:outline-none"
      style={{ color: muted ? '#3a5818' : '#6a9a20' }}
    >
      {muted ? '⊘ SFX OFF' : '◉ SFX ON'}
    </button>
  );
}
