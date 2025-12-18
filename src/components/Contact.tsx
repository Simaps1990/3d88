import { useState, useRef, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useSiteText } from '../hooks/useSiteText';
import { Mail, Phone, MapPin, Send, FileUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function Contact() {
  const MAX_EMAIL_ATTACHMENT_BYTES = 4 * 1024 * 1024;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = useSiteText('contact_title', 'Demander un Devis');
  const subtitle = useSiteText('contact_subtitle', 'Un projet en tête ? Contactez-moi pour en discuter');
  const contactEmail = useSiteText('contact_email', '3d88.contact@gmail.com');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const fileToBase64 = (inputFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const result = String(reader.result || '');
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.readAsDataURL(inputFile);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let fileUrl = null;
      let fileName = null;
      let emailAttachment: { filename: string; content: string; contentType?: string; size: number } | null = null;

      if (file) {
        if (file.size <= MAX_EMAIL_ATTACHMENT_BYTES) {
          const base64 = await fileToBase64(file);
          emailAttachment = {
            filename: file.name,
            content: base64,
            contentType: file.type || undefined,
            size: file.size,
          };
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('quote-files')
          .upload(filePath, file);

        if (uploadError) {
          if (uploadError.message.includes('not found')) {
            const { error: bucketError } = await supabase.storage.createBucket('quote-files', {
              public: false,
            });

            if (!bucketError) {
              const { error: retryError } = await supabase.storage
                .from('quote-files')
                .upload(filePath, file);

              if (retryError) throw retryError;
            } else {
              throw bucketError;
            }
          } else {
            throw uploadError;
          }
        }

        const { data: { publicUrl } } = supabase.storage
          .from('quote-files')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
          file_url: fileUrl,
          file_name: fileName,
          status: 'nouveau'
        });

      if (insertError) {
        console.warn('Insertion quote_requests échouée, on continue avec envoi email:', insertError);
      }

      const subject = 'Nouvelle demande de devis depuis 3D88';
      const html = `
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background: #f8fafc; padding: 20px;">
            <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background: #0e6e40; color: #ffffff; padding: 20px;">
                <h1 style="margin: 0; font-size: 18px;">Nouvelle demande via le formulaire de contact</h1>
                <p style="margin: 6px 0 0 0; font-size: 14px; opacity: .95;">Site : 3D88</p>
              </div>
              <div style="padding: 20px;">
                <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a;">Informations client</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #64748b; width: 160px;">Nom</td><td style="padding: 6px 0;">${formData.name}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;"><a href="mailto:${formData.email}">${formData.email}</a></td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Téléphone</td><td style="padding: 6px 0;">${formData.phone || '—'}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0;">${new Date().toLocaleString('fr-FR')}</td></tr>
                </table>

                <h2 style="margin: 18px 0 12px 0; font-size: 16px; color: #0f172a;">Message</h2>
                <div style="white-space: pre-wrap; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">${formData.message}</div>

                <h2 style="margin: 18px 0 12px 0; font-size: 16px; color: #0f172a;">Fichier</h2>
                <p style="margin: 0;">
                  ${fileName ? `${fileName}${fileUrl ? ` – <a href="${fileUrl}">lien</a>` : ''}` : 'Aucun fichier joint'}
                </p>

                <p style="margin: 18px 0 0 0; color: #64748b; font-size: 12px;">
                  Réponds directement à cet email : le Reply-To est configuré sur l'adresse du client.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          html,
          replyTo: formData.email,
          attachment: emailAttachment,
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || `Erreur envoi email (HTTP ${response.status})`);
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-[#101b14] via-[#18271e] to-[#101b14] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="space-y-8 bg-[#101b14]/90 border border-[#18271e] rounded-2xl p-6 shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-[#4a7a54]/20">
                  <Mail className="w-6 h-6 text-[#e1d59d]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Email</h3>
                  <p className="text-slate-300">{contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-[#4a7a54]/20">
                  <Phone className="w-6 h-6 text-[#e1d59d]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Téléphone</h3>
                  <p className="text-slate-300">+33 6 12 34 56 78</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-[#4a7a54]/20">
                  <MapPin className="w-6 h-6 text-[#e1d59d]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Localisation</h3>
                  <p className="text-slate-300">France</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-[#18271e]/90 rounded-xl border border-[#4a7a54]/40">
                <h3 className="text-lg font-semibold text-white mb-3">Formats acceptés</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  STL, OBJ, STEP, 3MF, PDF, PNG, JPG
                  <br />
                  Taille maximale : 10 MB
                </p>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <form onSubmit={handleSubmit} className="space-y-6 bg-[#101b14]/90 border border-[#18271e] rounded-2xl p-6 shadow-xl">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#e1d59d]/60 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/50 transition-all"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#e1d59d]/60 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/50 transition-all"
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#e1d59d]/60 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/50 transition-all"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[#e1d59d]/60 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/50 transition-all resize-none"
                  placeholder="Décrivez votre projet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Fichier (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                    accept=".stl,.obj,.step,.3mf,.pdf,.png,.jpg,.jpeg"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-lg text-white hover:border-[#4a7a54] hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <FileUp className="w-5 h-5 mr-2 group-hover:text-[#e1d59d] transition-colors" />
                    {file ? file.name : 'Cliquez pour ajouter un fichier'}
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 px-4 py-3 rounded-lg border border-green-500/20">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Votre demande a été envoyée avec succès !</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-[#0e6e40] hover:bg-[#3caa35] disabled:bg-slate-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#3caa35]/50 disabled:transform-none disabled:shadow-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Envoyer la demande</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
