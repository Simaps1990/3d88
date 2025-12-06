import { useEffect, useState } from 'react';

interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}

const GOOGLE_REVIEWS_URL =
  'https://www.google.com/search?sca_esv=d929fa6a8c66904f&hl=fr-FR&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E0wEE17-jJZvHhdKzWiXV1I8pqR-Bni6b-joT1zoNCMH5mwhRGA2hDw29iftFvku3PDXJl43JnkLJGImPurUaCPGLy3g&q=3D88+Avis&sa=X&ved=2ahUKEwjCyaaikqqRAxUqKvsDHdTzJt8Q0bkNegQIIhAE&biw=1536&bih=730&dpr=1.25';

const REVIEWS: Review[] = [
  {
    id: 'richard-peterlini',
    authorName: 'Richard Peterlini',
    rating: 5,
    relativeTime: 'il y a 3 mois',
    text:
      "Vendeur extrêmement pro et agréable, excellente communication, travail de qualité pour une commande 100% sur mesure. Travail de minutie et tarif complètement abordable ! Impossible de ne pas recommander cette boutique ! Je reviendrais avec plaisir 👍",
  },
  {
    id: 'antoine-cervek',
    authorName: 'Antoine Cervek',
    rating: 5,
    relativeTime: 'il y a 2 mois',
    text:
      'Super travail, réalisation de support pour mes figurines. Travail soigné et rapide. Super communication, je recommande',
  },
  {
    id: 'schvartz-alexis',
    authorName: 'Schvartz Alexis',
    rating: 5,
    relativeTime: 'il y a 2 mois',
    text: 'Entreprise sérieuse et réactive ! Je recommande',
  },
];

export default function GoogleReviews() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (REVIEWS.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  if (REVIEWS.length === 0) {
    return null;
  }

  const activeReview = REVIEWS[activeIndex];

  return (
    <section className="bg-slate-900 py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Avis Google</h2>
          <p className="text-slate-300 text-lg">
            Découvrez ce que les clients pensent de 3D88 sur Google.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl px-6 py-8 md:px-10 md:py-10">
          <div className="transition-all duration-500 ease-out">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-sm text-slate-400">Avis Google</p>
                <p className="text-lg font-semibold text-white">{activeReview.authorName}</p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < activeReview.rating
                        ? 'text-yellow-400 text-xl'
                        : 'text-slate-600 text-xl'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <p className="text-slate-100 text-base md:text-lg leading-relaxed mb-4">
              « {activeReview.text} »
            </p>
            <p className="text-sm text-slate-400">{activeReview.relativeTime}</p>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {REVIEWS.map((review, index) => (
              <button
                key={review.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={
                  'w-2.5 h-2.5 rounded-full transition-colors ' +
                  (index === activeIndex ? 'bg-[#3caa35]' : 'bg-slate-600')
                }
                aria-label={`Afficher l'avis ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#3caa35] hover:bg-[#0e6e40] text-white font-semibold transition-colors"
          >
            Voir les avis
          </a>
        </div>
      </div>
    </section>
  );
}