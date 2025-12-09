import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Realization, SiteText } from '../lib/supabase';
import {
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'realizations' | 'contents' | 'bandeau' | 'reviews'>('realizations');
  const [realizations, setRealizations] = useState<Realization[]>([]);
  const [siteTexts, setSiteTexts] = useState<SiteText[]>([]);
  const [reviews, setReviews] = useState<{
    id: number;
    author_name: string;
    rating: number;
    review_text: string;
    review_month: number | null;
    review_year: number | null;
    is_published: boolean;
    display_order: number | null;
  }[]>([]);
  const [reviewSaving, setReviewSaving] = useState<boolean[]>(Array(5).fill(false));
  const [reviewSaved, setReviewSaved] = useState<boolean[]>(Array(5).fill(false));
  const [dirtyKeys, setDirtyKeys] = useState<string[]>([]);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRealization, setEditingRealization] = useState<Realization | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    image_url_2: '',
    image_url_3: '',
    image_url_4: '',
    published: false
  });
  const [bannerText, setBannerText] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const bannerEditorRef = useRef<HTMLDivElement | null>(null);
  const [bannerBoldActive, setBannerBoldActive] = useState(false);
  const [bannerItalicActive, setBannerItalicActive] = useState(false);
  const [bannerUnderlineActive, setBannerUnderlineActive] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    loadData();
  }, [user, loading, activeTab]);

  const loadData = async () => {
    if (activeTab === 'realizations') {
      const { data } = await supabase
        .from('realizations')
        .select('*')
        .order('order_position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (data) setRealizations(data as Realization[]);
    } else if (activeTab === 'contents') {
      const { data } = await supabase
        .from('site_texts')
        .select('*')
        .order('key', { ascending: true });
      if (data) setSiteTexts(data as SiteText[]);
    } else if (activeTab === 'bandeau') {
      const { data } = await supabase
        .from('site_texts')
        .select('key, value')
        .in('key', ['banner_html', 'banner_link', 'banner_enabled']);

      if (data) {
        const map = Object.fromEntries(data.map((row: any) => [row.key, row.value ?? '']));
        const html = (map['banner_html'] as string) || '';
        setBannerText(html);
        setBannerLink((map['banner_link'] as string) || '');
        setBannerEnabled(((map['banner_enabled'] as string) || 'false') === 'true');

        if (bannerEditorRef.current) {
          bannerEditorRef.current.innerHTML = html;
          refreshBannerToolbarState();
        }
      }
    } else if (activeTab === 'reviews') {
      const { data } = await supabase
        .from('google_reviews')
        .select('id, author_name, rating, review_text, review_month, review_year, is_published, display_order')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (data) {
        setReviews(data as any);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'bandeau' && bannerEditorRef.current) {
      // Quand on ouvre l'onglet Bandeau, on s'assure que l'éditeur contient le texte courant
      if (bannerEditorRef.current.innerHTML === '') {
        bannerEditorRef.current.innerHTML = bannerText || '';
      }
      refreshBannerToolbarState();
    }
  }, [activeTab]);

  // Fonctions d'upload d'image supprimées pour l'instant car non utilisées dans l'interface

  const handleImageUpload = async (file: File, slot: 1 | 2 | 3 | 4) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-slot${slot}.${ext}`;

    const { data, error } = await supabase.storage.from('realizations').upload(fileName, file);
    if (error || !data?.path) {
      console.error('Erreur upload image', error);
      return;
    }

    const { data: publicData } = supabase.storage
      .from('realizations')
      .getPublicUrl(data.path);

    const url = publicData?.publicUrl || '';
    setFormData((current) => {
      if (slot === 1) return { ...current, image_url: url };
      if (slot === 2) return { ...current, image_url_2: url };
      if (slot === 3) return { ...current, image_url_3: url };
      return { ...current, image_url_4: url };
    });
  };

  const compressImage = (
    file: File,
    maxSizeMB = 1.5,
    maxWidth = 1920,
    maxHeight = 1920
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Erreur lecture du fichier')); 

      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Erreur chargement de l'image"));

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Contexte canvas indisponible'));
            return;
          }

          const scale = Math.min(
            1,
            maxWidth / img.width,
            maxHeight / img.height
          );

          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const targetBytes = maxSizeMB * 1024 * 1024;

          const tryToBlob = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Impossible de compresser le fichier'));
                  return;
                }

                if (blob.size <= targetBytes || quality <= 0.4) {
                  resolve(blob);
                  return;
                }

                // On réduit progressivement la qualité si le fichier est encore trop lourd
                tryToBlob(quality - 0.1);
              },
              'image/jpeg',
              quality
            );
          };

          tryToBlob(0.9);
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const handleHeroBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // On compresse l'image côté client pour viser ~1,5 Mo max
    let compressedBlob: Blob;
    try {
      compressedBlob = await compressImage(file, 1.5, 1920, 1920);
    } catch (err) {
      console.error('Erreur lors de la compression de limage hero', err);
      alert("Erreur lors de la compression de l'image. Merci de réessayer avec un autre fichier.");
      return;
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-hero-bg.jpg`;

    const { data, error } = await supabase.storage.from('realizations').upload(fileName, compressedBlob);
    if (error || !data?.path) {
      console.error('Erreur upload image hero', error);
      alert("Erreur lors de l'upload de l'image. Merci de réessayer.");
      return;
    }

    const { data: publicData } = supabase.storage.from('realizations').getPublicUrl(data.path);
    const url = publicData?.publicUrl || '';

    if (!url) {
      alert("Impossible de récupérer l'URL publique de l'image.");
      return;
    }

    handleSiteTextChange('hero_background_url', url);
  };

  const handleSiteTextChange = (key: string, value: string) => {
    setSiteTexts((current) => {
      const exists = current.some((text) => text.key === key);
      if (!exists) {
        return [
          ...current,
          {
            key,
            value,
            description: '',
          } as SiteText,
        ];
      }

      return current.map((text) => (text.key === key ? { ...text, value } : text));
    });

    setDirtyKeys((current) => (current.includes(key) ? current : [...current, key]));
    setSavedKeys((current) => current.filter((k) => k !== key));
  };

  const handleSaveSiteText = async (text: SiteText) => {
    setSavingKey(text.key);
    await supabase
      .from('site_texts')
      .upsert({
        key: text.key,
        value: text.value,
        description: text.description,
      });
    setSavingKey(null);

    setDirtyKeys((current) => current.filter((k) => k !== text.key));
    setSavedKeys((current) => (current.includes(text.key) ? current : [...current, text.key]));
  };

  const getSaveButtonClasses = (key: string) => {
    const base = 'h-9 px-4 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors';
    if (savingKey === key) {
      return `${base} bg-slate-400 text-white cursor-default`;
    }
    if (savedKeys.includes(key)) {
      return `${base} bg-[#3caa35] hover:bg-[#1f4d28] text-white`;
    }
    return `${base} bg-slate-900 hover:bg-slate-800 text-white`;
  };

  const getSaveButtonLabel = (key: string) => {
    if (savingKey === key) return 'Enregistrement...';
    if (savedKeys.includes(key)) return 'Enregistré';
    return 'Enregistrer';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRealization) {
      await supabase
        .from('realizations')
        .update(formData)
        .eq('id', editingRealization.id);
    } else {
      await supabase.from('realizations').insert([formData]);
    }

    setShowModal(false);
    setEditingRealization(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      image_url_2: '',
      image_url_3: '',
      image_url_4: '',
      published: false
    });
    loadData();
  };

  const moveRealization = async (realization: Realization, direction: 'up' | 'down') => {
    const index = realizations.findIndex((r) => r.id === realization.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= realizations.length) return;

    const target = realizations[targetIndex];

    const currentPos = realization.order_position ?? index;
    const targetPos = target.order_position ?? targetIndex;

    // Mise à jour dans Supabase (on échange les positions)
    await supabase
      .from('realizations')
      .update({ order_position: targetPos })
      .eq('id', realization.id);

    await supabase
      .from('realizations')
      .update({ order_position: currentPos })
      .eq('id', target.id);

    // Mise à jour optimiste côté client
    const updated = [...realizations];
    updated[index] = { ...target, order_position: currentPos };
    updated[targetIndex] = { ...realization, order_position: targetPos };
    setRealizations(updated);
  };

  const handleEdit = (realization: Realization) => {
    setEditingRealization(realization);
    setFormData({
      title: realization.title,
      description: realization.description,
      image_url: realization.image_url,
      image_url_2: realization.image_url_2 || '',
      image_url_3: realization.image_url_3 || '',
      image_url_4: realization.image_url_4 || '',
      published: realization.published
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réalisation ?')) {
      await supabase.from('realizations').delete().eq('id', id);
      loadData();
    }
  };

  const togglePublished = async (realization: Realization) => {
    await supabase
      .from('realizations')
      .update({ published: !realization.published })
      .eq('id', realization.id);
    loadData();
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const refreshBannerToolbarState = () => {
    try {
      setBannerBoldActive(document.queryCommandState('bold'));
      setBannerItalicActive(document.queryCommandState('italic'));
      setBannerUnderlineActive(document.queryCommandState('underline'));
    } catch {
      // ignore
    }
  };

  const applyBannerCommand = (command: string, value?: string) => {
    if (!bannerEditorRef.current) return;
    try {
      document.execCommand(command, false, value ?? '');
      setBannerText(bannerEditorRef.current.innerHTML);
      refreshBannerToolbarState();
    } catch (err) {
      console.error('Erreur mise en forme bandeau', err);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSaving(true);
    try {
      await supabase.from('site_texts').upsert([
        { key: 'banner_html', value: bannerText, description: 'Texte HTML du bandeau promotionnel' },
        { key: 'banner_link', value: bannerLink, description: 'Lien cliquable du bandeau' },
        { key: 'banner_enabled', value: bannerEnabled ? 'true' : 'false', description: 'Activation du bandeau' },
      ]);
    } finally {
      setBannerSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 px-8 py-6 text-center space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Accès administrateur</h1>
          <p className="text-sm text-slate-600">
            Vous devez être connecté pour accéder au tableau de bord.
          </p>
          <a
            href="/admin/login"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Aller à la page de connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <nav className="bg-[#101b14]/95 backdrop-blur-md shadow-lg border-b border-slate-900/60 fixed top-0 left-0 right-0 z-40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative flex items-center justify-center md:justify-between h-20">
            <a href="/" className="flex items-center space-x-3">
              <img src="/LOGOngsans.png" alt="3D88" className="h-14 w-auto object-contain" />
              <span className="hidden md:inline-block text-xs font-medium uppercase tracking-wide text-white ml-2">
                Mon espace perso
              </span>
            </a>

            <div className="hidden md:flex items-center space-x-4">
              <a
                href="/"
                className="text-sm font-medium text-white hover:text-[#e1d59d] transition-colors"
              >
                Retour au site
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="md:hidden absolute right-0 inset-y-0 inline-flex items-center justify-center px-3 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#4a7a54]"
              aria-label="Ouvrir le menu admin"
            >
              <span className="sr-only">Ouvrir le menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="mt-3 flex flex-col space-y-4 pb-4 md:hidden">
              {/* Bloc retour au site */}
              <div className="border-b border-slate-800 pb-3">
                <a
                  href="/"
                  className="inline-flex items-center w-full px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Retour au site
                </a>
              </div>

              {/* Bloc onglets backoffice */}
              <nav className="flex flex-col">
                <button
                  onClick={() => {
                    setActiveTab('realizations');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'realizations'
                      ? 'bg-white text-slate-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Réalisations
                </button>
                <button
                  onClick={() => {
                    setActiveTab('contents');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'contents'
                      ? 'bg-white text-slate-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Contenus
                </button>
                <button
                  onClick={() => {
                    setActiveTab('bandeau');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'bandeau'
                      ? 'bg-white text-slate-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Bandeau
                </button>
                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'reviews'
                      ? 'bg-white text-slate-900'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Avis
                </button>
              </nav>

              {/* Bloc déconnexion */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm mb-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto hidden md:flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveTab('realizations')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'realizations'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Réalisations
          </button>
          <button
            onClick={() => setActiveTab('contents')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'contents'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Contenus
          </button>
          <button
            onClick={() => setActiveTab('bandeau')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'bandeau'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Bandeau
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'reviews'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Avis
          </button>
        </div>

        {activeTab === 'realizations' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Réalisations</h2>
              <button
                onClick={() => {
                  setEditingRealization(null);
                  setFormData({
                    title: '',
                    description: '',
                    image_url: '',
                    image_url_2: '',
                    image_url_3: '',
                    image_url_4: '',
                    published: false
                  });
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle réalisation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {realizations.map((realization) => (
                <div
                  key={realization.id}
                  className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:space-x-4 flex-1">
                      <img
                        src={realization.image_url}
                        alt={realization.title}
                        className="w-full sm:w-32 h-40 sm:h-24 object-cover rounded-lg mb-3 sm:mb-0"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base md:text-lg font-bold text-slate-900">{realization.title}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              realization.published
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {realization.published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        {/* On n'affiche plus la catégorie (technique, général, etc.) dans les cartes admin */}
                        <p className="text-sm text-slate-700 line-clamp-2 md:line-clamp-3">{realization.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center md:items-start justify-end md:justify-start space-x-2 md:space-x-1">
                      <div className="flex flex-col space-y-1 mr-1">
                        <button
                          type="button"
                          onClick={() => moveRealization(realization, 'up')}
                          className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Monter"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveRealization(realization, 'down')}
                          className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Descendre"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => togglePublished(realization)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title={realization.published ? 'Dépublier' : 'Publier'}
                      >
                        {realization.published ? (
                          <EyeOff className="w-5 h-5 text-slate-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(realization)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(realization.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Avis Google</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-3xl">
              Gérez ici jusqu'à 5 avis qui seront affichés sur la page d'accueil.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {Array.from({ length: 5 }).map((_, index) => {
                const review = reviews[index];
                const id = review?.id;

                const handleSave = async () => {
                  setReviewSaved((current) => {
                    const next = [...current];
                    next[index] = false;
                    return next;
                  });
                  setReviewSaving((current) => {
                    const next = [...current];
                    next[index] = true;
                    return next;
                  });

                  const form = (document.getElementById(`review-form-${index}`) as HTMLFormElement | null);
                  if (!form) return;

                  const formData = new FormData(form);
                  const author_name = (formData.get('author_name') as string).trim();
                  const rating = Number(formData.get('rating') || 5);
                  const review_text = (formData.get('review_text') as string).trim();
                  const review_month = formData.get('review_month') ? Number(formData.get('review_month')) : null;
                  const review_year = formData.get('review_year') ? Number(formData.get('review_year')) : null;
                  const is_published = formData.get('is_published') === 'on';
                  const display_order = index + 1;

                  if (!author_name || !review_text) {
                    alert('Merci de remplir au minimum le nom et le commentaire.');
                    setReviewSaving((current) => {
                      const next = [...current];
                      next[index] = false;
                      return next;
                    });
                    return;
                  }

                  try {
                    if (id) {
                      await supabase
                        .from('google_reviews')
                        .update({
                          author_name,
                          rating,
                          review_text,
                          review_month,
                          review_year,
                          is_published,
                          display_order,
                        })
                        .eq('id', id);
                    } else {
                      await supabase.from('google_reviews').insert([
                        {
                          author_name,
                          rating,
                          review_text,
                          review_month,
                          review_year,
                          is_published,
                          display_order,
                        },
                      ]);
                    }

                    await loadData();

                    setReviewSaved((current) => {
                      const next = [...current];
                      next[index] = true;
                      return next;
                    });
                  } finally {
                    setReviewSaving((current) => {
                      const next = [...current];
                      next[index] = false;
                      return next;
                    });
                  }
                };

                return (
                  <form
                    key={index}
                    id={`review-form-${index}`}
                    className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSave();
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Avis #{index + 1}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        Ordre&nbsp;: {index + 1}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Nom du client
                        </label>
                        <input
                          type="text"
                          name="author_name"
                          defaultValue={review?.author_name || ''}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Note (1 à 5)
                          </label>
                          <select
                            name="rating"
                            defaultValue={review?.rating?.toString() || '5'}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n} ★
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Mois
                            </label>
                            <input
                              type="number"
                              name="review_month"
                              min={1}
                              max={12}
                              defaultValue={review?.review_month ?? ''}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Année
                            </label>
                            <input
                              type="number"
                              name="review_year"
                              min={2000}
                              max={2100}
                              defaultValue={review?.review_year ?? ''}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Commentaire
                        </label>
                        <textarea
                          name="review_text"
                          defaultValue={review?.review_text || ''}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-y min-h-[128px]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          name="is_published"
                          checked={review?.is_published ?? false}
                          onChange={(e) => {
                            if (!review) return;
                            const next = [...reviews];
                            next[index] = { ...review, is_published: e.target.checked };
                            setReviews(next as any);
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Afficher sur le site
                      </label>

                      <button
                        type="submit"
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          reviewSaved[index]
                            ? 'bg-[#3caa35] hover:bg-[#1f4d28] text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {reviewSaving[index]
                          ? 'Enregistrement...'
                          : reviewSaved[index]
                          ? 'Enregistré'
                          : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'contents' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Contenus du site</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-3xl">
              Modifiez ici les textes principaux du site. Les réalisations et les avis disposent de leurs
              propres onglets.
            </p>

            {siteTexts.length === 0 ? (
              <p className="text-slate-500">Aucun contenu n'est encore défini dans la table site_texts.</p>
            ) : (
              <div className="space-y-8">
                {(() => {
                  const findText = (key: string, fallbackLabel: string): SiteText => {
                    const existing = siteTexts.find((t) => t.key === key);
                    if (existing) return existing;
                    return { key, value: '', description: fallbackLabel } as SiteText;
                  };

                  const heroLead = findText('hero_lead', "Texte d'introduction affiché sous le logo");
                  const heroCtaPrimary = findText('hero_cta_primary', 'Texte du bouton principal');
                  const heroCtaSecondary = findText('hero_cta_secondary', 'Texte du bouton secondaire');
                  const heroBackgroundUrl = findText(
                    'hero_background_url',
                    "URL de l'image de fond du bloc hero (par exemple /fond.jpg ou une URL complète)"
                  );
                  const aboutTitle = findText('about_title', 'Titre de la section À propos');
                  const aboutContent = findText('about_content', 'Texte de présentation');

                  // Si aucune valeur n'est encore enregistrée en base, on pré-remplit
                  // avec les mêmes valeurs par défaut que dans le composant About.tsx
                  if (!aboutTitle.value) {
                    aboutTitle.value = 'À propos de 3D88';
                  }
                  if (!aboutContent.value) {
                    aboutContent.value =
                      "Je suis passionné par la conception 3D et l'impression 3D. 3D88 vous accompagne de l'idée au prototype puis à la pièce finale, pour des projets uniques ou des petites séries.\n\nBasé en Isère, je travaille avec des particuliers, des professionnels et des collectivités pour donner vie à des pièces techniques, des objets décoratifs ou des maquettes sur mesure.";
                  }

                  const servicesTitle = findText('services_title', 'Titre de la section Services');
                  const servicesSubtitle = findText('services_subtitle', 'Sous-titre des services');

                  const service1Title = findText('service_1_title', 'Service 1 – titre');
                  const service1Description = findText('service_1_description', 'Service 1 – description');
                  const service2Title = findText('service_2_title', 'Service 2 – titre');
                  const service2Description = findText('service_2_description', 'Service 2 – description');
                  const service3Title = findText('service_3_title', 'Service 3 – titre');
                  const service3Description = findText('service_3_description', 'Service 3 – description');
                  const service4Title = findText('service_4_title', 'Service 4 – titre');
                  const service4Description = findText('service_4_description', 'Service 4 – description');

                  // Valeurs par défaut identiques à celles du composant Services.tsx
                  if (!service1Title.value) service1Title.value = 'Modélisation 3D';
                  if (!service1Description.value)
                    service1Description.value =
                      'Création de modèles 3D sur mesure adaptés à vos besoins spécifiques, du concept à la réalisation finale.';

                  if (!service2Title.value) service2Title.value = 'Impression 3D';
                  if (!service2Description.value)
                    service2Description.value =
                      'Impression haute précision en PLA, ABS, PETG et autres matériaux pour des résultats professionnels.';

                  if (!service3Title.value) service3Title.value = 'Prototypage';
                  if (!service3Description.value)
                    service3Description.value =
                      'Développement rapide de prototypes fonctionnels pour tester et valider vos idées avant production.';

                  if (!service4Title.value) service4Title.value = 'Conseil & Expertise';
                  if (!service4Description.value)
                    service4Description.value =
                      'Accompagnement personnalisé pour optimiser vos projets et choisir les meilleures solutions techniques.';

                  const contactTitle = findText('contact_title', 'Titre de la section Contact');
                  const contactSubtitle = findText('contact_subtitle', 'Sous-titre de contact');
                  const contactEmail = findText(
                    'contact_email',
                    "Adresse email qui recevra les demandes du formulaire de contact"
                  );

                  // Valeurs par défaut alignées avec le composant Contact.tsx
                  if (!contactEmail.value) {
                    contactEmail.value = 'contact@impression3d.fr';
                  }

                  const footerText = findText('footer_text', 'Texte du pied de page');
                  const socialInstagramUrl = findText(
                    'social_instagram_url',
                    'URL du profil Instagram affiché sur le site'
                  );
                  const socialFacebookUrl = findText(
                    'social_facebook_url',
                    'URL de la page Facebook affichée sur le site'
                  );
                  const socialGoogleUrl = findText(
                    'social_google_url',
                    'URL de la fiche Google Maps affichée dans le pied de page'
                  );

                  // Valeurs par défaut alignées avec About.tsx et Footer.tsx
                  if (!socialInstagramUrl.value) {
                    socialInstagramUrl.value = 'https://www.instagram.com/print.3d88?igsh=cno1aTRuNmhoaWxm';
                  }
                  if (!socialFacebookUrl.value) {
                    socialFacebookUrl.value = 'https://www.facebook.com/share/1AUcQdRyEA/?mibextid=wwXIfr';
                  }
                  if (!socialGoogleUrl.value) {
                    socialGoogleUrl.value = 'https://maps.app.goo.gl/zXUxZVvabJBocmUE6';
                  }

                  const legalTitle = findText('legal_title', 'Titre page Mentions légales');
                  const legalSubtitle = findText('legal_subtitle', 'Sous-titre Mentions légales');
                  const legalEditorTitle = findText('legal_editor_title', 'Titre bloc éditeur');
                  const legalEditorBody = findText('legal_editor_body', 'Texte bloc éditeur');
                  const legalContactTitle = findText('legal_contact_title', 'Titre bloc contact');
                  const legalContactBody = findText('legal_contact_body', 'Texte bloc contact');
                  const legalIpTitle = findText('legal_ip_title', 'Titre bloc propriété intellectuelle');
                  const legalIpBody = findText('legal_ip_body', 'Texte bloc propriété intellectuelle');

                  return (
                    <>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Hero – Texte principal</h3>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                              <span>{heroLead.description}</span>
                              {dirtyKeys.includes(heroLead.key) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  Modifié
                                </span>
                              )}
                            </p>
                            <div className="flex items-end gap-4">
                              <textarea
                                value={heroLead.value}
                                onChange={(e) => handleSiteTextChange(heroLead.key, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[96px]"
                              />
                              <button
                                onClick={() => handleSaveSiteText(heroLead)}
                                disabled={savingKey === heroLead.key}
                                className={getSaveButtonClasses(heroLead.key)}
                              >
                                {getSaveButtonLabel(heroLead.key)}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Contact – Email de réception</h3>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                              <span>{contactEmail.description}</span>
                              {dirtyKeys.includes(contactEmail.key) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  Modifié
                                </span>
                              )}
                            </p>
                            <div className="flex items-end gap-4">
                              <input
                                type="email"
                                value={contactEmail.value}
                                onChange={(e) => handleSiteTextChange(contactEmail.key, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                placeholder="contact@exemple.com"
                              />
                              <button
                                onClick={() => handleSaveSiteText(contactEmail)}
                                disabled={savingKey === contactEmail.key}
                                className={getSaveButtonClasses(contactEmail.key)}
                              >
                                {getSaveButtonLabel(contactEmail.key)}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Réseaux sociaux</h3>
                        <p className="text-xs text-slate-500">
                          Ces liens sont utilisés dans la section À propos et dans le pied de page.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[socialInstagramUrl, socialFacebookUrl, socialGoogleUrl].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                                  <span>{text.description}</span>
                                  {dirtyKeys.includes(text.key) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                      Modifié
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-end gap-4">
                                  <input
                                    type="url"
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="https://..."
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key) + ' self-stretch flex items-center justify-center'}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Hero – Image de fond</h3>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                              <span>{heroBackgroundUrl.description}</span>
                              {dirtyKeys.includes(heroBackgroundUrl.key) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  Modifié
                                </span>
                              )}
                            </p>

                            <div className="flex items-end gap-4">
                              <input
                                type="text"
                                value={heroBackgroundUrl.value}
                                onChange={(e) => handleSiteTextChange(heroBackgroundUrl.key, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                placeholder="/fond.jpg ou https://..."
                              />
                              <button
                                onClick={() => handleSaveSiteText(heroBackgroundUrl)}
                                disabled={savingKey === heroBackgroundUrl.key}
                                className={getSaveButtonClasses(heroBackgroundUrl.key)}
                              >
                                {getSaveButtonLabel(heroBackgroundUrl.key)}
                              </button>
                            </div>

                            {heroBackgroundUrl.value && (
                              <div className="mt-2">
                                <p className="text-[11px] text-slate-500 mb-1">Aperçu de l'image actuelle :</p>
                                <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                  <img
                                    src={heroBackgroundUrl.value}
                                    alt="Aperçu image de fond hero"
                                    className="w-full h-40 object-cover"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="pt-1 space-y-1">
                              <p className="text-[11px] text-slate-500">Ou téléversez une nouvelle image :</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleHeroBackgroundUpload}
                                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Hero – Boutons</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[heroCtaPrimary, heroCtaSecondary].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                                  <span>{text.description}</span>
                                  {dirtyKeys.includes(text.key) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                      Modifié
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-end gap-4">
                                  <input
                                    type="text"
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Services</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {[servicesTitle, servicesSubtitle].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                                  <span>{text.description}</span>
                                  {dirtyKeys.includes(text.key) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                      Modifié
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-end gap-4">
                                  <textarea
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[96px]"
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Services – Cartes</h3>
                        <p className="text-xs text-slate-500">
                          Ces champs contrôlent les titres et descriptions des 4 cartes services visibles sur la page
                          d&apos;accueil.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[service1Title, service1Description, service2Title, service2Description, service3Title, service3Description, service4Title, service4Description].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                                  <span>{text.description}</span>
                                  {dirtyKeys.includes(text.key) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                      Modifié
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-end gap-4">
                                  {text.key.includes('_description') ? (
                                    <textarea
                                      value={text.value}
                                      onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[96px]"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={text.value}
                                      onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                    />
                                  )}
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">À propos – Titre et contenu</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {[aboutTitle, aboutContent].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                                  <span>{text.description}</span>
                                  {dirtyKeys.includes(text.key) && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                      Modifié
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-end gap-4">
                                  <textarea
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[128px]"
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>



                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Contact</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {[contactTitle, contactSubtitle].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600">{text.description}</p>
                                <div className="flex items-end gap-4">
                                  <textarea
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[60px]"
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>




                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Pied de page</h3>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-600 flex items-center gap-2">
                              <span>Texte du bas de page</span>
                              {dirtyKeys.includes(footerText.key) && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  Modifié
                                </span>
                              )}
                            </p>
                            <div className="flex items-end gap-4">
                              <textarea
                                value={footerText.value}
                                onChange={(e) => handleSiteTextChange(footerText.key, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[96px]"
                              />
                              <button
                                onClick={() => handleSaveSiteText(footerText)}
                                disabled={savingKey === footerText.key}
                                className={getSaveButtonClasses(footerText.key)}
                              >
                                {getSaveButtonLabel(footerText.key)}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-900">Mentions légales</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {[legalTitle, legalSubtitle].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600">{text.description}</p>
                                <div className="flex items-end gap-4">
                                  <input
                                    type="text"
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {[legalEditorTitle, legalEditorBody, legalContactTitle, legalContactBody, legalIpTitle, legalIpBody].map((text) => (
                            <div
                              key={text.key}
                              className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-600">{text.description}</p>
                                <div className="flex items-end gap-4">
                                  <textarea
                                    value={text.value}
                                    onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[80px]"
                                  />
                                  <button
                                    onClick={() => handleSaveSiteText(text)}
                                    disabled={savingKey === text.key}
                                    className={getSaveButtonClasses(text.key)}
                                  >
                                    {getSaveButtonLabel(text.key)}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bandeau' && (
          <div className="max-w-6xl mx-auto mt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Bandeau</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-3xl">
              Configurez ici le texte et le lien de votre bandeau promotionnel affiché sous le header sur le site.
            </p>

            <form onSubmit={handleSaveBanner} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Texte du bandeau
                </label>

                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  <span className="text-slate-500 mr-2">Mise en forme&nbsp;:</span>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded border text-xs font-semibold transition-colors ${
                      bannerBoldActive
                        ? 'border-[#4a7a54] bg-[#4a7a54] text-[#e1d59d]'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBannerCommand('bold')}
                  >
                    G
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded border text-xs italic transition-colors ${
                      bannerItalicActive
                        ? 'border-[#4a7a54] bg-[#4a7a54] text-[#e1d59d]'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBannerCommand('italic')}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded border text-xs underline transition-colors ${
                      bannerUnderlineActive
                        ? 'border-[#4a7a54] bg-[#4a7a54] text-[#e1d59d]'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBannerCommand('underline')}
                  >
                    U
                  </button>
                </div>

                <div
                  ref={bannerEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/40 min-h-[120px] bg-white"
                  onInput={(e) => {
                    const html = (e.target as HTMLDivElement).innerHTML;
                    setBannerText(html);
                    refreshBannerToolbarState();
                  }}
                  onKeyUp={refreshBannerToolbarState}
                  onMouseUp={refreshBannerToolbarState}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lien cliquable du bandeau (optionnel)
                </label>
                <input
                  type="url"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/40"
                  placeholder="https://votre-lien.fr/promo"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Si renseigné, l&apos;ensemble du bandeau sera cliquable et mènera vers cette URL.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={bannerEnabled}
                    onChange={(e) => setBannerEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#4a7a54] border-slate-300 rounded focus:ring-[#4a7a54]"
                  />
                  <span className="text-sm text-slate-700">Afficher le bandeau sur le site</span>
                </label>

                <button
                  type="submit"
                  disabled={bannerSaving}
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#4a7a54] hover:bg-[#3b6344] disabled:bg-slate-400 text-[#e1d59d] text-sm font-semibold transition-colors"
                >
                  {bannerSaving ? 'Enregistrement...' : 'Enregistrer le bandeau'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">
                {editingRealization ? 'Modifier la réalisation' : 'Nouvelle réalisation'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Images du projet (jusqu'à 4)
                </label>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Image 1 – couverture *</p>
                    {formData.image_url && (
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={formData.image_url}
                          alt="Aperçu couverture"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 1);
                      }}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Image 2 (optionnelle)</p>
                    {formData.image_url_2 && (
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={formData.image_url_2}
                          alt="Aperçu image 2"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url_2: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 2);
                      }}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Image 3 (optionnelle)</p>
                    {formData.image_url_3 && (
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={formData.image_url_3}
                          alt="Aperçu image 3"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url_3: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 3);
                      }}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Image 4 (optionnelle)</p>
                    {formData.image_url_4 && (
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={formData.image_url_4}
                          alt="Aperçu image 4"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url_4: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 4);
                      }}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="published" className="ml-2 text-sm font-medium text-slate-700">
                  Publier immédiatement
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {editingRealization ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
