import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSiteText } from '../hooks/useSiteText';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  const title = useSiteText('hero_title', '3D88');
  const subtitle = useSiteText('hero_subtitle', '3D Custom Made');
  const lead = useSiteText(
    'hero_lead',
    "De l'idée à la réalité, je transforme vos projets en objets concrets grâce à la modélisation et l'impression 3D professionnelle."
  );
  const ctaPrimary = useSiteText('hero_cta_primary', 'Demander un devis');
  const ctaSecondary = useSiteText('hero_cta_secondary', 'Voir mes réalisations');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToNext = () => {
    const nextSection = document.getElementById('services');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div
        className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div
          className="text-center transition-all duration-1000"
          style={{
            opacity: 1 - scrollY / 500,
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        >
          <div className="mb-8 flex justify-center">
            <img src="/logo3d.png" alt="3D88" className="w-56 h-56 object-contain" />
          </div>

          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {lead}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/50"
            >
              {ctaPrimary}
            </a>
            <a
              href="/realisations"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              {ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      <button
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer group"
        aria-label="Défiler vers le bas"
      >
        <ChevronDown className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
      </button>
    </section>
  );
}
