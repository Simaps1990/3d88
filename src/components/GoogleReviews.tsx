import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Review {
  id: number;
  authorName: string;
  rating: number;
  text: string;
  month?: number | null;
  year?: number | null;
  sourceUrl?: string | null;
}

const GOOGLE_REVIEWS_URL =
  'https://www.google.com/search?sca_esv=d929fa6a8c66904f&hl=fr-FR&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E0wEE17-jJZvHhdKzWiXV1I8pqR-Bni6b-joT1zoNCMH5mwhRGA2hDw29iftFvku3PDXJl43JnkLJGImPurUaCPGLy3g&q=3D88+Avis&sa=X&ved=2ahUKEwjCyaaikqqRAxUqKvsDHdTzJt8Q0bkNegQIIhAE&biw=1536&bih=730&dpr=1.25';

const MONTH_LABELS = [
  '',
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      const { data, error } = await supabase
        .from('google_reviews')
        .select('id, author_name, rating, review_text, source_url, review_month, review_year')
        .eq('is_published', true)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        const mapped: Review[] = data.map((row: any) => ({
          id: row.id,
          authorName: row.author_name,
          rating: row.rating,
          text: row.review_text,
          month: row.review_month,
          year: row.review_year,
          sourceUrl: row.source_url,
        }));
        setReviews(mapped);
        setActiveIndex(0);
      }
    };

    void loadReviews();
  }, []);

  useEffect(() => {
    if (reviews.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  if (reviews.length === 0) {
    return null;
  }

  const activeReview = reviews[activeIndex];

  const dateLabel =
    activeReview.month && activeReview.year
      ? `${MONTH_LABELS[activeReview.month]} ${activeReview.year}`
      : '';

  return (
    <section className="bg-slate-900 py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Avis Google</h2>
          <p className="text-slate-300 text-lg">
            Découvrez ce que les clients pensent de 3D88 sur Google.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-slate-800/80 border border-slate-700 shadow-xl px-6 py-8 md:px-10 md:py-10 min-h-[230px] md:min-h-[210px]">
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
            {dateLabel && <p className="text-sm text-slate-400">{dateLabel}</p>}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((review, index) => (
              <button
                key={review.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={
                  'w-2.5 h-2.5 rounded-full transition-colors ' +
                  (index === activeIndex ? 'bg-[#0e6e40]' : 'bg-slate-600')
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
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#0e6e40] hover:bg-[#3caa35] text-white font-semibold transition-colors"
          >
            Voir les avis
          </a>
        </div>
      </div>
    </section>
  );
}