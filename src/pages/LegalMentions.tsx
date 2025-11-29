import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useSiteText } from '../hooks/useSiteText';

export default function LegalMentions() {
  const pageTitle = useSiteText('legal_title', 'Mentions légales');
  const pageSubtitle = useSiteText(
    'legal_subtitle',
    "Informations légales et identité de l'éditeur du site."
  );

  const editorSectionTitle = useSiteText('legal_editor_title', 'Éditeur du site');
  const editorSectionBody = useSiteText(
    'legal_editor_body',
    "Le site 3D88 est édité par :\nGauthier Thouvenin"
  );

  const contactSectionTitle = useSiteText('legal_contact_title', 'Contact');
  const contactSectionBody = useSiteText(
    'legal_contact_body',
    "Pour toute question concernant le site ou son contenu, vous pouvez utiliser le formulaire de contact disponible sur la page d'accueil."
  );

  const ipSectionTitle = useSiteText('legal_ip_title', 'Propriété intellectuelle');
  const ipSectionBody = useSiteText(
    'legal_ip_body',
    "L'ensemble des contenus présents sur ce site (textes, images, visuels, etc.) sont la propriété de leur auteur, sauf mention contraire, et ne peuvent être reproduits sans autorisation préalable."
  );

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-3xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{pageTitle}</h1>
            <p className="text-sm text-slate-400">{pageSubtitle}</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">{editorSectionTitle}</h2>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {editorSectionBody}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">{contactSectionTitle}</h2>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {contactSectionBody}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">{ipSectionTitle}</h2>
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {ipSectionBody}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
