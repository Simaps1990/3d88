import { useSiteText } from '../hooks/useSiteText';

export default function Footer() {
  const text = useSiteText('footer_text', `© ${new Date().getFullYear()} 3D88. Tous droits réservés.`);
  return (
    <footer className="bg-[#101b14] text-slate-300 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-start gap-4">
          <div className="flex items-center mb-2 md:mb-0">
            <img src="/LOGOng.png" alt="3D88" className="w-24 h-24 object-contain" />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 text-sm text-[#4a7a54]">
            <p className="text-left">
              {text}
            </p>
            <a
              href="/mentions-legales"
              className="text-[#4a7a54] hover:text-[#e1d59d] transition-colors"
            >
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
