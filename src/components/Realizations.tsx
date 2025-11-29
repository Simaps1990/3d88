import { useEffect, useState, useRef } from 'react';
import { supabase, Realization } from '../lib/supabase';
import { useSiteText } from '../hooks/useSiteText';

type RealizationsProps = {
  limit?: number;
  showViewAllButton?: boolean;
};

export default function Realizations({ limit, showViewAllButton }: RealizationsProps) {
  const [realizations, setRealizations] = useState<Realization[]>([]);
  const [selectedRealization, setSelectedRealization] = useState<Realization | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const title = useSiteText('realizations_title', 'Mes Réalisations');
  const subtitle = useSiteText('realizations_subtitle', 'Découvrez quelques-uns de mes projets récents');
  const viewAllLabel = useSiteText('realizations_view_all_button', 'Voir toutes les réalisations');

  useEffect(() => {
    loadRealizations();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const loadRealizations = async () => {
    const { data } = await supabase
      .from('realizations')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (data) {
      setRealizations(data);
    }
  };

  const visibleRealizations = limit ? realizations.slice(0, limit) : realizations;
  const useTwoColumnsOnly = visibleRealizations.length <= 2;

  return (
    <section
      id="realisations"
      ref={sectionRef}
      className="py-24 bg-slate-50 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {realizations.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <p className="text-lg">Aucune réalisation disponible pour le moment.</p>
          </div>
        ) : (
          <>
          <div
            className={
              useTwoColumnsOnly
                ? 'grid grid-cols-1 md:grid-cols-2 gap-8'
                : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'
            }
          >
            {visibleRealizations.map((realization, index) => (
              <div
                key={realization.id}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => {
                  setSelectedRealization(realization);
                  setActiveImageIndex(0);
                }}
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-slate-100">
                  {realization.image_url && (
                    <img
                      src={realization.image_url}
                      alt={realization.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  {realization.image_url && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/40 via-slate-900/0 to-transparent"></div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                    {realization.title}
                  </h3>
                  <p className="text-slate-600 line-clamp-2">
                    {realization.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {showViewAllButton && realizations.length > (limit ?? 0) && (
            <div className="mt-12 text-center">
              <a
                href="/realisations"
                className="inline-flex items-center px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
              >
                {viewAllLabel}
              </a>
            </div>
          )}
          </>
        )}
      </div>

      {selectedRealization && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRealization(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedRealization(null)}
              className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 text-slate-700 hover:text-slate-900 transition-colors"
              aria-label="Fermer la réalisation"
            >
              <span className="sr-only">Fermer</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="max-h-[85vh] overflow-y-auto">
            {(() => {
              const images = [
                selectedRealization.image_url,
                selectedRealization.image_url_2,
                selectedRealization.image_url_3,
              ].filter((url): url is string => typeof url === 'string' && url.trim() !== '');

              const current = images[activeImageIndex] ?? images[0];

              return (
                <>
                  <div className="aspect-[16/9] overflow-hidden rounded-t-2xl bg-slate-100">
                    {current && (
                      <img
                        src={current}
                        alt={selectedRealization.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="px-8 pt-4 flex gap-3 overflow-x-auto">
                      {images.map((url, idx) => (
                        <button
                          key={url + idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border transition-colors ${
                            idx === activeImageIndex
                              ? 'border-amber-500'
                              : 'border-slate-200 hover:border-amber-300'
                          }`}
                        >
                          <img src={url} alt="aperçu" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
            <div className="p-8">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                {selectedRealization.title}
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                {selectedRealization.description}
              </p>
            </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
