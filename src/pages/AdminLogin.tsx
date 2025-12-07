import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Printer, LogIn, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      console.error('Supabase auth error', error);
      setError(error.message || 'Email ou mot de passe incorrect');
      setLoading(false);
    } else {
      window.location.href = '/admin';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101b14] via-[#18271e] to-[#101b14] flex justify-center pt-10 px-6">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-2">
          <img src="/LOGOng.png" alt="3D88" className="w-56 h-56 mx-auto mb-0 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-2">Espace Admin</h1>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/50 transition-all"
                placeholder="admin@admin.fr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#4a7a54] focus:ring-2 focus:ring-[#4a7a54]/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#0e6e40] hover:bg-[#3caa35] disabled:bg-slate-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#3caa35]/50 disabled:transform-none disabled:shadow-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Connexion...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Retour au site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
