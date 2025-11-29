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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const title = useSiteText('realizations_title', 'Mes Réalisations');
  const subtitle = useSiteText('realizations_subtitle', 'Découvrez quelques-uns de mes projets récents');

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
      .order('order_position', { ascending: true });

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
                onClick={() => setSelectedRealization(realization)}
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
                  <div className="text-sm text-amber-600 font-semibold mb-2 uppercase tracking-wide">
                    {realization.category}
                  </div>
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
                Voir toutes les réalisations
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
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[16/9] overflow-hidden rounded-t-2xl">
              <img
                src={selectedRealization.image_url}
                alt={selectedRealization.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8">
              <div className="text-sm text-amber-600 font-semibold mb-2 uppercase tracking-wide">
                {selectedRealization.category}
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                {selectedRealization.title}
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                {selectedRealization.description}
              </p>
              <button
                onClick={() => setSelectedRealization(null)}
                className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
