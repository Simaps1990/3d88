import { Box, Layers, Wrench, Lightbulb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSiteText } from '../hooks/useSiteText';

const services = [
  {
    icon: Box,
    title: 'Modélisation 3D',
    description: 'Création de modèles 3D sur mesure adaptés à vos besoins spécifiques, du concept à la réalisation finale.'
  },
  {
    icon: Layers,
    title: 'Impression 3D',
    description: 'Impression haute précision en PLA, ABS, PETG et autres matériaux pour des résultats professionnels.'
  },
  {
    icon: Wrench,
    title: 'Prototypage',
    description: 'Développement rapide de prototypes fonctionnels pour tester et valider vos idées avant production.'
  },
  {
    icon: Lightbulb,
    title: 'Conseil & Expertise',
    description: 'Accompagnement personnalisé pour optimiser vos projets et choisir les meilleures solutions techniques.'
  }
];

export default function Services() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const title = useSiteText('services_title', 'Mes Services');
  const subtitle = useSiteText('services_subtitle', 'Une expertise complète pour donner vie à vos projets');

  useEffect(() => {
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

  return (
    <section
      id="services"
      ref={sectionRef}
      className="py-24 bg-white relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4a7a54] to-transparent"></div>

      <div className="container mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`group p-8 bg-slate-50 rounded-2xl hover:bg-gradient-to-br hover:from-[#4a7a54]/5 hover:to-[#4a7a54]/10 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-slate-200 hover:border-[#4a7a54]/60 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-[#4a7a54] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"></div>
                <service.icon className="w-12 h-12 text-slate-700 group-hover:text-[#4a7a54] transition-colors duration-300 relative" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#4a7a54] transition-colors">
                {service.title}
              </h3>

              <p className="text-slate-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
