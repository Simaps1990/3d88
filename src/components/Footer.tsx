import { useSiteText } from '../hooks/useSiteText';

export default function Footer() {
  const text = useSiteText('footer_text', `© ${new Date().getFullYear()} 3D88. Tous droits réservés.`);
  return (
    <footer className="bg-[#101b14] text-slate-300 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 mb-2 md:mb-0">
            <img src="/logo3d.png" alt="3D88" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-white">
              3D88
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-sm">
            <p className="text-center md:text-right">
              {text}
            </p>
            <a
              href="/mentions-legales"
              className="text-slate-400 hover:text-[#e1d59d] transition-colors"
            >
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
