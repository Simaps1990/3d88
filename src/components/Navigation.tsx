import { useState, useEffect } from 'react';
import { Menu, X, Lock, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteText } from '../hooks/useSiteText';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  const labelServices = useSiteText('nav_services_label', 'Services');
  const labelRealisations = useSiteText('nav_realisations_label', 'Réalisations');
  const labelContact = useSiteText('nav_contact_label', 'Contact');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#services', label: labelServices },
    { href: '/realisations', label: labelRealisations },
    { href: '/#contact', label: labelContact },
  ];

  // On n'ajoute plus de lien texte "Admin" dans la navigation publique :
  // l'accès backoffice se fait uniquement via l'icône cadenas.

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md shadow-lg transition-all duration-300 transform ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <a href="/" className="flex items-center space-x-3 group">
              <img src="/pictoblanc.png" alt="3D88" className="h-10 w-auto object-contain" />
              <img src="/textelogoblanc.png" alt="3D88" className="h-10 w-auto object-contain" />
            </a>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-medium text-slate-100 transition-colors duration-300 hover:text-amber-400"
                >
                  {link.label}
                </a>
              ))}

              <a
                href="/admin/login"
                className="flex items-center space-x-2 font-medium text-slate-100 hover:text-amber-400 transition-colors duration-300"
              >
                <Lock className="w-5 h-5" />
              </a>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden transition-colors duration-300 text-white"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
            <div className="container mx-auto px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-slate-700 hover:text-amber-600 font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}

              <a
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 text-slate-700 hover:text-amber-600 font-medium transition-colors"
              >
                <Lock className="w-5 h-5" />
                <span>Espace admin</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {scrolled && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-slate-900/90 text-white shadow-lg shadow-black/60 hover:bg-slate-800 transition-colors"
          aria-label="Remonter en haut de la page"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
