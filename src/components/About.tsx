import { useEffect, useRef, useState } from 'react';
import { Instagram, Facebook } from 'lucide-react';
import { useSiteText } from '../hooks/useSiteText';

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const title = useSiteText('about_title', 'À propos de 3D88');
  const content = useSiteText(
    'about_content',
    "Je suis passionné par la conception 3D et l'impression 3D. 3D88 vous accompagne de l'idée au prototype puis à la pièce finale, pour des projets uniques ou des petites séries.\n\nBasé en Isère, je travaille avec des particuliers, des professionnels et des collectivités pour donner vie à des pièces techniques, des objets décoratifs ou des maquettes sur mesure."
  );
  const imageUrl = useSiteText('about_image_url', '/Picto.png');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-24 bg-[#101b14] text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#101b14] via-[#18271e] to-[#101b14] opacity-90" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div
            className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
          <div className="order-2 md:order-1 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#3caa35]">
              {title}
            </h2>
            <p className="text-lg text-slate-100 leading-relaxed whitespace-pre-line">
              {content}
            </p>

            <div className="flex flex-col items-start gap-1 text-[#4a7a54] text-sm mt-2">
              <span>Suivez-moi sur les réseaux :</span>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/print.3d88?igsh=cno1aTRuNmhoaWxm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4a7a54] hover:text-[#3caa35] transition-colors"
                  aria-label="Instagram 3D88"
                >
                  <Instagram className="w-5 h-5 md:w-6 md:h-6" />
                </a>
                <a
                  href="https://www.facebook.com/share/1AUcQdRyEA/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4a7a54] hover:text-[#3caa35] transition-colors"
                  aria-label="Facebook 3D88"
                >
                  <Facebook className="w-5 h-5 md:w-6 md:h-6" />
                </a>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 bg-slate-800">
              <img
                src={imageUrl}
                alt="À propos de 3D88"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-[#4a7a54]/20" />
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
