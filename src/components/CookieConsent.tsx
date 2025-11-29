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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-lg rounded-2xl bg-slate-950 text-slate-100 shadow-2xl shadow-black/70 border border-slate-800">
        <div className="px-6 pt-6 pb-4 space-y-3">
          <h2 className="text-lg font-semibold">Gestion des cookies</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ce site utilise des cookies strictement nécessaires à son bon fonctionnement et, de manière anonyme,
            pour mieux comprendre l&apos;utilisation du site et améliorer votre expérience.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vous pouvez accepter ou refuser ces cookies facultatifs. Votre choix sera conservé pendant un certain temps
            dans votre navigateur. Pour en savoir plus, consultez les{' '}
            <a
              href="/mentions-legales"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              mentions légales
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-600 text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-sm font-semibold text-white shadow-lg shadow-amber-500/40 transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
