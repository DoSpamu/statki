interface WaitingOverlayProps {
  opponentReady: boolean;
}

export default function WaitingOverlay({ opponentReady }: WaitingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center font-mono"
      style={{ background: 'rgba(6,9,5,0.82)', backdropFilter: 'blur(1px)' }}
    >
      <div className="flex flex-col items-center gap-5 p-8 relative" style={{ maxWidth: 420 }}>
        {/* Narożniki taktyczne */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#6a9a20]" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#6a9a20]" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#6a9a20]" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#6a9a20]" />

        {/* Status twojej floty */}
        <div className="flex items-center gap-3">
          <span className="text-[#a8cc30] text-lg">✔</span>
          <span className="text-xs text-[#a8cc30] tracking-[0.3em] uppercase">
            Twoja flota rozmieszczona
          </span>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#2a3a18]" />

        {/* Status przeciwnika */}
        {opponentReady ? (
          <div className="flex items-center gap-3">
            <span className="text-[#a8cc30] text-lg">✔</span>
            <span className="text-xs text-[#a8cc30] tracking-[0.3em] uppercase">
              Przeciwnik gotowy — startujemy!
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-3"
            style={{ animation: 'bf-pulse 1.4s ease-in-out infinite' }}
          >
            <span className="text-[#6a9a20] text-base">◌</span>
            <span className="text-xs text-[#6a9a20] tracking-[0.3em] uppercase">
              Oczekiwanie na rozmieszczenie przeciwnika…
            </span>
          </div>
        )}

        {/* Skan / animacja aktywności */}
        <div className="w-full h-px bg-[#1e2e10] relative overflow-hidden mt-1">
          <div
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#6a9a2066] to-transparent"
            style={{ animation: 'bf-scan 2s linear infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
