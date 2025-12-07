import { useEffect, useState } from 'react';

const STORAGE_KEY = 'cookie_consent_3d88';

type ConsentValue = 'accepted' | 'rejected';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleChoice = (value: ConsentValue) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-4xl rounded-2xl bg-[#101b14]/95 text-slate-100 shadow-2xl shadow-black/60 border border-slate-800/80">
        <div className="px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1 space-y-2">
            <h2 className="text-base sm:text-lg font-semibold">Gestion des cookies</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ce site utilise des cookies strictement nécessaires à son bon fonctionnement et, de manière anonyme,
              pour mieux comprendre l&apos;utilisation du site et améliorer votre expérience.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Vous pouvez accepter ou refuser ces cookies facultatifs. Votre choix sera conservé pendant un certain temps
              dans votre navigateur. Pour en savoir plus, consultez les{' '}
              <a
                href="/mentions-legales"
                className="text-[#4a7a54] hover:text-[#3caa35] underline underline-offset-2 transition-colors"
              >
                mentions légales
              </a>
              .
            </p>
          </div>

          <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleChoice('rejected')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-600 text-xs sm:text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => handleChoice('accepted')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#1f4d28] hover:bg-[#3caa35] text-xs sm:text-sm font-semibold text-[#e1d59d] shadow-lg shadow-[#1f4d28]/50 transition-colors"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
