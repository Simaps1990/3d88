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
      .order('order_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (data) {
      setRealizations(data as Realization[]);
    }
  };

  const images = selectedRealization
    ? [
        selectedRealization.image_url,
        selectedRealization.image_url_2,
        selectedRealization.image_url_3,
      ].filter((url): url is string => typeof url === 'string' && url.trim() !== '')
    : [];

  const goToNextImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevImage = () => {
    if (!images.length) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const visibleRealizations = limit ? realizations.slice(0, limit) : realizations;
  const useTwoColumnsOnly = visibleRealizations.length <= 2;

  return (
    <section
      id="realisations"
      ref={sectionRef}
      className="pt-12 md:pt-16 pb-24 bg-slate-50 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4a7a54] to-transparent"></div>

      <div className="container mx-auto px-6">
        <div className={`text-center mb-10 md:mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
            {visibleRealizations.map((realization, index) => {
              const cardImages = [
                realization.image_url,
                realization.image_url_2,
                realization.image_url_3,
              ].filter((url): url is string => typeof url === 'string' && url.trim() !== '');

              return (
                <div
                  key={realization.id}
                  className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  } hover:-translate-y-2`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {cardImages[0] && (
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => {
                        setSelectedRealization(realization);
                        setActiveImageIndex(0);
                      }}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative bg-slate-100">
                        <img
                          src={cardImages[0]}
                          alt={realization.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/40 via-slate-900/0 to-transparent"></div>
                      </div>
                    </button>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#4a7a54] transition-colors">
                      {realization.title}
                    </h3>
                    <p className="text-slate-600 whitespace-pre-line">
                      {realization.description}
                    </p>

                    {cardImages.length > 1 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {cardImages.map((url, idx) => (
                          <button
                            key={url + idx}
                            type="button"
                            onClick={() => {
                              setSelectedRealization(realization);
                              setActiveImageIndex(idx);
                            }}
                            className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:border-[#4a7a54] transition-colors"
                          >
                            <img src={url} alt="aperçu" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {showViewAllButton && realizations.length > (limit ?? 0) && (
            <div className="mt-12 text-center">
              <a
                href="/realisations"
                className="inline-flex items-center px-8 py-3 bg-[#4a7a54] hover:bg-[#3b6344] text-[#e1d59d] rounded-lg font-semibold transition-colors"
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
            className="relative inline-flex max-w-5xl w-auto items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedRealization(null)}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-20 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-b from-[#4a7a54] to-[#3b6344] text-[#e1d59d] hover:brightness-110 shadow-lg shadow-black/30 transition-all"
              aria-label="Fermer la réalisation"
            >
              <span className="sr-only">Fermer</span>
              <span className="text-base font-semibold leading-none">✕</span>
            </button>

            <div className="max-h-[85vh] max-w-full">
              {(() => {
                const current = images[activeImageIndex] ?? images[0];

                return (
                  <div className="relative h-full flex items-center justify-center">
                    <div className="max-h-[85vh] max-w-full overflow-hidden rounded-2xl bg-slate-100 inline-block">
                      {current && (
                        <img
                          src={current}
                          alt={selectedRealization.title}
                          className="max-h-[85vh] max-w-full object-contain"
                        />
                      )}
                    </div>

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPrevImage();
                          }}
                          className="absolute top-1/2 -translate-y-1/2 left-3 md:left-6 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#4a7a54] to-[#3b6344] text-[#e1d59d] hover:brightness-110 shadow-lg shadow-black/30 transition-all"
                          aria-label="Image précédente"
                        >
                          <span className="-mt-3 text-4xl leading-none">‹</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage();
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-3 md:right-6 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#4a7a54] to-[#3b6344] text-[#e1d59d] hover:brightness-110 shadow-lg shadow-black/30 transition-all"
                          aria-label="Image suivante"
                        >
                          <span className="-mt-3 text-4xl leading-none">›</span>
                        </button>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
