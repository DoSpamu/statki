interface VictoryOverlayProps {
  onReset: () => void;
  isWinner?: boolean;
}

export default function VictoryOverlay({ onReset, isWinner = true }: VictoryOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center font-mono"
      style={{ background: 'rgba(0,0,0,0.88)' }}
    >
      {/* Błysk nuklearny */}
      <div
        className="absolute inset-0 bg-white pointer-events-none"
        style={{ animation: 'nuke-flash 0.6s ease-out forwards' }}
      />

      {/* Pierścień uderzeniowy */}
      <div
        className="absolute rounded-full border-2 border-[#ff9500] pointer-events-none"
        style={{
          width: 200, height: 200,
          animation: 'nuke-shockwave 1.2s ease-out 0.1s forwards',
          opacity: 0,
        }}
      />
      <div
        className="absolute rounded-full border border-[#ff6600] pointer-events-none"
        style={{
          width: 280, height: 280,
          animation: 'nuke-shockwave 1.6s ease-out 0.3s forwards',
          opacity: 0,
        }}
      />

      {/* Grzyb atomowy — słup */}
      <div
        className="absolute bottom-0 left-1/2 pointer-events-none"
        style={{
          transform: 'translateX(-50%)',
          width: 28,
          height: '45%',
          background: 'linear-gradient(to top, #cc4400, #884422, #553322aa)',
          borderRadius: '4px 4px 0 0',
          animation: 'nuke-stem 1.4s ease-out 0.4s both',
          transformOrigin: 'bottom',
          opacity: 0,
        }}
      />

      {/* Grzyb atomowy — czapka */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '38%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 110,
          background: 'radial-gradient(ellipse at 50% 70%, #ff6600cc 0%, #cc440099 40%, #88220055 70%, transparent 100%)',
          borderRadius: '50% 50% 30% 30%',
          animation: 'nuke-cap 1.4s ease-out 0.7s both',
          opacity: 0,
        }}
      />
      {/* Wewnętrzna jasna część czapy */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '41%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100,
          height: 60,
          background: 'radial-gradient(ellipse, #ffee88cc 0%, #ff990066 50%, transparent 100%)',
          borderRadius: '50%',
          animation: 'nuke-cap 1.0s ease-out 0.8s both',
          opacity: 0,
        }}
      />

      {/* Tekst wygranej */}
      <div
        className="relative z-10 flex flex-col items-center gap-6"
        style={{ animation: 'nuke-text 0.8s ease-out 1.4s both', opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] tracking-[0.5em] uppercase"
            style={{ color: isWinner ? '#ff9922' : '#4a8aaa' }}>
            {isWinner ? '⚛ Nuclear Strike Confirmed' : '⚛ Nuclear Strike Received'}
          </span>
          <span
            className="text-5xl font-black uppercase tracking-[0.4em]"
            style={{
              color: isWinner ? '#ffee44' : '#44aadd',
              filter: isWinner
                ? 'drop-shadow(0 0 30px #ff9900cc)'
                : 'drop-shadow(0 0 30px #0088ccaa)',
            }}
          >
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </span>
          <span className="text-sm tracking-[0.35em] uppercase"
            style={{ color: isWinner ? '#a8cc30' : '#4a8aaa' }}>
            {isWinner ? 'All enemy vessels destroyed' : 'Your fleet has been destroyed'}
          </span>
        </div>

        {/* Divider taktyczny */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-px bg-[#ff6600aa]" />
          <span className="text-[#ff9922] text-xs tracking-widest">◈</span>
          <div className="flex-1 h-px bg-[#ff6600aa]" />
        </div>

        {/* Przycisk nowej gry */}
        <button
          onClick={onReset}
          className="px-8 py-3 text-sm font-black tracking-[0.35em] uppercase transition-all duration-200 focus:outline-none"
          style={{
            background: 'transparent',
            border: '2px solid #a8cc30',
            color: '#a8cc30',
            boxShadow: '0 0 12px #6a9a2055, inset 0 0 8px transparent',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#a8cc3018';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px #a8cc3088, inset 0 0 12px #a8cc3022';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px #6a9a2055, inset 0 0 8px transparent';
          }}
        >
          ▶ New Game
        </button>
      </div>
    </div>
  );
}
