import { useSiteText } from '../hooks/useSiteText';
import { Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const text = useSiteText('footer_text', `© ${new Date().getFullYear()} 3D88. Tous droits réservés.`);
  const instagramUrl = useSiteText(
    'social_instagram_url',
    'https://www.instagram.com/print.3d88?igsh=cno1aTRuNmhoaWxm'
  );
  const facebookUrl = useSiteText(
    'social_facebook_url',
    'https://www.facebook.com/share/1AUcQdRyEA/?mibextid=wwXIfr'
  );
  const googleUrl = useSiteText(
    'social_google_url',
    'https://maps.app.goo.gl/zXUxZVvabJBocmUE6'
  );

  return (
    <footer className="bg-[#101b14] text-slate-300 pt-6 pb-24 md:pb-8 border-t border-slate-800/60">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-start gap-0 text-left pl-4 md:pl-8">
          {/* Logo aligné à gauche */}
          <img src="/LOGOngsans.png" alt="3D88" className="w-20 h-20 md:w-24 md:h-24 object-contain" />

          {/* Suivez-nous sur 2 lignes (texte + icônes) */}
          <div className="mt-0 flex flex-col items-start gap-1 text-[#4a7a54] text-xs md:text-sm">
            <span>Suivez-nous sur nos réseaux :</span>
            <div className="flex items-center gap-4 mb-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a7a54] hover:text-[#3caa35] transition-colors"
                aria-label="Instagram 3D88"
              >
                <Instagram className="w-5 h-5 md:w-6 md:h-6" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a7a54] hover:text-[#3caa35] transition-colors"
                aria-label="Facebook 3D88"
              >
                <Facebook className="w-5 h-5 md:w-6 md:h-6" />
              </a>
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4a7a54] hover:text-[#3caa35] transition-colors"
                aria-label="Google Maps 3D88"
              >
                <span className="text-xl md:text-2xl font-bold leading-none align-middle">
                  G
                </span>
              </a>
            </div>
          </div>

          {/* Texte + mentions légales sur une ligne */}
          <p className="text-xs md:text-sm text-[#4a7a54]">
            {text}{' '}
            <a
              href="/mentions-legales"
              className="text-[#4a7a54] hover:text-[#3caa35] transition-colors underline-offset-4 hover:underline"
            >
              Mentions légales
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
