import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function LegalMentions() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <Navigation />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-6 max-w-3xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Mentions légales</h1>
            <p className="text-sm text-slate-400">Informations légales et identité de l'éditeur du site.</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Éditeur du site</h2>
            <p className="text-slate-200 text-sm leading-relaxed">
              Le site 3D88 est édité par :
              <br />
              <span className="font-semibold">Gauthier Thouvenin</span>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="text-slate-200 text-sm leading-relaxed">
              Pour toute question concernant le site ou son contenu, vous pouvez utiliser le formulaire de contact
              disponible sur la page d&apos;accueil.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">Propriété intellectuelle</h2>
            <p className="text-slate-200 text-sm leading-relaxed">
              L&apos;ensemble des contenus présents sur ce site (textes, images, visuels, etc.) sont la propriété de leur
              auteur, sauf mention contraire, et ne peuvent être reproduits sans autorisation préalable.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
