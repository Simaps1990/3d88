import { useEffect, useState, useRef } from 'react';
import { supabase, Realization } from '../lib/supabase';
import { useSiteText } from '../hooks/useSiteText';

type RealizationsProps = {
  limit?: number;
  showViewAllButton?: boolean;
  variant?: 'home' | 'page';
};

export default function Realizations({ limit, showViewAllButton, variant }: RealizationsProps) {
  const [realizations, setRealizations] = useState<Realization[]>([]);
  const [selectedRealization, setSelectedRealization] = useState<Realization | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        selectedRealization.image_url_4,
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
  const mode: 'home' | 'page' = variant ?? (limit ? 'home' : 'page');
  const isHome = mode === 'home';

  const toggleDescription = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const getShortDescription = (text: string) => {
    if (!text) return '';

    // On ne garde que la première ligne non vide
    const firstLine = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l !== '');

    if (!firstLine) return '';

    // Longueur légèrement augmentée pour garder une seule ligne mais un texte un peu moins coupé
    const maxLength = 56;

    if (firstLine.length <= maxLength) return firstLine;

    return firstLine.slice(0, maxLength).trimEnd() + '…';
  };

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
          {isHome ? (
            <div className="flex flex-wrap items-start gap-6 md:gap-8">
              {visibleRealizations.map((realization, index) => {
                const cardImages = [
                  realization.image_url,
                  realization.image_url_2,
                  realization.image_url_3,
                  realization.image_url_4,
                ].filter((url): url is string => typeof url === 'string' && url.trim() !== '');

                return (
                  <div
                    key={realization.id}
                    className={`group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 w-full md:w-[calc(50%-1rem)] xl:w-[calc(33.333%-1.333rem)] ${
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
                        <div className="aspect-[16/9] overflow-hidden relative bg-slate-100">
                          <img
                            src={cardImages[0]}
                            alt={realization.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/40 via-slate-900/0 to-transparent"></div>
                        </div>
                      </button>
                    )}

                    {cardImages.length > 1 && (
                      <div className="px-6 pt-4 flex flex-wrap gap-3">
                        {cardImages.map((url, idx) => (
                          <button
                            key={url + idx}
                            type="button"
                            onClick={() => {
                              setSelectedRealization(realization);
                              setActiveImageIndex(idx);
                            }}
                            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:border-[#4a7a54] transition-colors"
                          >
                            <img src={url} alt="aperçu" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-6 pt-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#4a7a54] transition-colors">
                        {realization.title}
                      </h3>
                      <p className="text-slate-600 whitespace-pre-line">
                        {getShortDescription(realization.description)}
                      </p>
                      {realization.description &&
                        ((realization.description.split(/\r?\n/).filter((l) => l.trim() !== '').length > 2) ||
                          realization.description.length > 220) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRealization(realization);
                            setActiveImageIndex(0);
                          }}
                          className="mt-2 text-sm font-semibold text-[#4a7a54] hover:text-[#3b6344]"
                        >
                          ... lire la suite
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-8 max-w-5xl mx-auto">
              {visibleRealizations.map((realization, index) => {
                const cardImages = [
                  realization.image_url,
                  realization.image_url_2,
                  realization.image_url_3,
                  realization.image_url_4,
                ].filter((url): url is string => typeof url === 'string' && url.trim() !== '');

                return (
                  <article
                    key={realization.id}
                    className={`group bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-5/12 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/60">
                        {cardImages[0] && (
                          <button
                            type="button"
                            className="block w-full text-left"
                            onClick={() => {
                              setSelectedRealization(realization);
                              setActiveImageIndex(0);
                            }}
                          >
                            <div className="aspect-[16/9] overflow-hidden relative bg-slate-100">
                              <img
                                src={cardImages[0]}
                                alt={realization.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                          </button>
                        )}

                        {cardImages.length > 1 && (
                          <div className="px-4 py-3 flex flex-wrap gap-3 bg-white/80 border-t border-slate-100">
                            {cardImages.slice(1).map((url, idx) => (
                              <button
                                key={url + idx}
                                type="button"
                                onClick={() => {
                                  setSelectedRealization(realization);
                                  setActiveImageIndex(idx + 1);
                                }}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-[#4a7a54] transition-colors"
                              >
                                <img src={url} alt="aperçu" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:w-7/12 p-6 md:p-7 flex flex-col">
                        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 group-hover:text-[#4a7a54] transition-colors">
                          {realization.title}
                        </h3>
                        <p className="text-slate-600 whitespace-pre-line text-sm md:text-base">
                          {realization.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {isHome && showViewAllButton && realizations.length > (limit ?? 0) && (
            <div className="mt-12 text-center">
              <a
                href="/realisations"
                className="inline-flex items-center px-8 py-3 bg-[#3caa35] hover:bg-[#0e6e40] text-white rounded-lg font-semibold transition-colors"
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
            <div className="max-h-[85vh] max-w-full">
              {(() => {
                const current = images[activeImageIndex] ?? images[0];

                return (
                  <div className="relative h-full flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-4 md:gap-6">
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToPrevImage();
                          }}
                          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-[#3caa35] text-white hover:bg-[#0e6e40] shadow-lg shadow-black/30 transition-colors"
                          aria-label="Image précédente"
                        >
                          <span className="-mt-2 md:-mt-3 text-3xl md:text-4xl leading-none">‹</span>
                        </button>
                      )}

                      <div className="relative max-h-[60vh] max-w-full overflow-hidden rounded-2xl bg-slate-100 inline-block">
                        {current && (
                          <img
                            src={current}
                            alt={selectedRealization.title}
                            className="max-h-[60vh] max-w-full object-contain"
                          />
                        )}

                        {/* Bouton fermer dans le coin supérieur droit de l'image */}
                        <button
                          type="button"
                          onClick={() => setSelectedRealization(null)}
                          className="absolute top-3 right-3 md:top-4 md:right-4 z-20 inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#3caa35] text-white hover:bg-[#0e6e40] shadow-lg shadow-black/30 transition-colors"
                          aria-label="Fermer la réalisation"
                        >
                          <span className="sr-only">Fermer</span>
                          <span className="text-sm md:text-base font-semibold leading-none">✕</span>
                        </button>
                      </div>

                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage();
                          }}
                          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-[#3caa35] text-white hover:bg-[#0e6e40] shadow-lg shadow-black/30 transition-colors"
                          aria-label="Image suivante"
                        >
                          <span className="-mt-2 md:-mt-3 text-3xl md:text-4xl leading-none">›</span>
                        </button>
                      )}
                    </div>

                    <div className="w-full max-w-2xl mx-auto mt-2 bg-white/95 rounded-2xl p-4 md:p-6 shadow-lg text-left">
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                        {selectedRealization.title}
                      </h3>
                      <p className="text-slate-700 whitespace-pre-line text-sm md:text-base">
                        {selectedRealization.description}
                      </p>
                    </div>
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
