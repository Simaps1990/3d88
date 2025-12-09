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
  const backgroundUrl = useSiteText('hero_background_url', "/fond.jpg");

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#101b14]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          // Si aucune valeur n'est encore chargée, on n'affiche pas d'image
          // pour éviter le flash de l'ancien fond. On garde juste la couleur de fond.
          backgroundImage: backgroundUrl
            ? `url('${backgroundUrl}')`
            : 'none',
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      <div className="absolute inset-0 bg-[#101b14]/60" />

      <div className="container mx-auto px-6 relative z-10">
        <div
          className="text-center transition-all duration-1000"
          style={{
            opacity: 1 - scrollY / 500,
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        >
          <h1 className="sr-only">
            Impression 3D sur mesure, modélisation 3D et prototypage dans les Vosges avec 3D88
          </h1>
          <div className="mb-1 md:mb-3 flex justify-center">
            <img src="/LOGOng.png" alt="3D88" className="w-72 h-72 md:w-96 md:h-96 object-contain" />
          </div>

          <p className="text-xl md:text-2xl text-slate-100 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_0_18px_rgba(0,0,0,0.95)]">
            {lead}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="px-8 py-4 bg-[#0e6e40] hover:bg-[#3caa35] text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-black/70 hover:shadow-2xl hover:shadow-black/80"
            >
              {ctaPrimary}
            </a>
            <a
              href="#realisations"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20 shadow-lg shadow-black/70 hover:shadow-2xl hover:shadow-black/80"
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
