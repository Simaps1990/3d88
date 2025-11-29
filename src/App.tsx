import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import RealizationsPage from './pages/RealizationsPage';
import LegalMentions from './pages/LegalMentions';
import CookieConsent from './components/CookieConsent';

function App() {
  const path = window.location.pathname;

  const isAdminRoute = path === '/admin' || path === '/admin/login';

  return (
    <AuthProvider>
      {!isAdminRoute && <CookieConsent />}
      {path === '/admin/login' ? (
        <AdminLogin />
      ) : path === '/mentions-legales' ? (
        <LegalMentions />
      ) : path === '/realisations' ? (
        <RealizationsPage />
      ) : path === '/admin' ? (
        <AdminDashboard />
      ) : (
        <Home />
      )}
    </AuthProvider>
  );
}

export default App;
