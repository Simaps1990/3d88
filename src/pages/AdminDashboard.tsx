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
  const [activeTab, setActiveTab] = useState<'realizations' | 'contents' | 'bandeau'>('realizations');
  const [realizations, setRealizations] = useState<Realization[]>([]);
  const [siteTexts, setSiteTexts] = useState<SiteText[]>([]);
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
    } else {
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

  const handleAboutImageUpload = async (file: File, text: SiteText) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-about.${ext}`;

    const { data, error } = await supabase.storage.from('realizations').upload(fileName, file);
    if (error || !data?.path) {
      console.error('Erreur upload image À propos', error);
      return;
    }

    const { data: publicData } = supabase.storage.from('realizations').getPublicUrl(data.path);
    const url = publicData?.publicUrl || '';

    const updated: SiteText = { ...text, value: url };
    setSiteTexts((current) =>
      current.map((t) => (t.key === text.key ? updated : t))
    );

    setSavingKey(text.key);
    await supabase
      .from('site_texts')
      .upsert({
        key: updated.key,
        value: updated.value,
        description: updated.description,
      });
    setSavingKey(null);
  };

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

  const handleSiteTextChange = (key: string, value: string) => {
    setSiteTexts((current) =>
      current.map((text) => (text.key === key ? { ...text, value } : text))
    );
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
          <div className="flex items-center justify-between h-20">
            <a href="/" className="flex items-center space-x-3">
              <img src="/LOGOngsans.png" alt="3D88" className="h-16 w-auto object-contain" />
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
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#4a7a54]"
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
            <div className="mt-3 flex flex-col space-y-4 md:hidden">
              {/* Bloc retour au site */}
              <div className="border-b border-slate-800 pb-4">
                <a
                  href="/"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/40 text-white hover:bg-white/10"
                >
                  Retour au site
                </a>
              </div>

              {/* Bloc onglets backoffice */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('realizations');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    activeTab === 'realizations'
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-transparent text-white border-white/20 hover:bg-white/5'
                  }`}
                >
                  Réalisations
                </button>
                <button
                  onClick={() => {
                    setActiveTab('contents');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    activeTab === 'contents'
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-transparent text-white border-white/20 hover:bg-white/5'
                  }`}
                >
                  Contenus
                </button>
                <button
                  onClick={() => {
                    setActiveTab('bandeau');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'bandeau'
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-transparent text-white border-white/20 hover:bg-white/5'
                  }`}
                >
                  Bandeau
                </button>
              </div>

              {/* Bloc déconnexion */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-3 mb-8">
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
        </div>

        {activeTab === 'realizations' && (
          <div className="max-w-5xl mx-auto">
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

        {activeTab === 'contents' && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Contenus du site</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-3xl">
              Modifiez ici les textes affichés sur le site (hero, sections, footer, etc.).
            </p>

            {siteTexts.length === 0 ? (
              <p className="text-slate-500">Aucun contenu n'est encore défini dans la table site_texts.</p>
            ) : (
              <div className="space-y-8">
                {(() => {
                  const groups = siteTexts.reduce<Record<string, SiteText[]>>((acc, text) => {
                    const [prefix] = text.key.split('_');
                    const section = prefix || 'other';
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(text);
                    return acc;
                  }, {});

                  const orderedSections = [
                    'hero',
                    'services',
                    'about',
                    'realizations',
                    'contact',
                    'footer',
                    'nav',
                    'legal',
                    'meta',
                    'other',
                  ];

                  const sectionLabels: Record<string, string> = {
                    hero: "Page d'accueil – Hero",
                    services: 'Section Services',
                    about: 'Section À propos',
                    realizations: 'Section Réalisations',
                    contact: 'Section Contact',
                    footer: 'Pied de page',
                    nav: 'Navigation / Menu',
                    legal: 'Page Mentions légales',
                    meta: 'SEO / Meta données',
                    other: 'Autres contenus',
                  };

                  return orderedSections
                    .filter((section) => groups[section] && groups[section].length > 0)
                    .map((section) => {
                      const texts = groups[section];
                      const label = sectionLabels[section] || 'Autres contenus';

                      return (
                        <section key={section} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                            <span className="text-xs uppercase tracking-wide text-slate-400 font-mono">
                              {section}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {texts.map((text) => (
                              <div
                                key={text.key}
                                className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-mono text-xs text-slate-500">{text.key}</span>
                                    </div>
                                    {text.description && (
                                      <p className="text-xs text-slate-500 mb-2">{text.description}</p>
                                    )}

                                    {text.key === 'about_image_url' ? (
                                      <div className="space-y-3">
                                        {text.value && (
                                          <div className="flex items-center space-x-3">
                                            <img
                                              src={text.value}
                                              alt="Aperçu image À propos"
                                              className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                                            />
                                            <span className="text-xs text-slate-500 break-all max-w-xs">
                                              {text.value}
                                            </span>
                                          </div>
                                        )}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              void handleAboutImageUpload(file, text);
                                            }
                                          }}
                                          className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                                        />
                                      </div>
                                    ) : (
                                      <textarea
                                        value={text.value}
                                        onChange={(e) => handleSiteTextChange(text.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[80px]"
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end space-y-2">
                                    <button
                                      onClick={() => handleSaveSiteText(text)}
                                      disabled={savingKey === text.key}
                                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                      {savingKey === text.key ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    });
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bandeau' && (
          <div className="max-w-5xl mx-auto mt-4">
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
